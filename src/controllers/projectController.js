const { Project, Task, User, Team } = require('../models/index');
const { sequelize } = require('../config/database');

// @desc    Получить все проекты
// @route   GET /api/projects
const getAllProjects = async (req, res) => {
    try {
        const where = {};
        
        // Не-admin видят только свои проекты
        if (req.user.role !== 'admin') {
            where.createdBy = req.user.id;
        }
        
        const projects = await Project.findAll({
            where,
            include: [
                { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
                { model: Task, as: 'tasks', required: false }
            ],
            order: [['createdAt', 'DESC']]
        });
        
        // Добавляем статистику по проектам
        const projectsWithStats = projects.map(project => {
            const projectJSON = project.toJSON();
            const tasks = projectJSON.tasks || [];
            projectJSON.stats = {
                totalTasks: tasks.length,
                completedTasks: tasks.filter(t => t.status === 'done').length,
                inProgressTasks: tasks.filter(t => t.status === 'in progress').length,
                backlogTasks: tasks.filter(t => t.status === 'backlog').length,
                completionRate: tasks.length ? ((tasks.filter(t => t.status === 'done').length / tasks.length) * 100).toFixed(1) : 0
            };
            delete projectJSON.tasks;
            return projectJSON;
        });
        
        res.status(200).json({ success: true, data: projectsWithStats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Получить проект по ID
// @route   GET /api/projects/:id
const getProjectById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const project = await Project.findByPk(id, {
            include: [
                { model: User, as: 'creator', attributes: ['id', 'username', 'email'] },
                { 
                    model: Task, 
                    as: 'tasks',
                    include: [{ model: Team, as: 'assignedTeam' }]
                }
            ]
        });
        
        if (!project) {
            return res.status(404).json({ success: false, message: 'Проект не найден' });
        }
        
        // Проверка прав: admin или создатель проекта
        if (req.user.role !== 'admin' && project.createdBy !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Доступ запрещен' });
        }
        
        const projectJSON = project.toJSON();
        const tasks = projectJSON.tasks || [];
        projectJSON.stats = {
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'done').length,
            inProgressTasks: tasks.filter(t => t.status === 'in progress').length,
            backlogTasks: tasks.filter(t => t.status === 'backlog').length,
            totalComplexity: tasks.reduce((sum, t) => sum + t.complexity, 0),
            completionRate: tasks.length ? ((tasks.filter(t => t.status === 'done').length / tasks.length) * 100).toFixed(1) : 0
        };
        
        res.status(200).json({ success: true, data: projectJSON });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Создать проект
// @route   POST /api/projects
const createProject = async (req, res) => {
    try {
        const { name, description, status, startDate, endDate, budget, teamIds } = req.body;
        
        const project = await Project.create({
            name,
            description: description || null,
            status: status || 'planning',
            startDate: startDate || null,
            endDate: endDate || null,
            budget: budget || null,
            teamIds: teamIds || [],
            createdBy: req.user.id
        });
        
        res.status(201).json({ 
            success: true, 
            data: project,
            message: 'Проект успешно создан'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Обновить проект
// @route   PUT /api/projects/:id
const updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Проект не найден' });
        }
        
        // Проверка прав
        if (req.user.role !== 'admin' && project.createdBy !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Доступ запрещен' });
        }
        
        const { name, description, status, startDate, endDate, budget, teamIds } = req.body;
        const updateData = {};
        
        if (name) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (status) updateData.status = status;
        if (startDate) updateData.startDate = startDate;
        if (endDate) updateData.endDate = endDate;
        if (budget !== undefined) updateData.budget = budget;
        if (teamIds) updateData.teamIds = teamIds;
        
        await project.update(updateData);
        
        const updatedProject = await Project.findByPk(id, {
            include: [{ model: User, as: 'creator', attributes: ['id', 'username'] }]
        });
        
        res.status(200).json({ 
            success: true, 
            data: updatedProject,
            message: 'Проект успешно обновлен'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Удалить проект
// @route   DELETE /api/projects/:id
const deleteProject = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Проект не найден' });
        }
        
        // Проверка прав
        if (req.user.role !== 'admin' && project.createdBy !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Доступ запрещен' });
        }
        
        // Удаляем связанные задачи
        await Task.update(
            { projectId: null },
            { where: { projectId: id }, transaction }
        );
        
        await project.destroy({ transaction });
        await transaction.commit();
        
        res.status(200).json({ 
            success: true, 
            message: 'Проект и связанные задачи успешно удалены'
        });
    } catch (error) {
        await transaction.rollback();
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Получить задачи проекта
// @route   GET /api/projects/:id/tasks
const getProjectTasks = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority } = req.query;
        
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Проект не найден' });
        }
        
        const where = { projectId: id };
        if (status) where.status = status;
        if (priority) where.business_priority = priority;
        
        const tasks = await Task.findAll({
            where,
            include: [{ model: Team, as: 'assignedTeam' }],
            order: [['business_priority', 'DESC'], ['deadline', 'ASC']]
        });
        
        res.status(200).json({ 
            success: true, 
            data: { project: project.name, tasks, count: tasks.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Добавить задачу в проект
// @route   POST /api/projects/:id/tasks
const addTaskToProject = async (req, res) => {
    try {
        const { id } = req.params;
        
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Проект не найден' });
        }
        
        const task = await Task.create({
            ...req.body,
            projectId: id,
            status: req.body.status || 'backlog'
        });
        
        const taskWithTeam = await Task.findByPk(task.id, {
            include: [{ model: Team, as: 'assignedTeam' }]
        });
        
        res.status(201).json({ 
            success: true, 
            data: taskWithTeam,
            message: 'Задача добавлена в проект'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Получить статистику проекта
// @route   GET /api/projects/:id/statistics
const getProjectStatistics = async (req, res) => {
    try {
        const { id } = req.params;
        
        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Проект не найден' });
        }
        
        const tasks = await Task.findAll({ where: { projectId: id } });
        const teams = await Team.findAll();
        
        let totalCost = 0;
        let assignedTasks = 0;
        
        for (const task of tasks) {
            if (task.assignedTeamId) {
                const team = teams.find(t => t.id === task.assignedTeamId);
                if (team) {
                    totalCost += task.complexity * team.cost;
                    assignedTasks++;
                }
            }
        }
        
        const statusStats = {
            backlog: tasks.filter(t => t.status === 'backlog').length,
            todo: tasks.filter(t => t.status === 'todo').length,
            in_progress: tasks.filter(t => t.status === 'in progress').length,
            done: tasks.filter(t => t.status === 'done').length
        };
        
        const priorityStats = {
            high: tasks.filter(t => t.business_priority === 3).length,
            medium: tasks.filter(t => t.business_priority === 2).length,
            low: tasks.filter(t => t.business_priority === 1).length
        };
        
        res.status(200).json({
            success: true,
            data: {
                project: {
                    id: project.id,
                    name: project.name,
                    status: project.status,
                    startDate: project.startDate,
                    endDate: project.endDate,
                    budget: project.budget
                },
                tasks: {
                    total: tasks.length,
                    assigned: assignedTasks,
                    unassigned: tasks.length - assignedTasks
                },
                statusStats,
                priorityStats,
                totalCost: totalCost.toFixed(0),
                completionRate: tasks.length ? ((statusStats.done / tasks.length) * 100).toFixed(1) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getProjectTasks,
    addTaskToProject,
    getProjectStatistics
};