const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Project = sequelize.define('Project', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: { notEmpty: true }
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('planning', 'active', 'completed', 'on_hold'),
            defaultValue: 'planning'
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        budget: {
            type: DataTypes.FLOAT,
            allowNull: true,
            validate: { min: 0 }
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' }
        },
        teamIds: {
            type: DataTypes.JSON,
            defaultValue: []
        }
    }, {
        tableName: 'projects',
        timestamps: true,
        underscored: true
    });

    return Project;
};