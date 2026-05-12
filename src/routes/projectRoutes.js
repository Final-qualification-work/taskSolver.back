const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const projectController = require('../controllers/projectController');

router.use(authenticate);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Получить все проекты
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список проектов
 */
router.get('/', projectController.getAllProjects);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Создать новый проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [planning, active, completed, on_hold]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               budget:
 *                 type: number
 *     responses:
 *       201:
 *         description: Проект создан
 */
router.post('/', authorize('admin', 'project_manager'), projectController.createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Получить проект по ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Информация о проекте
 */
router.get('/:id', projectController.getProjectById);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Обновить проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               budget:
 *                 type: number
 *     responses:
 *       200:
 *         description: Проект обновлен
 */
router.put('/:id', projectController.updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Удалить проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Проект удален
 */
router.delete('/:id', authorize('admin'), projectController.deleteProject);

/**
 * @swagger
 * /api/projects/{id}/tasks:
 *   get:
 *     summary: Получить задачи проекта
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Список задач проекта
 */
router.get('/:id/tasks', projectController.getProjectTasks);

/**
 * @swagger
 * /api/projects/{id}/tasks:
 *   post:
 *     summary: Добавить задачу в проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       201:
 *         description: Задача добавлена
 */
router.post('/:id/tasks', authorize('admin', 'project_manager', 'team_lead'), projectController.addTaskToProject);

/**
 * @swagger
 * /api/projects/{id}/statistics:
 *   get:
 *     summary: Получить статистику проекта
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Статистика проекта
 */
router.get('/:id/statistics', projectController.getProjectStatistics);

module.exports = router;