const { Task, Team } = require('../models/index');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Создание задачи
exports.createTask = async (req, res) => {
    try {
        const task = await Task.create(req.body);
        
        // Загружаем связанную команду, если есть
        const taskWithTeam = await Task.findByPk(task.id, {
            include: [{
                model: Team,
                as: 'assignedTeam'
            }]
        });
        
        res.status(201).json({
            success: true,
            data: taskWithTeam,
            message: 'Задача успешно создана'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Получение всех задач с фильтрацией
exports.getAllTasks = async (req, res) => {
    try {
        const { status, tag, page = 1, limit = 10 } = req.query;
        
        // Построение условий фильтрации
        const where = {};
        if (status) where.status = status;
        if (tag) where.tag = tag;
        
        // Пагинация
        const offset = (page - 1) * limit;
        
        const tasks = await Task.findAndCountAll({
            where,
            include: [{
                model: Team,
                as: 'assignedTeam'
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['business_priority', 'DESC'], ['createdAt', 'DESC']]
        });
        
        res.status(200).json({
            success: true,
            count: tasks.count,
            totalPages: Math.ceil(tasks.count / limit),
            currentPage: parseInt(page),
            data: tasks.rows
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Получение задачи по ID
exports.getTaskById = async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id, {
            include: [{
                model: Team,
                as: 'assignedTeam'
            }]
        });
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Задача не найдена'
            });
        }
        
        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Обновление задачи
exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Задача не найдена'
            });
        }
        
        await task.update(req.body);
        
        // Загружаем обновленную задачу с командой
        const updatedTask = await Task.findByPk(task.id, {
            include: [{
                model: Team,
                as: 'assignedTeam'
            }]
        });
        
        res.status(200).json({
            success: true,
            data: updatedTask,
            message: 'Задача успешно обновлена'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Удаление задачи
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id);
        
        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Задача не найдена'
            });
        }
        
        await task.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Задача успешно удалена'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Алгоритм распределения задач
// @desc    Оптимизация распределения задач
// @route   GET /api/tasks/optimize
const optimizeAssignment = async (req, res) => {
    try {
        // Получаем все невыполненные задачи
        const tasks = await Task.findAll({
            where: {
                status: {
                    [Op.ne]: 'done'
                }
            }
        });

        // Получаем все команды
        const teams = await Team.findAll();

        if (teams.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Нет доступных команд для распределения'
            });
        }

        if (tasks.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Нет задач для распределения'
            });
        }

        // Импортируем оптимизатор
        const SimplexOptimizer = require('../utils/simplexOptimizer');
        
        // Создаем экземпляр оптимизатора
        const optimizer = new SimplexOptimizer(tasks, teams);
        
        // Запускаем оптимизацию
        const solutions = await optimizer.optimize();
        
        if (solutions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Не найдено допустимых решений (невозможно назначить все задачи)'
            });
        }
        
        // Сохраняем лучшее решение (компромиссное)
        const bestSolution = solutions[Math.floor(solutions.length / 2)];
        await optimizer.saveBestSolution(bestSolution);
        
        // Форматируем результат
        const formattedResults = solutions.map((solution, idx) => {
            // Таблица назначений в удобном формате
            const assignmentTable = {
                teams: solution.assignmentTable.headers.teams,
                tasks: solution.assignmentTable.headers.tasks,
                matrix: solution.assignmentTable.matrix,
                details: solution.assignmentTable.rows.map(row => ({
                    team: row.teamName,
                    assignedTasks: row.assignments.filter(a => a.assigned).map(a => a.taskName)
                }))
            };
            
            return {
                point: String.fromCharCode(65 + idx),
                name: solution.name,
                weights: {
                    alpha: solution.weights.alpha,
                    beta: solution.weights.beta,
                    gamma: solution.weights.gamma
                },
                metrics: {
                    totalCost: solution.totalCost.toFixed(2),
                    maxLoad: (solution.maxLoad * 100).toFixed(1),
                    maxLoadValue: solution.maxLoad.toFixed(3),
                    totalPreference: solution.totalPreference.toFixed(1)
                },
                assignmentTable: assignmentTable,
                assignments: solution.assignments.map(a => ({
                    taskName: a.taskName,
                    teamName: a.teamName,
                    complexity: a.complexity,
                    cost: a.cost
                })),
                teamLoads: Object.entries(solution.teamLoads).map(([teamId, load]) => {
                    const team = teams.find(t => t.id == teamId);
                    return {
                        teamName: team ? team.name : 'Unknown',
                        load: load,
                        capacity: team ? team.capacity : 0,
                        percentage: team ? ((load / team.capacity) * 100).toFixed(1) : 0
                    };
                })
            };
        });

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalTeams: teams.length,
                    totalTasks: tasks.length,
                    solutionsCount: solutions.length,
                    bestSolution: formattedResults[Math.floor(formattedResults.length / 2)]
                },
                paretoFront: formattedResults
            },
            message: 'Оптимизация выполнена успешно. Все задачи назначены, каждая команда получила минимум одну задачу.'
        });
    } catch (error) {
        console.error('Ошибка при оптимизации:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Ошибка при выполнении оптимизации'
        });
    }
};

