const { Team, Task } = require('../models/index');
const { sequelize } = require('../config/database');

class Optimizer {
    constructor(tasks, teams) {
        this.tasks = tasks;
        this.teams = teams;
        this.n = teams.length;
        this.m = tasks.length;
    }

    static taskPreference(task) {
        const p = Math.round(Number(task.business_priority));
        if (!Number.isFinite(p)) return 1;
        return Math.min(3, Math.max(1, p));
    }

    static preferenceNorm(task) {
        return (Optimizer.taskPreference(task) - 1) / 2;
    }

    isCompatible(task, team) {
        return task.tag === team.tag;
    }

    normalizeValues() {
        const costs = [];
        const loads = [];

        for (const task of this.tasks) {
            for (const team of this.teams) {
                if (this.isCompatible(task, team)) {
                    costs.push(task.complexity * team.cost);
                    loads.push(task.complexity / team.capacity);
                }
            }
        }

        const minCost = Math.min(...costs);
        const maxCost = Math.max(...costs);
        const minLoad = Math.min(...loads);
        const maxLoad = Math.max(...loads);

        return { minCost, maxCost, minLoad, maxLoad };
    }

    calculateObjective(weights) {
        const { alpha, beta, gamma } = weights;
        const { minCost, maxCost, minLoad, maxLoad } = this.normalizeValues();
        const costDenom = maxCost - minCost || 1;
        const loadDenom = maxLoad - minLoad || 1;

        const objective = [];

        for (const task of this.tasks) {
            const prefNorm = Optimizer.preferenceNorm(task);

            for (const team of this.teams) {
                if (this.isCompatible(task, team)) {
                    const cost = task.complexity * team.cost;
                    const costNorm = (cost - minCost) / costDenom;

                    const load = task.complexity / team.capacity;
                    const loadNorm = (load - minLoad) / loadDenom;

                    objective.push(alpha * costNorm + beta * loadNorm - gamma * prefNorm);
                } else {
                    objective.push(999999);
                }
            }
        }

        return objective;
    }

