const { Task, Team } = require('../models/index');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { Parser } = require('json2csv');
const { clampBusinessPriority, withClampedBusinessPriority } = require('../utils/businessPriority');
const Optimizer = require('../utils/optimizer');

exports.createTask = async (req, res) => {
    try {
        const task = await Task.create(withClampedBusinessPriority(req.body));

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

exports.getAllTasks = async (req, res) => {
    try {
        const {
            status,
            tag,
            page = 1,
            limit = 10,
            assignedTeamId,
            projectId,
            priority_min,
            priority_max,
            sort_by = 'business_priority',
            sort_order = 'DESC',
        } = req.query;

        const where = {};
        if (status) where.status = status;
        if (tag) where.tag = tag;
        if (assignedTeamId) where.assigned_team_id = assignedTeamId;
        if (projectId) where.project_id = projectId;
        if (priority_min || priority_max) {
            where.business_priority = {};
            if (priority_min) where.business_priority[Op.gte] = parseInt(priority_min, 10);
            if (priority_max) where.business_priority[Op.lte] = parseInt(priority_max, 10);
        }

        const allowedSort = ['business_priority', 'complexity', 'deadline', 'name', 'createdAt', 'updatedAt'];
        const sortField = allowedSort.includes(sort_by) ? sort_by : 'business_priority';
        const sortDir = String(sort_order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const offset = (page - 1) * limit;

        const tasks = await Task.findAndCountAll({
            where,
            include: [{
                model: Team,
                as: 'assignedTeam'
            }],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            order: [[sortField, sortDir]]
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

exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findByPk(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Задача не найдена'
            });
        }

        await task.update(withClampedBusinessPriority(req.body));

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

        const averageComplexity = await Task.findOne({
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
                averageComplexity: averageComplexity?.dataValues.avg_complexity || 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.optimizeAssignment = async (req, res) => {
    try {
        const tasks = await Task.findAll({
            where: {
                status: {
                    [Op.ne]: 'done'
                }
            }
        });

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

        const optimizer = new Optimizer(tasks, teams);
        const solutions = await optimizer.optimize();

        if (solutions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Не найдено допустимых решений'
            });
        }

        const formattedResults = solutions.map((solution, idx) => {
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
                point: solution.point || String.fromCharCode(65 + idx),
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
                    solutionsCount: solutions.length
                },
                paretoFront: formattedResults
            },
            message: 'Оптимизация выполнена успешно. Выберите одно из решений для применения'
        });
    } catch (error) {
        console.error('Ошибка при оптимизации:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Ошибка при выполнении оптимизации'
        });
    }
};

exports.applyOptimizationSolution = async (req, res) => {
    try {
        const { point } = req.body;
        if (!point || typeof point !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Необходимо передать point (A-F)'
            });
        }

        const tasks = await Task.findAll({
            where: {
                status: {
                    [Op.ne]: 'done'
                }
            }
        });
        const teams = await Team.findAll();

        if (teams.length === 0 || tasks.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Недостаточно данных для применения решения'
            });
        }

        const optimizer = new Optimizer(tasks, teams);
        const solutions = await optimizer.optimize();
        const selected = solutions.find(
            (s) => (s.point || '').toUpperCase() === point.toUpperCase()
        );

        if (!selected) {
            return res.status(404).json({
                success: false,
                message: `Решение ${point} не найдено`
            });
        }

        await optimizer.saveBestSolution(selected);

        res.status(200).json({
            success: true,
            data: {
                point: point.toUpperCase(),
                name: selected.name
            },
            message: `Решение ${point.toUpperCase()} успешно применено`
        });
    } catch (error) {
        console.error('Ошибка применения решения:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Ошибка при применении решения'
        });
    }
};

exports.bulkUpdateTasks = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { updates } = req.body;

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Необходимо предоставить массив updates'
            });
        }

        const results = {
            success: [],
            failed: []
        };

        for (const update of updates) {
            try {
                const task = await Task.findByPk(update.taskId, { transaction });

                if (!task) {
                    results.failed.push({ taskId: update.taskId, reason: 'Задача не найдена' });
                    continue;
                }

                const allowedFields = ['status', 'assignedTeamId', 'business_priority'];
                const updateData = {};

                for (const field of allowedFields) {
                    if (update[field] !== undefined) {
                        updateData[field] = field === 'business_priority'
                            ? clampBusinessPriority(update[field])
                            : update[field];
                    }
                }

                await task.update(updateData, { transaction });
                results.success.push({ taskId: update.taskId, updated: updateData });
            } catch (err) {
                results.failed.push({ taskId: update.taskId, reason: err.message });
            }
        }

        await transaction.commit();

        res.status(200).json({
            success: true,
            data: results,
            message: `Обновлено ${results.success.length} из ${updates.length} задач`
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Ошибка:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.exportTasks = async (req, res) => {
    try {
        const { format = 'csv', status, tag } = req.query;

        const where = {};
        if (status) where.status = status;
        if (tag) where.tag = tag;

        const tasks = await Task.findAll({
            where,
            include: [{ model: Team, as: 'assignedTeam', required: false }]
        });

        const exportData = tasks.map(task => ({
            'ID': task.id,
            'Название': task.name,
            'Описание': task.description,
            'Тег': task.tag,
            'Сложность (поинты)': task.complexity,
            'Приоритет (1-3)': task.business_priority,
            'Статус': task.status,
            'Дедлайн': task.deadline.toISOString().split('T')[0],
            'Назначенная команда': task.assignedTeam?.name || 'Не назначена',
            'Стоимость': task.assignedTeam ? task.complexity * task.assignedTeam.cost : 0
        }));

        if (format === 'json') {
            return res.status(200).json({
                success: true,
                data: exportData,
                count: exportData.length
            });
        }

        const parser = new Parser({ withBOM: true });
        const csv = parser.parse(exportData);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=tasks_export_${new Date().toISOString().split('T')[0]}.csv`);
        res.status(200).send(csv);

    } catch (error) {
        console.error('Ошибка:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
