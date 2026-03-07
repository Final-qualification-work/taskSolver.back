const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - tag
 *         - complexity
 *         - deadline
 *         - business_priority
 *       properties:
 *         id:
 *           type: integer
 *           description: ID задачи
 *           example: 1
 *         name:
 *           type: string
 *           description: Название задачи
 *           example: "Разработать главную страницу"
 *         description:
 *           type: string
 *           description: Описание задачи
 *           example: "Создать адаптивную главную страницу с анимациями"
 *         tag:
 *           type: string
 *           enum: [frontend, backend, ML]
 *           description: Технологический тег задачи
 *           example: "frontend"
 *         complexity:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           description: Сложность задачи в story points
 *           example: 5
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: Срок выполнения задачи
 *           example: "2025-04-15T00:00:00.000Z"
 *         business_priority:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *           description: Приоритет для бизнеса
 *           example: 9
 *         status:
 *           type: string
 *           enum: [not groomed, backlog, todo, in progress, done]
 *           description: Текущий статус задачи
 *           example: "backlog"
 *         assignedTeamId:
 *           type: integer
 *           nullable: true
 *           description: ID назначенной команды
 *           example: null
 *         assignedTeam:
 *           type: object
 *           nullable: true
 *           description: Объект назначенной команды
 *           $ref: '#/components/schemas/Team'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата обновления
 */

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Создать новую задачу
 *     tags: [Tasks]
 *     description: Создает новую задачу с указанными параметрами
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - tag
 *               - complexity
 *               - deadline
 *               - business_priority
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название задачи
 *                 example: "Разработать главную страницу"
 *               description:
 *                 type: string
 *                 description: Описание задачи
 *                 example: "Создать адаптивную главную страницу с анимациями"
 *               tag:
 *                 type: string
 *                 enum: [frontend, backend, ML]
 *                 description: Технологический тег
 *                 example: "frontend"
 *               complexity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Сложность (1-10)
 *                 example: 5
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 description: Срок выполнения
 *                 example: "2025-04-15T00:00:00.000Z"
 *               business_priority:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Приоритет для бизнеса
 *                 example: 9
 *               status:
 *                 type: string
 *                 enum: [not groomed, backlog, todo, in progress, done]
 *                 description: Статус задачи (по умолчанию backlog)
 *                 example: "backlog"
 *     responses:
 *       201:
 *         description: Задача успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *                   example: "Задача успешно создана"
 *       400:
 *         description: Ошибка валидации
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post('/', taskController.createTask);

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Получить все задачи
 *     tags: [Tasks]
 *     description: Возвращает список всех задач с возможностью фильтрации и пагинации
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [not groomed, backlog, todo, in progress, done]
 *         description: Фильтр по статусу
 *         example: "backlog"
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *           enum: [frontend, backend, ML]
 *         description: Фильтр по тегу
 *         example: "frontend"
 *       - in: query
 *         name: priority_min
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *         description: Минимальный приоритет
 *         example: 5
 *       - in: query
 *         name: priority_max
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *         description: Максимальный приоритет
 *         example: 10
 *       - in: query
 *         name: complexity_min
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *         description: Минимальная сложность
 *         example: 3
 *       - in: query
 *         name: complexity_max
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 10
 *         description: Максимальная сложность
 *         example: 8
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Номер страницы
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Количество задач на странице
 *         example: 10
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, business_priority, complexity, deadline, name]
 *           default: createdAt
 *         description: Поле для сортировки
 *         example: "business_priority"
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Направление сортировки
 *         example: "DESC"
 *     responses:
 *       200:
 *         description: Список задач
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     totalPages:
 *                       type: integer
 *                       example: 3
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *                 filters:
 *                   type: object
 *                   properties:
 *                     applied:
 *                       type: object
 *                     available:
 *                       type: object
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get('/', taskController.getAllTasks);

/**
 * @swagger
 * /api/tasks/statistics:
 *   get:
 *     summary: Получить статистику по задачам
 *     tags: [Tasks]
 *     description: Возвращает различную статистику по задачам
 *     responses:
 *       200:
 *         description: Статистика задач
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     byStatus:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           status:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     byTag:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tag:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     averages:
 *                       type: object
 *                       properties:
 *                         complexity:
 *                           type: string
 *                           example: "5.67"
 *                         priority:
 *                           type: string
 *                           example: "7.23"
 *                     upcomingDeadlines:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                     unassignedTasks:
 *                       type: integer
 *                       example: 8
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get('/statistics', taskController.getTaskStatistics);

/**
 * @swagger
 * /api/tasks/optimize:
 *   get:
 *     summary: Оптимизировать распределение задач
 *     tags: [Tasks]
 *     description: Запускает алгоритм оптимизации распределения задач по командам
 *     responses:
 *       200:
 *         description: Результат оптимизации
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     assigned:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           taskId:
 *                             type: integer
 *                           taskName:
 *                             type: string
 *                           teamId:
 *                             type: integer
 *                           teamName:
 *                             type: string
 *                           teamTag:
 *                             type: string
 *                           complexity:
 *                             type: integer
 *                           cost:
 *                             type: number
 *                           loadAfterAssignment:
 *                             type: integer
 *                     unassigned:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           taskId:
 *                             type: integer
 *                           taskName:
 *                             type: string
 *                           reason:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalTasks:
 *                           type: integer
 *                         assignedCount:
 *                           type: integer
 *                         unassignedCount:
 *                           type: integer
 *                         totalCost:
 *                           type: number
 *                         averageLoad:
 *                           type: number
 *                         teamsLoad:
 *                           type: array
 *                           items:
 *                             type: object
 *                 message:
 *                   type: string
 *                   example: "Распределение выполнено успешно"
 *       400:
 *         description: Нет доступных команд
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get('/optimize', taskController.optimizeAssignment);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Получить задачу по ID
 *     tags: [Tasks]
 *     description: Возвращает детальную информацию о конкретной задаче
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID задачи
 *         example: 1
 *     responses:
 *       200:
 *         description: Информация о задаче
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Задача не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get('/:id', taskController.getTaskById);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Обновить задачу
 *     tags: [Tasks]
 *     description: Обновляет данные существующей задачи
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID задачи
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Новое название задачи
 *                 example: "Обновленная задача"
 *               description:
 *                 type: string
 *                 description: Новое описание
 *                 example: "Обновленное описание задачи"
 *               tag:
 *                 type: string
 *                 enum: [frontend, backend, ML]
 *                 description: Новый тег
 *                 example: "backend"
 *               complexity:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Новая сложность
 *                 example: 6
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 description: Новый срок
 *                 example: "2025-05-01T00:00:00.000Z"
 *               business_priority:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 description: Новый приоритет
 *                 example: 8
 *               status:
 *                 type: string
 *                 enum: [not groomed, backlog, todo, in progress, done]
 *                 description: Новый статус
 *                 example: "in progress"
 *               assignedTeamId:
 *                 type: integer
 *                 nullable: true
 *                 description: ID новой команды
 *                 example: 2
 *     responses:
 *       200:
 *         description: Задача успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 message:
 *                   type: string
 *                   example: "Задача успешно обновлена"
 *       400:
 *         description: Ошибка валидации
 *       404:
 *         description: Задача не найдена
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.put('/:id', taskController.updateTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Удалить задачу
 *     tags: [Tasks]
 *     description: Удаляет задачу из системы
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID задачи
 *         example: 1
 *     responses:
 *       200:
 *         description: Задача успешно удалена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Задача успешно удалена"
 *       404:
 *         description: Задача не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.delete('/:id', taskController.deleteTask);

module.exports = router;