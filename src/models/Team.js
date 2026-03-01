const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Team = sequelize.define('Team', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: 'Уникальный идентификатор команды'
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: {
                    msg: 'Название команды не может быть пустым'
                },
                len: {
                    args: [2, 100],
                    msg: 'Название команды должно быть от 2 до 100 символов'
                }
            },
            comment: 'Название команды'
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
            comment: 'Специализация команды'
        },
        cost: {
            type: DataTypes.FLOAT,
            allowNull: false,
            validate: {
                min: {
                    args: [0],
                    msg: 'Стоимость не может быть отрицательной'
                }
            },
            comment: 'Стоимость часа работы команды'
        },
        capacity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: {
                    args: [1],
                    msg: 'Вместимость должна быть не менее 1'
                }
            },
            comment: 'Максимальная вместимость в человеко-часах'
        },
        currentLoad: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                min: {
                    args: [0],
                    msg: 'Загрузка не может быть отрицательной'
                },
                max: {
                    args: [9999],
                    msg: 'Загрузка не может превышать 9999'
                }
            },
            comment: 'Текущая загрузка в человеко-часах'
        }
    }, {
        tableName: 'teams',
        timestamps: true,
        underscored: true,
        indexes: [
            {
                fields: ['tag']
            },
            {
                fields: ['current_load']
            }
        ]
    });

    return Team;
};