    optimizeAssignment(weights) {
        const objective = this.calculateObjective(weights);

        const assignmentMatrix = Array(this.n).fill().map(() => Array(this.m).fill(0));

        const teamLoads = {};
        this.teams.forEach(team => {
            teamLoads[team.id] = 0;
        });

        const teamsWithTasks = new Set();
        const assignedTasks = new Set();

        const tasksByTag = {
            frontend: this.tasks.filter(t => t.tag === 'frontend'),
            backend: this.tasks.filter(t => t.tag === 'backend'),
            ML: this.tasks.filter(t => t.tag === 'ML')
        };

        const teamsByTag = {
            frontend: this.teams.filter(t => t.tag === 'frontend'),
            backend: this.teams.filter(t => t.tag === 'backend'),
            ML: this.teams.filter(t => t.tag === 'ML')
        };

        console.log('\n📌 РАСПРЕДЕЛЕНИЕ ПО ТЕГАМ:');

        for (const tag of ['frontend', 'backend', 'ML']) {
            const tagTasks = tasksByTag[tag];
            const tagTeams = teamsByTag[tag];

            if (tagTasks.length === 0) {
                console.log(`\n${tag.toUpperCase()}: нет задач`);
                continue;
            }

            if (tagTeams.length === 0) {
                console.log(`\n${tag.toUpperCase()}: нет команд для выполнения задач!`);
                continue;
            }

            console.log(`\n${tag.toUpperCase()}: ${tagTasks.length} задач, ${tagTeams.length} команд`);

            const sortedTasks = [...tagTasks].sort((a, b) => {
                const scoreA = a.business_priority * a.complexity;
                const scoreB = b.business_priority * b.complexity;
                return scoreB - scoreA;
            });

            const localTeamLoads = {};
            tagTeams.forEach(team => {
                localTeamLoads[team.id] = teamLoads[team.id];
            });

            if (tagTasks.length >= tagTeams.length) {
                console.log(`   Шаг 1: Обеспечиваем минимум одну задачу каждой команде`);

                for (const team of tagTeams) {

                    let bestTask = null;
                    let bestScore = Infinity;

                    for (const task of sortedTasks) {
                        if (assignedTasks.has(task.id)) continue;

                        if (localTeamLoads[team.id] + task.complexity <= team.capacity) {
                            const taskIndex = this.tasks.findIndex(t => t.id === task.id);
                            const teamIndex = this.teams.findIndex(t => t.id === team.id);
                            const objValue = objective[taskIndex * this.n + teamIndex];

                            if (objValue < bestScore) {
                                bestScore = objValue;
                                bestTask = task;
                            }
                        }
                    }

                    if (bestTask) {
                        const taskIndex = this.tasks.findIndex(t => t.id === bestTask.id);
                        const teamIndex = this.teams.findIndex(t => t.id === team.id);

                        assignmentMatrix[teamIndex][taskIndex] = 1;
                        localTeamLoads[team.id] += bestTask.complexity;
                        teamLoads[team.id] = localTeamLoads[team.id];
                        assignedTasks.add(bestTask.id);
                        teamsWithTasks.add(team.id);

                        const priorityIcon = bestTask.business_priority === 3 ? '🔴' :
                                           bestTask.business_priority === 2 ? '🟡' : '🔵';
                        console.log(`      ${priorityIcon} "${bestTask.name.substring(0, 30)}" → ${team.name}`);
                    }
                }
            }

            console.log(`   Шаг 2: Распределяем оставшиеся задачи`);

            for (const task of sortedTasks) {
                if (assignedTasks.has(task.id)) continue;

                const availableTeams = tagTeams.filter(team =>
                    localTeamLoads[team.id] + task.complexity <= team.capacity
                );

                if (availableTeams.length > 0) {

                    let bestTeam = availableTeams[0];
                    let bestScore = Infinity;

                    for (const team of availableTeams) {
                        const taskIndex = this.tasks.findIndex(t => t.id === task.id);
                        const teamIndex = this.teams.findIndex(t => t.id === team.id);
                        const objValue = objective[taskIndex * this.n + teamIndex];

                        if (objValue < bestScore) {
                            bestScore = objValue;
                            bestTeam = team;
                        }
                    }

                    const taskIndex = this.tasks.findIndex(t => t.id === task.id);
                    const teamIndex = this.teams.findIndex(t => t.id === bestTeam.id);

                    assignmentMatrix[teamIndex][taskIndex] = 1;
                    localTeamLoads[bestTeam.id] += task.complexity;
                    teamLoads[bestTeam.id] = localTeamLoads[bestTeam.id];
                    assignedTasks.add(task.id);
                    teamsWithTasks.add(bestTeam.id);

                    const priorityIcon = task.business_priority === 3 ? '🔴' :
                                       task.business_priority === 2 ? '🟡' : '🔵';
                    console.log(`      ${priorityIcon} "${task.name.substring(0, 30)}" → ${bestTeam.name}`);
                } else {
                    console.log(`      ⚠️  Нет места для "${task.name.substring(0, 30)}"`);
                }
            }
        }

        const assignedTaskCount = assignedTasks.size;
        const allTasksAssigned = assignedTaskCount === this.m;

        const teamsWithoutTasks = this.teams.filter(team => !teamsWithTasks.has(team.id));

        console.log('\n📊 РЕЗУЛЬТАТ РАСПРЕДЕЛЕНИЯ:');
        console.log(`   Назначено задач: ${assignedTaskCount} из ${this.m}`);
        console.log(`   Команд без задач: ${teamsWithoutTasks.length}`);

        if (teamsWithoutTasks.length > 0) {
            console.log(`      (${teamsWithoutTasks.map(t => t.name).join(', ')})`);
        }

        return { assignmentMatrix, teamLoads, allTasksAssigned };
    }

    calculateMetrics(assignmentMatrix, teamLoads) {
        let totalCost = 0;
        let totalPreference = 0;
        let maxLoad = 0;

        const assignments = [];

        for (let i = 0; i < this.n; i++) {
            const team = this.teams[i];
            const load = teamLoads[team.id] || 0;
            const loadPercent = load / team.capacity;
            maxLoad = Math.max(maxLoad, loadPercent);

            for (let j = 0; j < this.m; j++) {
                if (assignmentMatrix[i][j] === 1) {
                    const task = this.tasks[j];

                    if (!this.isCompatible(task, team)) {
                        console.error(`ОШИБКА: Задача "${task.name}" (${task.tag}) назначена команде "${team.name}" (${team.tag})!`);
                        continue;
                    }

                    const cost = task.complexity * team.cost;
                    totalCost += cost;

                    totalPreference += Optimizer.taskPreference(task);

                    assignments.push({
                        taskId: task.id,
                        taskName: task.name,
                        taskTag: task.tag,
                        teamId: team.id,
                        teamName: team.name,
                        teamTag: team.tag,
                        complexity: task.complexity,
                        cost: cost,
                        priority: task.business_priority
                    });
                }
            }
        }

        return {
            totalCost: totalCost,
            maxLoad: maxLoad,
            totalPreference: totalPreference,
            assignments: assignments,
            teamLoads: teamLoads
        };
    }

