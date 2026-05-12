const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const visualizationController = require('../controllers/visualizationController');
const preferenceController = require('../controllers/preferenceController');

// Защищенные маршруты (требуют авторизации)
router.use(authenticate);

// Визуализация
router.get('/load-chart', visualizationController.getLoadChart);
router.get('/task-distribution', visualizationController.getTaskDistributionChart);
router.get('/dashboard', visualizationController.getDashboardAnalytics);
router.get('/pareto-front', visualizationController.getParetoFrontVisualization);

// Предпочтения пользователя
router.get('/preferences', preferenceController.getUserPreferences);
router.put('/preferences', preferenceController.updateUserPreferences);
router.get('/recommendations', preferenceController.getPersonalizedRecommendations);

module.exports = router;