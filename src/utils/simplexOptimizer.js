const { Team, Task } = require('../models/index');
const { sequelize } = require('../config/database');

class SimplexOptimizer {
    constructor(tasks, teams) {
        this.tasks = tasks;
        this.teams = teams;
        this.n = teams.length;
        this.m = tasks.length;
    }

    /**
     * Проверка совместимости задачи и команды по тегу
     */
    isCompatible(task, team) {
        return task.tag === team.tag;
    }

    /**
     * Нормализация значений критериев
     */
    normalizeValues() {
        const costs = [];
        const loads = [];
        const preferences = [];

        for (const task of this.tasks) {
            for (const team of this.teams) {
                if (this.isCompatible(task, team)) {
                    costs.push(task.complexity * team.cost);
                    loads.push(task.complexity / team.capacity);
                    const preference = (task.business_priority / 3) * 0.6 + 
                                      (1 - (team.cost / 5000)) * 0.4;
                    preferences.push(preference);
                }
            }
        }

        const minCost = Math.min(...costs);
        const maxCost = Math.max(...costs);
        const minLoad = Math.min(...loads);
        const maxLoad = Math.max(...loads);
        const minPref = Math.min(...preferences);
        const maxPref = Math.max(...preferences);

        return { minCost, maxCost, minLoad, maxLoad, minPref, maxPref };
    }

    /**
     * Расчет целевой функции для заданных весов
     */
    calculateObjective(weights) {
        const { alpha, beta, gamma } = weights;
        const { minCost, maxCost, minLoad, maxLoad, minPref, maxPref } = this.normalizeValues();
        
        const objective = [];
        
        for (const task of this.tasks) {
            for (const team of this.teams) {
                if (this.isCompatible(task, team)) {
                    const cost = task.complexity * team.cost;
                    const costNorm = (cost - minCost) / (maxCost - minCost);
                    
                    const load = task.complexity / team.capacity;
                    const loadNorm = (load - minLoad) / (maxLoad - minLoad);
                    
                    const preference = (task.business_priority / 3) * 0.6 + 
                                      (1 - (team.cost / 5000)) * 0.4;
                    const prefNorm = (preference - minPref) / (maxPref - minPref);
                    
                    objective.push(alpha * costNorm + beta * loadNorm - gamma * prefNorm);
                } else {
                    objective.push(999999); // Огромный штраф за несовместимость
                }
            }
        }

        return objective;
    }

