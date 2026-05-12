const { Task, Team, Project } = require('../models/index');
const { sequelize } = require('../config/database');

// 1. Гистограмма загрузки исполнителей
exports.getLoadChart = async (req, res) => {
    try {
        const teams = await Team.findAll({
            include: [{ model: Task, as: 'tasks', required: false }]
        });
        
        const loadData = teams.map(team => {
            const currentLoad = team.currentLoad;
            const capacity = team.capacity;
            const loadPercentage = (currentLoad / capacity) * 100;
            
            // Определяем статус загрузки
            let status = 'normal';
            if (loadPercentage > 85) status = 'critical';
            else if (loadPercentage > 70) status = 'warning';
            else if (loadPercentage < 30) status = 'underloaded';
            
            return {
                teamId: team.id,
                teamName: team.name,
                tag: team.tag,
                currentLoad,
                capacity,
                loadPercentage: loadPercentage.toFixed(1),
                status,
                cost: team.cost,
                tasksCount: team.tasks?.length || 0
            };
        });
        
        // Сортировка по загрузке
        loadData.sort((a, b) => b.loadPercentage - a.loadPercentage);
        
        res.status(200).json({
            success: true,
            data: {
                chartType: 'bar',
                title: 'Загрузка команд',
                data: loadData,
                summary: {
                    averageLoad: (loadData.reduce((sum, t) => sum + parseFloat(t.loadPercentage), 0) / loadData.length).toFixed(1),
                    criticalTeams: loadData.filter(t => t.status === 'critical').length,
                    underloadedTeams: loadData.filter(t => t.status === 'underloaded').length
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. График распределения задач
exports.getTaskDistributionChart = async (req, res) => {
    try {
        const { projectId } = req.query;
        
        const where = {};
        if (projectId) where.projectId = projectId;
        
        const tasks = await Task.findAll({
            where,
            include: [{ model: Team, as: 'assignedTeam' }]
        });
        
        // Распределение по статусам
        const byStatus = {};
        // Распределение по тегам
        const byTag = {};
        // Распределение по командам
        const byTeam = {};
        // Распределение по приоритетам
        const byPriority = { 1: 0, 2: 0, 3: 0 };
        
        for (const task of tasks) {
            byStatus[task.status] = (byStatus[task.status] || 0) + 1;
            byTag[task.tag] = (byTag[task.tag] || 0) + 1;
            byPriority[task.business_priority] = (byPriority[task.business_priority] || 0) + 1;
            
            if (task.assignedTeam) {
                byTeam[task.assignedTeam.name] = (byTeam[task.assignedTeam.name] || 0) + 1;
            }
        }
        
        res.status(200).json({
            success: true,
            data: {
                byStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
                byTag: Object.entries(byTag).map(([name, value]) => ({ name, value })),
                byTeam: Object.entries(byTeam).map(([name, value]) => ({ name, value })),
                byPriority: Object.entries(byPriority).map(([priority, count]) => ({ 
                    priority: parseInt(priority), 
                    count,
                    label: priority === '3' ? 'Высокий' : priority === '2' ? 'Средний' : 'Низкий'
                })),
                total: tasks.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Аналитическая панель мониторинга
exports.getDashboardAnalytics = async (req, res) => {
    try {
        const teams = await Team.findAll();
        const tasks = await Task.findAll();
        const projects = await Project.findAll();
        
        // Общая статистика
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'done').length;
        const inProgressTasks = tasks.filter(t => t.status === 'in progress').length;
        const backlogTasks = tasks.filter(t => t.status === 'backlog').length;
        
        // Финансовая статистика
        let totalCost = 0;
        let estimatedCost = 0;
        
        for (const task of tasks) {
            if (task.assignedTeamId) {
                const team = teams.find(t => t.id === task.assignedTeamId);
                if (team) {
                    totalCost += task.complexity * team.cost;
                }
            }
            // Оценочная стоимость (если бы назначали по минимальной цене)
            const cheapestTeam = teams.filter(t => t.tag === task.tag)
                .sort((a, b) => a.cost - b.cost)[0];
            if (cheapestTeam) {
                estimatedCost += task.complexity * cheapestTeam.cost;
            }
        }
        
        // Статистика по проектам
        const projectStats = await Promise.all(projects.map(async (project) => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const completed = projectTasks.filter(t => t.status === 'done').length;
            return {
                id: project.id,
                name: project.name,
                status: project.status,
                totalTasks: projectTasks.length,
                completedTasks: completed,
                completionRate: projectTasks.length ? ((completed / projectTasks.length) * 100).toFixed(1) : 0,
                budget: project.budget,
                spent: projectTasks.reduce((sum, t) => {
                    const team = teams.find(team => team.id === t.assignedTeamId);
                    return sum + (team ? t.complexity * team.cost : 0);
                }, 0)
            };
        }));
        
        // Загрузка команд за последние периоды (тренды)
        const teamLoadHistory = teams.map(team => ({
            teamId: team.id,
            teamName: team.name,
            currentLoad: team.currentLoad,
            capacity: team.capacity,
            loadPercentage: ((team.currentLoad / team.capacity) * 100).toFixed(1),
            available: team.capacity - team.currentLoad
        }));
        
        // Ключевые метрики
        const metrics = {
            totalTeams: teams.length,
            totalProjects: projects.length,
            totalTasks,
            completionRate: totalTasks ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0,
            totalCost: totalCost.toFixed(0),
            estimatedSavings: (estimatedCost - totalCost).toFixed(0),
            averageLoad: (teamLoadHistory.reduce((sum, t) => sum + parseFloat(t.loadPercentage), 0) / teams.length).toFixed(1),
            efficiency: totalTasks ? ((inProgressTasks + completedTasks) / totalTasks * 100).toFixed(1) : 0
        };
        
        res.status(200).json({
            success: true,
            data: {
                metrics,
                teamLoadHistory,
                projectStats,
                taskStatus: {
                    completed: completedTasks,
                    inProgress: inProgressTasks,
                    backlog: backlogTasks,
                    total: totalTasks
                },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Парето-фронт для визуализации
exports.getParetoFrontVisualization = async (req, res) => {
    try {
        const tasks = await Task.findAll({
            where: { status: { [require('sequelize').Op.ne]: 'done' } }
        });
        const teams = await Team.findAll();
        
        const SimplexOptimizer = require('../utils/simplexOptimizer');
        const optimizer = new SimplexOptimizer(tasks, teams);
        const paretoSolutions = await optimizer.findParetoFront();
        
        // Форматируем для визуализации
        const paretoData = paretoSolutions.map((solution, idx) => ({
            point: String.fromCharCode(65 + idx),
            cost: solution.totalCost,
            load: (solution.maxLoad * 100).toFixed(1),
            preference: solution.totalPreference,
            weights: solution.weights
        }));
        
        res.status(200).json({
            success: true,
            data: {
                paretoFront: paretoData,
                chartConfig: {
                    xAxis: 'cost',
                    yAxis: 'load',
                    bubbleSize: 'preference'
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};