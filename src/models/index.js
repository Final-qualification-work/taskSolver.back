const { sequelize } = require('../config/database');
const TeamModel = require('./Team');
const TaskModel = require('./Task');
const UserModel = require('./User');
const ProjectModel = require('./Project');
const UserPreferenceModel = require('./UserPreference');

const Team = TeamModel(sequelize);
const Task = TaskModel(sequelize);
const User = UserModel(sequelize);
const Project = ProjectModel(sequelize);
const UserPreference = UserPreferenceModel(sequelize);

Task.belongsTo(Team, {
    foreignKey: 'assignedTeamId',
    as: 'assignedTeam',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
});

Team.hasMany(Task, {
    foreignKey: 'assignedTeamId',
    as: 'tasks',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE'
});

User.belongsTo(Team, {
    foreignKey: 'teamId',
    as: 'team',
    onDelete: 'SET NULL'
});

Team.hasMany(User, {
    foreignKey: 'teamId',
    as: 'users'
});

Project.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator'
});
User.hasMany(Project, {
    foreignKey: 'createdBy',
    as: 'projects'
});

Task.belongsTo(Project, {
    foreignKey: 'projectId',
    as: 'project'
});
Project.hasMany(Task, {
    foreignKey: 'projectId',
    as: 'tasks'
});

UserPreference.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
});
User.hasOne(UserPreference, {
    foreignKey: 'userId',
    as: 'preferences'
});

const syncDatabase = async (force = false) => {
    try {

        await sequelize.sync({
            force,
            alter: false
        });

        console.log('База данных синхронизирована');

        if (force) {
            console.log('Добавляем тестовые данные...');
            await seedDatabase();
        }
    } catch (error) {
        console.error('Ошибка синхронизации БД:', error);
        throw error;
    }
};

const seedDatabase = async () => {
    try {

        const teams = await Team.bulkCreate([
            {
                name: 'Frontend Разработка',
                tag: 'frontend',
                cost: 2000,
                capacity: 40,
                currentLoad: 0
            },
            {
                name: 'ML Инженеры',
                tag: 'ML',
                cost: 3500,
                capacity: 30,
                currentLoad: 0
            },
            {
                name: 'Backend Разработка',
                tag: 'backend',
                cost: 2500,
                capacity: 35,
                currentLoad: 0
            },
            {
                name: 'Frontend Junior',
                tag: 'frontend',
                cost: 1500,
                capacity: 25,
                currentLoad: 0
            },
            {
                name: 'ML Исследования',
                tag: 'ML',
                cost: 4000,
                capacity: 20,
                currentLoad: 0
            }
        ]);

        console.log(`Создано ${teams.length} тестовых команд`);

        const now = new Date();
        const nextMonth = new Date(now.setMonth(now.getMonth() + 1));

        const tasks = await Task.bulkCreate([
            {
                name: 'Разработать главную страницу',
                description: 'Создать responsive главную страницу с анимациями',
                tag: 'frontend',
                complexity: 5,
                deadline: nextMonth,
                business_priority: 3,
                status: 'backlog'
            },
            {
                name: 'Создать API для авторизации',
                description: 'Реализовать JWT аутентификацию',
                tag: 'backend',
                complexity: 4,
                deadline: nextMonth,
                business_priority: 3,
                status: 'todo'
            },
            {
                name: 'Обучить модель классификации',
                description: 'Разработать ML модель для классификации текстов',
                tag: 'ML',
                complexity: 8,
                deadline: nextMonth,
                business_priority: 2,
                status: 'not groomed'
            },
            {
                name: 'Оптимизировать загрузку изображений',
                description: 'Добавить lazy loading и оптимизацию',
                tag: 'frontend',
                complexity: 3,
                deadline: nextMonth,
                business_priority: 2,
                status: 'backlog'
            },
            {
                name: 'Настроить CI/CD pipeline',
                description: 'Настроить автоматическое тестирование и деплой',
                tag: 'backend',
                complexity: 6,
                deadline: nextMonth,
                business_priority: 3,
                status: 'todo'
            }
        ]);

        console.log(`Создано ${tasks.length} тестовых задач`);

    } catch (error) {
        console.error('Ошибка добавления тестовых данных:', error);
        throw error;
    }
};

module.exports = {
    sequelize,
    Team,
    Task,
    User,
    Project,
    UserPreference,
    syncDatabase
};
