const { UserPreference, User, Team } = require('../models/index');

// Получить предпочтения пользователя
exports.getUserPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        let preferences = await UserPreference.findOne({ where: { userId } });
        
        if (!preferences) {
            preferences = await UserPreference.create({ userId });
        }
        
        res.status(200).json({ success: true, data: preferences });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Обновить предпочтения
exports.updateUserPreferences = async (req, res) => {
    try {
        const userId = req.user.id;
        const allowedFields = ['weightCost', 'weightLoad', 'weightPreference', 
                               'maxLoadThreshold', 'minPreferenceThreshold', 
                               'preferredTeamIds', 'preferredTags'];
        
        let preferences = await UserPreference.findOne({ where: { userId } });
        
        if (!preferences) {
            preferences = await UserPreference.create({ userId });
        }
        
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        }
        
        await preferences.update(updateData);
        
        res.status(200).json({ success: true, data: preferences });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Получить персонализированные рекомендации
exports.getPersonalizedRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const preferences = await UserPreference.findOne({ where: { userId } });
        
        if (!preferences) {
            return res.status(404).json({ success: false, message: 'Предпочтения не найдены' });
        }
        
        // Нормализуем веса
        const totalWeight = preferences.weightCost + preferences.weightLoad + preferences.weightPreference;
        const weights = {
            alpha: preferences.weightCost / totalWeight,
            beta: preferences.weightLoad / totalWeight,
            gamma: preferences.weightPreference / totalWeight
        };
        
        // Получаем задачи
        const tasks = await Task.findAll({
            where: { status: { [require('sequelize').Op.ne]: 'done' } }
        });
        
        // Получаем команды
        const teams = await Team.findAll();
        
        // Фильтруем команды по предпочтениям
        let filteredTeams = teams;
        if (preferences.preferredTeamIds && preferences.preferredTeamIds.length > 0) {
            filteredTeams = teams.filter(t => preferences.preferredTeamIds.includes(t.id));
        }
        
        // Запускаем оптимизацию с персонализированными весами
        const SimplexOptimizer = require('../utils/simplexOptimizer');
        const optimizer = new SimplexOptimizer(tasks, filteredTeams);
        
        // Используем веса пользователя
        const solution = optimizer.optimizeWithWeights(weights);
        
        res.status(200).json({
            success: true,
            data: {
                userWeights: weights,
                thresholds: {
                    maxLoad: preferences.maxLoadThreshold,
                    minPreference: preferences.minPreferenceThreshold
                },
                recommendedSolution: solution
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};