const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Team:
 *       type: object
 *       required:
 *         - name
 *         - tag
 *         - cost
 *         - capacity
 *       properties:
 *         id:
 *           type: integer
 *           description: ID команды
 *           example: 1
 *         name:
 *           type: string
 *           description: Название команды
 *           example: "Frontend Разработка"
 *         tag:
 *           type: string
 *           enum: [frontend, backend, ML]
 *           description: Специализация команды
 *           example: "frontend"
 *         cost:
 *           type: number
 *           description: Стоимость часа работы
 *           example: 2000
 *         capacity:
 *           type: integer
 *           description: Максимальная вместимость в человеко-часах
 *           example: 40
 *         currentLoad:
 *           type: integer
 *           description: Текущая загрузка
 *           example: 0
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата обновления
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Ошибка при выполнении запроса"
 */

/**
 * @swagger
 * /api/teams:
 *   post:
 *     summary: Создать новую команду
 *     tags: [Teams]
 *     description: Создает новую команду с указанными параметрами
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - tag
 *               - cost
 *               - capacity
 *             properties:
 *               name:
 *                 type: string
 *                 description: Название команды (должно быть уникальным)
 *                 example: "Frontend Разработка"
 *               tag:
 *                 type: string
 *                 enum: [frontend, backend, ML]
 *                 description: Специализация команды
 *                 example: "frontend"
 *               cost:
 *                 type: number
 *                 description: Стоимость часа работы
 *                 example: 2000
 *               capacity:
 *                 type: integer
 *                 description: Максимальная вместимость
 *                 example: 40
 *     responses:
 *       201:
 *         description: Команда успешно создана
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *                 message:
 *                   type: string
 *                   example: "Команда успешно создана"
 *       400:
 *         description: Ошибка валидации или команда с таким именем уже существует
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.post('/', teamController.createTeam);

/**
 * @swagger
 * /api/teams:
 *   get:
 *     summary: Получить все команды
 *     tags: [Teams]
 *     description: Возвращает список всех команд с возможностью фильтрации
 *     parameters:
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *           enum: [frontend, backend, ML]
 *         description: Фильтр по специализации команды
 *         example: "frontend"
 *       - in: query
 *         name: minLoad
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Минимальная загрузка
 *         example: 10
 *       - in: query
 *         name: maxLoad
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Максимальная загрузка
 *         example: 30
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Поиск по названию команды
 *         example: "Frontend"
 *     responses:
 *       200:
 *         description: Список команд
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Team'
 *                       - type: object
 *                         properties:
 *                           loadPercentage:
 *                             type: string
 *                             description: Процент загрузки
 *                             example: "45.50"
 *                           availableCapacity:
 *                             type: integer
 *                             description: Доступная вместимость
 *                             example: 22
 *                           tasksCount:
 *                             type: integer
 *                             description: Количество назначенных задач
 *                             example: 3
 *                           isOverloaded:
 *                             type: boolean
 *                             description: Перегружена ли команда
 *                             example: false
 *                           isUnderloaded:
 *                             type: boolean
 *                             description: Недогружена ли команда
 *                             example: true
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get('/', teamController.getAllTeams);

/**
 * @swagger
 * /api/teams/load:
 *   get:
 *     summary: Получить информацию о загрузке всех команд
 *     tags: [Teams]
 *     description: Возвращает детальную информацию о текущей загрузке каждой команды
 *     responses:
 *       200:
 *         description: Информация о загрузке команд
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: "Frontend Разработка"
 *                       tag:
 *                         type: string
 *                         example: "frontend"
 *                       capacity:
 *                         type: integer
 *                         example: 40
 *                       currentLoad:
 *                         type: integer
 *                         example: 15
 *                       available:
 *                         type: integer
 *                         example: 25
 *                       loadPercentage:
 *                         type: string
 *                         example: "37.50"
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get('/load', teamController.getTeamLoad);

/**
 * @swagger
 * /api/teams/{id}:
 *   get:
 *     summary: Получить команду по ID
 *     tags: [Teams]
 *     description: Возвращает детальную информацию о конкретной команде
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID команды
 *         example: 1
 *     responses:
 *       200:
 *         description: Информация о команде
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Team'
 *                     - type: object
 *                       properties:
 *                         loadPercentage:
 *                           type: string
 *                           example: "37.50"
 *                         availableCapacity:
 *                           type: integer
 *                           example: 25
 *                         tasksStats:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                               example: 3
 *                             byStatus:
 *                               type: object
 *                               example: {"todo": 1, "in progress": 2}
 *                             totalComplexity:
 *                               type: integer
 *                               example: 15
 *                             averagePriority:
 *                               type: string
 *                               example: "7.33"
 *       404:
 *         description: Команда не найдена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.get('/:id', teamController.getTeamById);

/**
 * @swagger
 * /api/teams/{id}:
 *   put:
 *     summary: Обновить информацию о команде
 *     tags: [Teams]
 *     description: Обновляет данные существующей команды
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID команды
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
 *                 description: Новое название команды
 *                 example: "Frontend Pro Team"
 *               tag:
 *                 type: string
 *                 enum: [frontend, backend, ML]
 *                 description: Новая специализация
 *                 example: "frontend"
 *               cost:
 *                 type: number
 *                 description: Новая стоимость часа
 *                 example: 2500
 *               capacity:
 *                 type: integer
 *                 description: Новая вместимость
 *                 example: 45
 *     responses:
 *       200:
 *         description: Команда успешно обновлена
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Team'
 *                 message:
 *                   type: string
 *                   example: "Команда успешно обновлена"
 *       400:
 *         description: Ошибка валидации или недостаточная вместимость
 *       404:
 *         description: Команда не найдена
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.put('/:id', teamController.updateTeam);

/**
 * @swagger
 * /api/teams/{id}:
 *   delete:
 *     summary: Удалить команду
 *     tags: [Teams]
 *     description: Удаляет команду, если у нее нет назначенных задач
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID команды
 *         example: 1
 *     responses:
 *       200:
 *         description: Команда успешно удалена
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
 *                   example: "Команда успешно удалена"
 *       400:
 *         description: Нельзя удалить команду с назначенными задачами
 *       404:
 *         description: Команда не найдена
 *       500:
 *         description: Внутренняя ошибка сервера
 */
router.delete('/:id', teamController.deleteTeam);

module.exports = router;