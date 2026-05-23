const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticate, authorize, denyViewer } = require('../middleware/auth');

const teamManageRoles = ['admin', 'project_manager'];

router.use(authenticate);

router.post('/', denyViewer, authorize(...teamManageRoles), teamController.createTeam);

router.get('/', teamController.getAllTeams);

router.get('/load', teamController.getTeamLoad);

router.get('/:id', teamController.getTeamById);

router.put('/:id', denyViewer, authorize(...teamManageRoles), teamController.updateTeam);

router.delete('/:id', denyViewer, authorize(...teamManageRoles), teamController.deleteTeam);

router.get('/:id/tasks', teamController.getTeamTasks);
module.exports = router;
