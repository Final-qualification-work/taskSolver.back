const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Task Management API',
            version: '1.0.0',
            description: 'API для управления задачами и командами',
            contact: {
                name: 'Support',
                email: 'support@example.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server'
            }
        ],
        tags: [
            {
                name: 'Teams',
                description: 'Управление командами'
            },
            {
                name: 'Tasks',
                description: 'Управление задачами'
            }
        ],
        components: {
            schemas: {
                Team: {
                    type: 'object',
                    required: ['name', 'tag', 'cost', 'capacity'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID команды'
                        },
                        name: {
                            type: 'string',
                            description: 'Название команды'
                        },
                        tag: {
                            type: 'string',
                            enum: ['frontend', 'backend', 'ML'],
                            description: 'Специализация команды'
                        },
                        cost: {
                            type: 'number',
                            description: 'Стоимость часа работы'
                        },
                        capacity: {
                            type: 'integer',
                            description: 'Максимальная вместимость'
                        },
                        currentLoad: {
                            type: 'integer',
                            description: 'Текущая загрузка'
                        }
                    }
                },
                Task: {
                    type: 'object',
                    required: ['name', 'description', 'tag', 'complexity', 'deadline', 'business_priority'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID задачи'
                        },
                        name: {
                            type: 'string',
                            description: 'Название задачи'
                        },
                        description: {
                            type: 'string',
                            description: 'Описание задачи'
                        },
                        tag: {
                            type: 'string',
                            enum: ['frontend', 'backend', 'ML'],
                            description: 'Технологический тег'
                        },
                        complexity: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 10,
                            description: 'Сложность (1-10)'
                        },
                        deadline: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Срок выполнения'
                        },
                        business_priority: {
                            type: 'integer',
                            minimum: 1,
                            maximum: 10,
                            description: 'Приоритет для бизнеса'
                        },
                        status: {
                            type: 'string',
                            enum: ['not groomed', 'backlog', 'todo', 'in progress', 'done'],
                            description: 'Статус задачи'
                        },
                        assignedTeamId: {
                            type: 'integer',
                            description: 'ID назначенной команды'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string'
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;