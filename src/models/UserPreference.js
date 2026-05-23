const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserPreference = sequelize.define('UserPreference', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' }
        },

        weightCost: {
            type: DataTypes.FLOAT,
            defaultValue: 0.33,
            validate: { min: 0, max: 1 }
        },
        weightLoad: {
            type: DataTypes.FLOAT,
            defaultValue: 0.33,
            validate: { min: 0, max: 1 }
        },
        weightPreference: {
            type: DataTypes.FLOAT,
            defaultValue: 0.34,
            validate: { min: 0, max: 1 }
        },

        maxLoadThreshold: {
            type: DataTypes.FLOAT,
            defaultValue: 0.85,
            comment: 'Максимально допустимая загрузка команды'
        },
        minPreferenceThreshold: {
            type: DataTypes.FLOAT,
            defaultValue: 0.5,
            comment: 'Минимально допустимая предпочтительность'
        },

        preferredTeamIds: {
            type: DataTypes.JSON,
            defaultValue: [],
            comment: 'Список ID предпочтительных команд'
        },

        preferredTags: {
            type: DataTypes.JSON,
            defaultValue: [],
            comment: 'Список предпочтительных тегов'
        },

        notificationsEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        dashboardLayout: {
            type: DataTypes.JSON,
            defaultValue: {
                charts: ['loadChart', 'taskDistribution', 'paretoFront'],
                refreshInterval: 30
            }
        }
    }, {
        tableName: 'user_preferences',
        timestamps: true,
        underscored: true
    });

    return UserPreference;
};
