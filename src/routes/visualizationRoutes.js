const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const visualizationController = require('../controllers/visualizationController');
const preferenceController = require('../controllers/preferenceController');

router.use(authenticate);

router.get('/load-chart', visualizationController.getLoadChart);
router.get('/task-distribution', visualizationController.getTaskDistributionChart);
router.get('/dashboard', visualizationController.getDashboardAnalytics);
router.get(
    '/pareto-front',
    authorize('admin', 'project_manager', 'team_lead'),
    visualizationController.getParetoFrontVisualization
);

router.get(
    '/preferences',
    authorize('admin', 'project_manager', 'team_lead'),
    preferenceController.getUserPreferences
);
router.put(
    '/preferences',
    authorize('admin', 'project_manager', 'team_lead'),
    preferenceController.updateUserPreferences
);
router.get(
    '/recommendations',
    authorize('admin', 'project_manager', 'team_lead'),
    preferenceController.getPersonalizedRecommendations
);

module.exports = router;
