const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('admin', 'project_manager', 'team_lead', 'developer', 'viewer'),
            defaultValue: 'developer'
        },
        permissions: {
            type: DataTypes.JSON,
            defaultValue: {
                canCreateTasks: true,
                canEditTasks: true,
                canDeleteTasks: true,
                canAssignTeams: false,
                canManageUsers: false,
                canViewReports: true
            }
        },
        teamId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'teams', key: 'id' }
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'users',
        timestamps: true,
        hooks: {
            beforeCreate: async (user) => {
                user.password = await bcrypt.hash(user.password, 10);
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            }
        }
    });

    User.prototype.comparePassword = async function(password) {
        return bcrypt.compare(password, this.password);
    };

    return User;
};