    createAssignmentTable(assignmentMatrix) {
        const table = {
            headers: {
                teams: this.teams.map(t => `${t.name} (${t.tag})`),
                tasks: this.tasks.map(t => `${t.name.substring(0, 20)} [${t.tag}]`)
            },
            matrix: [],
            rows: []
        };

        for (let i = 0; i < this.n; i++) {
            const row = {
                teamId: this.teams[i].id,
                teamName: this.teams[i].name,
                teamTag: this.teams[i].tag,
                assignments: []
            };

            const matrixRow = [];

            for (let j = 0; j < this.m; j++) {
                const assigned = assignmentMatrix[i][j];
                matrixRow.push(assigned);
                row.assignments.push({
                    taskId: this.tasks[j].id,
                    taskName: this.tasks[j].name,
                    taskTag: this.tasks[j].tag,
                    assigned: assigned === 1
                });
            }

            table.matrix.push(matrixRow);
            table.rows.push(row);
        }

        return table;
    }

    findParetoFront() {
        const solutions = [];

        const weightCombinations = [
            { alpha: 0.8,  beta: 0.1,  gamma: 0.1,  name: 'Минимизация стоимости', point: 'A' },
            { alpha: 0.33, beta: 0.33, gamma: 0.34, name: 'Равный баланс', point: 'C' },
            { alpha: 0.3,  beta: 0.6,  gamma: 0.1,  name: 'Акцент на разгрузке', point: 'D' },
            { alpha: 0.1,  beta: 0.2,  gamma: 0.7,  name: 'Максимум приоритета', point: 'F' }
        ];

        for (const weights of weightCombinations) {
            console.log(`\n🔄 Оптимизация для весов ${weights.alpha}:${weights.beta}:${weights.gamma} (${weights.name})`);
            console.log('=' .repeat(60));

            const { assignmentMatrix, teamLoads, allTasksAssigned } = this.optimizeAssignment(weights);

            const metrics = this.calculateMetrics(assignmentMatrix, teamLoads);
            const assignmentTable = this.createAssignmentTable(assignmentMatrix);

            let hasTagErrors = false;
            for (const assign of metrics.assignments) {
                if (assign.taskTag !== assign.teamTag) {
                    hasTagErrors = true;
                    console.error(`❌ ОШИБКА ТЕГА: ${assign.taskName} (${assign.taskTag}) → ${assign.teamName} (${assign.teamTag})`);
                }
            }

            if (!hasTagErrors) {
                solutions.push({
                    point: weights.point,
                    weights,
                    name: weights.name,
                    ...metrics,
                    assignmentMatrix,
                    assignmentTable,
                    allTasksAssigned
                });
            } else {
                console.log(`   ⚠️  Решение пропущено из-за ошибок тегов`);
            }
        }

        return solutions;
    }

    async optimize() {
        console.log('\n🧮 ЗАПУСК ОПТИМИЗАЦИИ С УЧЕТОМ ТЕГОВ');
        console.log('=============================================\n');

        console.log(`📊 Исходные данные:`);
        console.log(`   Команд: ${this.teams.length}`);
        console.log(`   Задач: ${this.m}`);

        console.log('\n📋 Распределение по тегам:');
        const frontendTasks = this.tasks.filter(t => t.tag === 'frontend').length;
        const backendTasks = this.tasks.filter(t => t.tag === 'backend').length;
        const mlTasks = this.tasks.filter(t => t.tag === 'ML').length;

        const frontendTeams = this.teams.filter(t => t.tag === 'frontend').length;
        const backendTeams = this.teams.filter(t => t.tag === 'backend').length;
        const mlTeams = this.teams.filter(t => t.tag === 'ML').length;

        console.log(`   FRONTEND: ${frontendTasks} задач / ${frontendTeams} команд`);
        console.log(`   BACKEND: ${backendTasks} задач / ${backendTeams} команд`);
        console.log(`   ML: ${mlTasks} задач / ${mlTeams} команд`);

        const solutions = this.findParetoFront();

        console.log(`\n📈 Получено ${solutions.length} корректных решений\n`);

        return solutions;
    }

    optimizeWithWeights(userWeights) {
        const { alpha, beta, gamma } = userWeights;
        return this.optimizeAssignment({ alpha, beta, gamma });
    }

    async saveBestSolution(solution) {
        const transaction = await sequelize.transaction();

        try {
            await Task.update({ assignedTeamId: null, status: 'backlog' }, {
                where: {},
                transaction
            });
            await Team.update({ currentLoad: 0 }, {
                where: {},
                transaction
            });

            for (const assignment of solution.assignments) {
                await Task.update({
                    assignedTeamId: assignment.teamId,
                    status: 'in progress'
                }, {
                    where: { id: assignment.taskId },
                    transaction
                });
            }

            for (const [teamId, load] of Object.entries(solution.teamLoads)) {
                await Team.update({
                    currentLoad: load
                }, {
                    where: { id: teamId },
                    transaction
                });
            }

            await transaction.commit();
            console.log('✅ Результаты оптимизации сохранены в БД');

            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Ошибка сохранения:', error);
            throw error;
        }
    }
}

module.exports = Optimizer;
