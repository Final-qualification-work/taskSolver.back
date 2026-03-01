const { sequelize } = require('../config/database');
const TeamModel = require('./Team');
const TaskModel = require('./Task');

// Инициализация моделей
const Team = TeamModel(sequelize);
const Task = TaskModel(sequelize);

// Определение связей между моделями
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

// Функция для синхронизации базы данных
const syncDatabase = async (force = false) => {
    try {
        // Синхронизируем модели с базой данных
        await sequelize.sync({ 
            force,  // Если true - удалит существующие таблицы и создаст заново
            alter: false // Если true - попытается изменить существующие таблицы
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

// Функция для добавления тестовых данных
const seedDatabase = async () => {
    try {
        // Создаем тестовые команды
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

        // Создаем тестовые задачи
        const now = new Date();
        const nextMonth = new Date(now.setMonth(now.getMonth() + 1));
        
        const tasks = await Task.bulkCreate([
            {
                name: 'Разработать главную страницу',
                description: 'Создать responsive главную страницу с анимациями',
                tag: 'frontend',
                complexity: 5,
                deadline: nextMonth,
                business_priority: 8,
                status: 'backlog'
            },
            {
                name: 'Создать API для авторизации',
                description: 'Реализовать JWT аутентификацию',
                tag: 'backend',
                complexity: 4,
                deadline: nextMonth,
                business_priority: 9,
                status: 'todo'
            },
            {
                name: 'Обучить модель классификации',
                description: 'Разработать ML модель для классификации текстов',
                tag: 'ML',
                complexity: 8,
                deadline: nextMonth,
                business_priority: 7,
                status: 'not groomed'
            },
            {
                name: 'Оптимизировать загрузку изображений',
                description: 'Добавить lazy loading и оптимизацию',
                tag: 'frontend',
                complexity: 3,
                deadline: nextMonth,
                business_priority: 6,
                status: 'backlog'
            },
            {
                name: 'Настроить CI/CD pipeline',
                description: 'Настроить автоматическое тестирование и деплой',
                tag: 'backend',
                complexity: 6,
                deadline: nextMonth,
                business_priority: 8,
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
    syncDatabase
};