// Функция генерации рекомендаций
function generateRecommendations(paretoSolutions) {
    if (paretoSolutions.length === 0) return [];
    
    const recommendations = [];
    
    // Рекомендация для минимальной стоимости
    const minCost = paretoSolutions[0];
    recommendations.push({
        scenario: 'Минимизация стоимости',
        weights: minCost.weights,
        expectedCost: minCost.totalCost,
        expectedLoad: (minCost.maxLoad * 100).toFixed(1) + '%',
        expectedPreference: minCost.totalPreference.toFixed(1)
    });
    
    // Рекомендация для сбалансированного решения
    const balancedIndex = Math.floor(paretoSolutions.length / 2);
    const balanced = paretoSolutions[balancedIndex];
    recommendations.push({
        scenario: 'Сбалансированное решение',
        weights: balanced.weights,
        expectedCost: balanced.totalCost,
        expectedLoad: (balanced.maxLoad * 100).toFixed(1) + '%',
        expectedPreference: balanced.totalPreference.toFixed(1)
    });
    
    // Рекомендация для минимальной загрузки
    const minLoad = paretoSolutions.reduce((min, s) => 
        s.maxLoad < min.maxLoad ? s : min, paretoSolutions[0]);
    recommendations.push({
        scenario: 'Минимизация загрузки',
        weights: minLoad.weights,
        expectedCost: minLoad.totalCost,
        expectedLoad: (minLoad.maxLoad * 100).toFixed(1) + '%',
        expectedPreference: minLoad.totalPreference.toFixed(1)
    });
    
    // Рекомендация для максимальной предпочтительности
    const maxPref = paretoSolutions[paretoSolutions.length - 1];
    recommendations.push({
        scenario: 'Максимизация предпочтительности',
        weights: maxPref.weights,
        expectedCost: maxPref.totalCost,
        expectedLoad: (maxPref.maxLoad * 100).toFixed(1) + '%',
        expectedPreference: maxPref.totalPreference.toFixed(1)
    });
    
    return recommendations;
}

// Статистика по задачам
exports.getTaskStatistics = async (req, res) => {
    try {
        const totalTasks = await Task.count();
        const tasksByStatus = await Task.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('status')), 'count']
            ],
            group: ['status']
        });
        
        const tasksByTag = await Task.findAll({
            attributes: [
                'tag',
                [sequelize.fn('COUNT', sequelize.col('tag')), 'count']
            ],
            group: ['tag']
        });
        
        const averageComplexity = await Task.findAll({
            attributes: [
                [sequelize.fn('AVG', sequelize.col('complexity')), 'avg_complexity']
            ]
        });
        
        res.status(200).json({
            success: true,
            data: {
                total: totalTasks,
                byStatus: tasksByStatus,
                byTag: tasksByTag,
                averageComplexity: averageComplexity[0]?.dataValues.avg_complexity || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};