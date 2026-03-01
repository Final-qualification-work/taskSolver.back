const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.post('/', taskController.createTask);
router.get('/', taskController.getAllTasks);
router.get('/statistics', taskController.getTaskStatistics);
router.get('/optimize', taskController.optimizeAssignment);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;