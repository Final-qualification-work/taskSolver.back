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
exports.optimizeAssignment = async (req, res) => {
    const transaction = await require('../config/database').sequelize.transaction();
    
    try {
        // Получаем все невыполненные задачи
        const tasks = await Task.findAll({
            where: {
                status: {
                    [Op.ne]: 'done'
                }
            },
            transaction
        });
        
        // Получаем все команды
        const teams = await Team.findAll({ transaction });
        
        // Создаем объект для отслеживания загрузки команд
        const teamLoads = {};
        teams.forEach(team => {
            teamLoads[team.id] = team.currentLoad || 0;
        });
        
        // Сортируем задачи по приоритету (business_priority * complexity)
        const sortedTasks = tasks.sort((a, b) => {
            const priorityA = a.business_priority * a.complexity;
            const priorityB = b.business_priority * b.complexity;
            return priorityB - priorityA;
        });
        
        const assignments = [];
        
        for (const task of sortedTasks) {
            // Ищем подходящие команды по тегу и доступной вместимости
            const availableTeams = teams.filter(team => 
                team.tag === task.tag && 
                teamLoads[team.id] + task.complexity <= team.capacity
            );
            
            if (availableTeams.length > 0) {
                // Выбираем команду с наименьшей загрузкой
                const selectedTeam = availableTeams.reduce((min, team) => 
                    teamLoads[team.id] < teamLoads[min.id] ? team : min
                );
                
                assignments.push({
                    taskId: task.id,
                    taskName: task.name,
                    teamId: selectedTeam.id,
                    teamName: selectedTeam.name,
                    complexity: task.complexity,
                    cost: task.complexity * selectedTeam.cost
                });
                
                // Обновляем загрузку
                teamLoads[selectedTeam.id] += task.complexity;
                
                // Обновляем задачу в БД
                await task.update({
                    assignedTeamId: selectedTeam.id,
                    status: 'in progress'
                }, { transaction });
                
                // Обновляем загрузку команды
                await selectedTeam.update({
                    currentLoad: teamLoads[selectedTeam.id]
                }, { transaction });
            }
        }
        
        await transaction.commit();
        
        res.status(200).json({
            success: true,
            data: assignments,
            message: 'Распределение выполнено успешно'
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

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