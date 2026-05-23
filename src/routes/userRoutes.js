const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.use(authenticate);

router.get('/me', userController.getMe);

router.get('/', authorize('admin'), userController.getAllUsers);

router.get('/:id', userController.getUserById);

router.post('/', authorize('admin'), userController.createUser);

router.put('/:id', userController.updateUser);

router.delete('/:id', authorize('admin'), userController.deleteUser);

module.exports = router;
