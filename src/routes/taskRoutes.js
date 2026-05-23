const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate, authorize, denyViewer } = require('../middleware/auth');

const optimizationRoles = ['admin', 'project_manager', 'team_lead'];

router.use(authenticate);

router.post('/', denyViewer, taskController.createTask);
router.get('/', taskController.getAllTasks);
router.get('/statistics', taskController.getTaskStatistics);
router.get(
    '/export',
    authorize('admin', 'project_manager', 'team_lead', 'viewer'),
    taskController.exportTasks
);
router.get(
    '/optimize',
    authorize(...optimizationRoles),
    taskController.optimizeAssignment
);
router.post(
    '/optimize/apply',
    authorize(...optimizationRoles),
    taskController.applyOptimizationSolution
);
router.post('/bulk-update', denyViewer, taskController.bulkUpdateTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', denyViewer, taskController.updateTask);
router.delete('/:id', denyViewer, taskController.deleteTask);

module.exports = router;
