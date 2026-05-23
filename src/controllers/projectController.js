const { Project, Task, User, Team } = require('../models/index');
const { sequelize } = require('../config/database');
const { withClampedBusinessPriority } = require('../utils/businessPriority');

const ROLES_VIEW_ALL_PROJECTS = ['admin', 'project_manager', 'team_lead', 'developer', 'viewer'];

function canViewAllProjects(role) {
    return ROLES_VIEW_ALL_PROJECTS.includes(role);
}

function canEditProject(user, project) {
    if (user.role === 'viewer') {
        return false;
    }
    if (user.role === 'admin' || user.role === 'project_manager') {
        return true;
    }
    return project.createdBy === user.id;
}

function assertProjectViewAccess(user, project, res) {
    if (!project) {
        res.status(404).json({ success: false, message: 'Проект не найден' });
        return false;
    }
    if (canViewAllProjects(user.role) || project.createdBy === user.id) {
        return true;
    }
    res.status(403).json({ success: false, message: 'Доступ запрещен' });
    return false;
}

const getAllProjects = async (req, res) => {
    try {
        const where = {};

        if (!canViewAllProjects(req.user.role)) {
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

        if (!assertProjectViewAccess(req.user, project, res)) {
            return;
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

const updateProject = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Проект не найден' });
        }

        if (!canEditProject(req.user, project)) {
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

const deleteProject = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { id } = req.params;

        const project = await Project.findByPk(id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Проект не найден' });
        }

        if (req.user.role !== 'admin' && project.createdBy !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Доступ запрещен' });
        }

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

const getProjectTasks = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority } = req.query;

        const project = await Project.findByPk(id);
        if (!assertProjectViewAccess(req.user, project, res)) {
            return;
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

const addTaskToProject = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findByPk(id);
        if (!assertProjectViewAccess(req.user, project, res)) {
            return;
        }

        const task = await Task.create(withClampedBusinessPriority({
            ...req.body,
            projectId: id,
            status: req.body.status || 'backlog'
        }));

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

const getProjectStatistics = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findByPk(id);
        if (!assertProjectViewAccess(req.user, project, res)) {
            return;
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
