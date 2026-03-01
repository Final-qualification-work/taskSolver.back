const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Task = sequelize.define('Task', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: 'Уникальный идентификатор задачи'
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'Название задачи не может быть пустым'
                }
            },
            comment: 'Название задачи'
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
            comment: 'Описание задачи'
        },
        tag: {
            type: DataTypes.ENUM('frontend', 'ML', 'backend'),
            allowNull: false,
            validate: {
                isIn: {
                    args: [['frontend', 'ML', 'backend']],
                    msg: 'Тег должен быть frontend, ML или backend'
                }
            },
            comment: 'Технологический тег задачи'
        },
        complexity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: {
                    args: [1],
                    msg: 'Сложность должна быть не менее 1'
                },
                max: {
                    args: [10],
                    msg: 'Сложность должна быть не более 10'
                }
            },
            comment: 'Сложность задачи в story points'
        },
        deadline: {
            type: DataTypes.DATE,
            allowNull: false,
            validate: {
                isDate: {
                    msg: 'Дедлайн должен быть корректной датой'
                },
                isFuture(value) {
                    if (new Date(value) < new Date()) {
                        throw new Error('Дедлайн не может быть в прошлом');
                    }
                }
            },
            comment: 'Срок выполнения задачи'
        },
        business_priority: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: {
                    args: [1],
                    msg: 'Приоритет должен быть не менее 1'
                },
                max: {
                    args: [10],
                    msg: 'Приоритет должен быть не более 10'
                }
            },
            comment: 'Приоритет для бизнеса (1-10)'
        },
        status: {
            type: DataTypes.ENUM('not groomed', 'backlog', 'todo', 'in progress', 'done'),
            defaultValue: 'backlog',
            validate: {
                isIn: {
                    args: [['not groomed', 'backlog', 'todo', 'in progress', 'done']],
                    msg: 'Некорректный статус задачи'
                }
            },
            comment: 'Текущий статус задачи'
        },
        assignedTeamId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            field: 'assigned_team_id',
            references: {
                model: 'teams',
                key: 'id'
            },
            field: 'assigned_team_id',
            comment: 'ID назначенной команды'
        }
    }, {
        tableName: 'tasks',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['status']
            },
            {
                fields: ['tag']
            },
            {
                fields: ['assigned_team_id']
            },
            {
                fields: ['deadline']
            },
            {
                fields: ['business_priority']
            }
        ]
    });

    return Task;
};