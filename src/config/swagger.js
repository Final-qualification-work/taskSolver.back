const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Task Management API',
            version: '2.0.0',
            description: `API для управления проектами, задачами и командами с многокритериальной оптимизацией.
            
**Возможности:**
- Управление проектами и задачами
- Многокритериальная оптимизация распределения (стоимость, загрузка, предпочтения)
- Визуализация данных (гистограммы, графики, дашборды)
- Персонализированные настройки пользователей
- Разграничение прав доступа (5 уровней)`,
            contact: {
                name: 'Support',
                email: 'support@example.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        tags: [
            { name: 'Auth', description: 'Аутентификация и регистрация' },
            { name: 'Users', description: 'Управление пользователями' },
            { name: 'Projects', description: 'Управление проектами' },
            { name: 'Teams', description: 'Управление командами' },
            { name: 'Tasks', description: 'Управление задачами' },
            { name: 'Optimization', description: 'Оптимизация распределения' },
            { name: 'Visualization', description: 'Визуализация данных' },
            { name: 'Preferences', description: 'Пользовательские предпочтения' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Введите токен: Bearer <token>'
                }
            },
            schemas: {
                Team: {
                    type: 'object',
                    required: ['name', 'tag', 'cost', 'capacity'],
                    properties: {
                        id: { type: 'integer', description: 'ID команды' },
                        name: { type: 'string', description: 'Название команды' },
                        tag: { type: 'string', enum: ['frontend', 'backend', 'ML'], description: 'Специализация' },
                        cost: { type: 'number', description: 'Стоимость часа в рублях' },
                        capacity: { type: 'integer', description: 'Вместимость в story points' },
                        currentLoad: { type: 'integer', description: 'Текущая загрузка' }
                    }
                },
                Task: {
                    type: 'object',
                    required: ['name', 'description', 'tag', 'complexity', 'deadline', 'business_priority'],
                    properties: {
                        id: { type: 'integer', description: 'ID задачи' },
                        name: { type: 'string', description: 'Название задачи' },
                        description: { type: 'string', description: 'Описание задачи' },
                        tag: { type: 'string', enum: ['frontend', 'backend', 'ML'], description: 'Технологический тег' },
                        complexity: { type: 'integer', minimum: 1, maximum: 10, description: 'Сложность в story points' },
                        deadline: { type: 'string', format: 'date-time', description: 'Срок выполнения' },
                        business_priority: { type: 'integer', minimum: 1, maximum: 3, description: 'Приоритет (1-3)' },
                        status: { type: 'string', enum: ['not groomed', 'backlog', 'todo', 'in progress', 'done'], description: 'Статус' },
                        assignedTeamId: { type: 'integer', nullable: true, description: 'ID назначенной команды' },
                        projectId: { type: 'integer', nullable: true, description: 'ID проекта' }
                    }
                },
                Project: {
                    type: 'object',
                    required: ['name', 'createdBy'],
                    properties: {
                        id: { type: 'integer', description: 'ID проекта' },
                        name: { type: 'string', description: 'Название проекта' },
                        description: { type: 'string', description: 'Описание проекта' },
                        status: { type: 'string', enum: ['planning', 'active', 'completed', 'on_hold'], description: 'Статус проекта' },
                        startDate: { type: 'string', format: 'date', description: 'Дата начала' },
                        endDate: { type: 'string', format: 'date', description: 'Дата окончания' },
                        budget: { type: 'number', description: 'Бюджет проекта' },
                        createdBy: { type: 'integer', description: 'ID создателя' }
                    }
                },
                User: {
                    type: 'object',
                    required: ['username', 'email', 'password', 'role'],
                    properties: {
                        id: { type: 'integer', description: 'ID пользователя' },
                        username: { type: 'string', description: 'Имя пользователя' },
                        email: { type: 'string', format: 'email', description: 'Email' },
                        role: { 
                            type: 'string', 
                            enum: ['admin', 'project_manager', 'team_lead', 'developer', 'viewer'],
                            description: 'Роль пользователя'
                        },
                        teamId: { type: 'integer', nullable: true, description: 'ID команды (для разработчика)' },
                        isActive: { type: 'boolean', description: 'Активен ли пользователь' }
                    }
                },
                UserPreferences: {
                    type: 'object',
                    properties: {
                        weightCost: { type: 'number', minimum: 0, maximum: 1, description: 'Вес стоимости' },
                        weightLoad: { type: 'number', minimum: 0, maximum: 1, description: 'Вес загрузки' },
                        weightPreference: { type: 'number', minimum: 0, maximum: 1, description: 'Вес предпочтения' },
                        maxLoadThreshold: { type: 'number', description: 'Порог загрузки' },
                        preferredTeamIds: { type: 'array', items: { type: 'integer' }, description: 'Предпочтительные команды' }
                    }
                },
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', format: 'email', example: 'admin@example.com' },
                        password: { type: 'string', format: 'password', example: 'admin123' }
                    }
                },
                BulkUpdateRequest: {
                    type: 'object',
                    required: ['updates'],
                    properties: {
                        updates: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    taskId: { type: 'integer' },
                                    status: { type: 'string', enum: ['backlog', 'todo', 'in progress', 'done'] },
                                    assignedTeamId: { type: 'integer', nullable: true },
                                    business_priority: { type: 'integer', minimum: 1, maximum: 3 }
                                }
                            }
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string' }
                    }
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;