    /**
     * Оптимальное распределение с учетом тегов
     */
    optimizeAssignment(weights) {
        const objective = this.calculateObjective(weights);
        
        // Создаем матрицу назначений
        const assignmentMatrix = Array(this.n).fill().map(() => Array(this.m).fill(0));
        
        // Отслеживаем загрузку команд
        const teamLoads = {};
        this.teams.forEach(team => {
            teamLoads[team.id] = 0;
        });

        // Отслеживаем, какие команды получили задачи
        const teamsWithTasks = new Set();
        const assignedTasks = new Set();
        
        // Группируем задачи по тегам
        const tasksByTag = {
            frontend: this.tasks.filter(t => t.tag === 'frontend'),
            backend: this.tasks.filter(t => t.tag === 'backend'),
            ML: this.tasks.filter(t => t.tag === 'ML')
        };
        
        // Группируем команды по тегам
        const teamsByTag = {
            frontend: this.teams.filter(t => t.tag === 'frontend'),
            backend: this.teams.filter(t => t.tag === 'backend'),
            ML: this.teams.filter(t => t.tag === 'ML')
        };

        console.log('\n📌 РАСПРЕДЕЛЕНИЕ ПО ТЕГАМ:');
        
        // Распределяем задачи для каждого тега отдельно
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
            
            // Сортируем задачи по приоритету (сначала высокий приоритет и сложность)
            const sortedTasks = [...tagTasks].sort((a, b) => {
                const scoreA = a.business_priority * a.complexity;
                const scoreB = b.business_priority * b.complexity;
                return scoreB - scoreA;
            });
            
            // Копируем загрузку для этого тега
            const localTeamLoads = {};
            tagTeams.forEach(team => {
                localTeamLoads[team.id] = teamLoads[team.id];
            });
            
            // Шаг 1: Каждая команда получает хотя бы одну задачу (если задач достаточно)
            if (tagTasks.length >= tagTeams.length) {
                console.log(`   Шаг 1: Обеспечиваем минимум одну задачу каждой команде`);
                
                for (const team of tagTeams) {
                    // Ищем подходящую задачу для этой команды
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
            
            // Шаг 2: Распределяем оставшиеся задачи
            console.log(`   Шаг 2: Распределяем оставшиеся задачи`);
            
            for (const task of sortedTasks) {
                if (assignedTasks.has(task.id)) continue;
                
                // Находим доступные команды для этой задачи
                const availableTeams = tagTeams.filter(team => 
                    localTeamLoads[team.id] + task.complexity <= team.capacity
                );
                
                if (availableTeams.length > 0) {
                    // Выбираем команду с минимальным значением целевой функции
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

        // Проверка результатов
        const assignedTaskCount = assignedTasks.size;
        const allTasksAssigned = assignedTaskCount === this.m;
        
        // Проверка, что у каждой команды есть хотя бы одна задача
        const teamsWithoutTasks = this.teams.filter(team => !teamsWithTasks.has(team.id));
        
        console.log('\n📊 РЕЗУЛЬТАТ РАСПРЕДЕЛЕНИЯ:');
        console.log(`   Назначено задач: ${assignedTaskCount} из ${this.m}`);
        console.log(`   Команд без задач: ${teamsWithoutTasks.length}`);
        
        if (teamsWithoutTasks.length > 0) {
            console.log(`      (${teamsWithoutTasks.map(t => t.name).join(', ')})`);
        }

        return { assignmentMatrix, teamLoads, allTasksAssigned };
    }

    /**
     * Расчет метрик для решения
     */
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
                    
                    // Проверка совместимости по тегу
                    if (!this.isCompatible(task, team)) {
                        console.error(`ОШИБКА: Задача "${task.name}" (${task.tag}) назначена команде "${team.name}" (${team.tag})!`);
                        continue;
                    }
                    
                    const cost = task.complexity * team.cost;
                    totalCost += cost;
                    
                    const preference = (task.business_priority / 3) * 0.6 + 
                                      (1 - (team.cost / 5000)) * 0.4;
                    totalPreference += preference;
                    
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

    /**
     * Создание таблицы назначений
     */
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

    /**
     * Поиск Парето-оптимальных решений
     */
    findParetoFront() {
        const solutions = [];
        
        const weightCombinations = [
            { alpha: 0.8, beta: 0.1, gamma: 0.1, name: 'Минимизация стоимости' },
            { alpha: 0.6, beta: 0.3, gamma: 0.1, name: 'Умеренная экономия' },
            { alpha: 0.4, beta: 0.4, gamma: 0.2, name: 'Компромиссное решение' },
            { alpha: 0.3, beta: 0.6, gamma: 0.1, name: 'Акцент на разгрузке' },
            { alpha: 0.1, beta: 0.7, gamma: 0.2, name: 'Акцент на качестве' },
            { alpha: 0.1, beta: 0.2, gamma: 0.7, name: 'Максимум предпочтительности' }
        ];

        for (const weights of weightCombinations) {
            console.log(`\n🔄 Оптимизация для весов ${weights.alpha}:${weights.beta}:${weights.gamma} (${weights.name})`);
            console.log('=' .repeat(60));
            
            const { assignmentMatrix, teamLoads, allTasksAssigned } = this.optimizeAssignment(weights);
            
            const metrics = this.calculateMetrics(assignmentMatrix, teamLoads);
            const assignmentTable = this.createAssignmentTable(assignmentMatrix);
            
            // Проверка на корректность назначений по тегам
            let hasTagErrors = false;
            for (const assign of metrics.assignments) {
                if (assign.taskTag !== assign.teamTag) {
                    hasTagErrors = true;
                    console.error(`❌ ОШИБКА ТЕГА: ${assign.taskName} (${assign.taskTag}) → ${assign.teamName} (${assign.teamTag})`);
                }
            }
            
            if (!hasTagErrors) {
                solutions.push({
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

    /**
     * Полная оптимизация
     */
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

    /**
     * Сохранение лучшего решения в БД
     */
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

module.exports = SimplexOptimizer;