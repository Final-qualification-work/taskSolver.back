const { Team, Task } = require('../models/index');
const { Op } = require('sequelize');

// Создание команды
exports.createTeam = async (req, res) => {
    try {
        const team = await Team.create(req.body);
        
        res.status(201).json({
            success: true,
            data: team,
            message: 'Команда успешно создана'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Получение всех команд с фильтрацией
exports.getAllTeams = async (req, res) => {
    try {
        const { tag, minLoad, maxLoad } = req.query;
        
        const where = {};
        if (tag) where.tag = tag;
        
        // Фильтр по загрузке
        if (minLoad || maxLoad) {
            where.currentLoad = {};
            if (minLoad) where.currentLoad[Op.gte] = parseInt(minLoad);
            if (maxLoad) where.currentLoad[Op.lte] = parseInt(maxLoad);
        }
        
        const teams = await Team.findAll({
            where,
            include: [{
                model: Task,
                as: 'tasks',
                required: false
            }],
            order: [['name', 'ASC']]
        });
        
        // Добавляем процент загрузки
        const teamsWithStats = teams.map(team => {
            const teamData = team.toJSON();
            teamData.loadPercentage = (team.currentLoad / team.capacity) * 100;
            teamData.availableCapacity = team.capacity - team.currentLoad;
            teamData.tasksCount = team.tasks?.length || 0;
            return teamData;
        });
        
        res.status(200).json({
            success: true,
            count: teamsWithStats.length,
            data: teamsWithStats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Получение команды по ID
exports.getTeamById = async (req, res) => {
    try {
        const team = await Team.findByPk(req.params.id, {
            include: [{
                model: Task,
                as: 'tasks'
            }]
        });
        
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Команда не найдена'
            });
        }
        
        const teamData = team.toJSON();
        teamData.loadPercentage = (team.currentLoad / team.capacity) * 100;
        teamData.availableCapacity = team.capacity - team.currentLoad;
        
        res.status(200).json({
            success: true,
            data: teamData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Обновление команды
exports.updateTeam = async (req, res) => {
    try {
        const team = await Team.findByPk(req.params.id);
        
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Команда не найдена'
            });
        }
        
        await team.update(req.body);
        
        res.status(200).json({
            success: true,
            data: team,
            message: 'Команда успешно обновлена'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Удаление команды
exports.deleteTeam = async (req, res) => {
    try {
        const team = await Team.findByPk(req.params.id);
        
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Команда не найдена'
            });
        }
        
        // Проверяем, есть ли назначенные задачи
        const assignedTasks = await Task.count({
            where: { assignedTeamId: team.id }
        });
        
        if (assignedTasks > 0) {
            return res.status(400).json({
                success: false,
                message: 'Нельзя удалить команду с назначенными задачами'
            });
        }
        
        await team.destroy();
        
        res.status(200).json({
            success: true,
            message: 'Команда успешно удалена'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Получение загрузки всех команд
exports.getTeamLoad = async (req, res) => {
    try {
        const teams = await Team.findAll({
            attributes: ['id', 'name', 'tag', 'capacity', 'currentLoad'],
            order: [['currentLoad', 'DESC']]
        });
        
        const loadData = teams.map(team => ({
            id: team.id,
            name: team.name,
            tag: team.tag,
            capacity: team.capacity,
            currentLoad: team.currentLoad,
            available: team.capacity - team.currentLoad,
            loadPercentage: ((team.currentLoad / team.capacity) * 100).toFixed(2)
        }));
        
        res.status(200).json({
            success: true,
            data: loadData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};