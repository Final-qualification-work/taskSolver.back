const express = require('express');
const router = express.Router();
const { authenticate, authorize, denyViewer } = require('../middleware/auth');
const projectController = require('../controllers/projectController');

router.use(authenticate);

router.get('/', projectController.getAllProjects);

router.post('/', authorize('admin', 'project_manager'), projectController.createProject);

router.get('/:id', projectController.getProjectById);

router.put('/:id', denyViewer, projectController.updateProject);

router.delete('/:id', authorize('admin'), projectController.deleteProject);

router.get('/:id/tasks', projectController.getProjectTasks);

router.post('/:id/tasks', denyViewer, projectController.addTaskToProject);

router.get('/:id/statistics', projectController.getProjectStatistics);

module.exports = router;
