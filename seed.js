const { sequelize, Team, Task, User, Project, UserPreference } = require('./src/models/index');

const addDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

const defaultPermissions = {
    admin: {
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: true,
        canAssignTeams: true,
        canManageUsers: true,
        canViewReports: true,
    },
    project_manager: {
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: false,
        canAssignTeams: true,
        canManageUsers: false,
        canViewReports: true,
    },
    team_lead: {
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: false,
        canAssignTeams: true,
        canManageUsers: false,
        canViewReports: true,
    },
    developer: {
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: false,
        canAssignTeams: false,
        canManageUsers: false,
        canViewReports: false,
    },
    viewer: {
        canCreateTasks: false,
        canEditTasks: false,
        canDeleteTasks: false,
        canAssignTeams: false,
        canManageUsers: false,
        canViewReports: true,
    },
};

async function seedDatabase() {
    try {
        console.log('🌱 Наполнение БД: команды, пользователи, проекты, задачи, предпочтения\n');
        console.log('='.repeat(60));

        console.log('🔄 Пересоздание таблиц (sync force)...');
        await sequelize.sync({ force: true });
        console.log('✅ Таблицы созданы\n');

        console.log('🏢 Команды...');
        const teams = await Team.bulkCreate([
            { name: 'Frontend Experts', tag: 'frontend', cost: 3000, capacity: 50, currentLoad: 0 },
            { name: 'Frontend Middle', tag: 'frontend', cost: 2200, capacity: 35, currentLoad: 0 },
            { name: 'Frontend Juniors', tag: 'frontend', cost: 1500, capacity: 25, currentLoad: 0 },
            { name: 'Backend Architects', tag: 'backend', cost: 3500, capacity: 45, currentLoad: 0 },
            { name: 'Backend Developers', tag: 'backend', cost: 2500, capacity: 30, currentLoad: 0 },
            { name: 'Backend Support', tag: 'backend', cost: 1800, capacity: 20, currentLoad: 0 },
            { name: 'ML Research', tag: 'ML', cost: 4500, capacity: 30, currentLoad: 0 },
            { name: 'ML Engineering', tag: 'ML', cost: 3500, capacity: 25, currentLoad: 0 },
            { name: 'Data Analytics', tag: 'ML', cost: 2800, capacity: 20, currentLoad: 0 },
            { name: 'DevOps Senior', tag: 'backend', cost: 3200, capacity: 25, currentLoad: 0 },
            { name: 'DevOps Junior', tag: 'backend', cost: 2000, capacity: 15, currentLoad: 0 },
        ]);
        console.log(`   ✅ ${teams.length} команд`);

        console.log('\n👤 Пользователи...');
        const users = await User.bulkCreate(
            [
                {
                    username: 'admin',
                    email: 'admin@example.com',
                    password: 'admin123',
                    role: 'admin',
                    permissions: defaultPermissions.admin,
                    isActive: true,
                },
                {
                    username: 'pm',
                    email: 'pm@example.com',
                    password: 'pm123',
                    role: 'project_manager',
                    permissions: defaultPermissions.project_manager,
                    isActive: true,
                },
                {
                    username: 'teamlead_frontend',
                    email: 'tl.frontend@example.com',
                    password: 'tl123',
                    role: 'team_lead',
                    teamId: teams[0].id,
                    permissions: defaultPermissions.team_lead,
                    isActive: true,
                },
                {
                    username: 'teamlead_backend',
                    email: 'tl.backend@example.com',
                    password: 'tl123',
                    role: 'team_lead',
                    teamId: teams[3].id,
                    permissions: defaultPermissions.team_lead,
                    isActive: true,
                },
                {
                    username: 'developer_frontend',
                    email: 'dev.frontend@example.com',
                    password: 'dev123',
                    role: 'developer',
                    teamId: teams[0].id,
                    permissions: defaultPermissions.developer,
                    isActive: true,
                },
                {
                    username: 'developer_backend',
                    email: 'dev.backend@example.com',
                    password: 'dev123',
                    role: 'developer',
                    teamId: teams[3].id,
                    permissions: defaultPermissions.developer,
                    isActive: true,
                },
                {
                    username: 'viewer',
                    email: 'viewer@example.com',
                    password: 'viewer123',
                    role: 'viewer',
                    permissions: defaultPermissions.viewer,
                    isActive: true,
                },
            ],
            { individualHooks: true },
        );
        console.log(`   ✅ ${users.length} пользователей`);

        console.log('\n📁 Проекты...');
        const projects = await Project.bulkCreate([
            {
                name: 'Корпоративный портал',
                description: 'Внутренний портал компании',
                status: 'active',
                startDate: addDays(-30),
                endDate: addDays(90),
                budget: 500000,
                teamIds: [teams[0].id, teams[3].id],
                createdBy: users[1].id,
            },
            {
                name: 'Рекомендательная система',
                description: 'ML-система рекомендаций товаров',
                status: 'planning',
                startDate: addDays(-7),
                endDate: addDays(120),
                budget: 750000,
                teamIds: [teams[6].id, teams[7].id],
                createdBy: users[1].id,
            },
            {
                name: 'Мобильное приложение',
                description: 'Клиентское мобильное приложение',
                status: 'active',
                startDate: addDays(-14),
                endDate: addDays(60),
                budget: 600000,
                teamIds: [teams[0].id, teams[4].id],
                createdBy: users[1].id,
            },
        ]);
        console.log(`   ✅ ${projects.length} проектов`);

        console.log('\n📝 Задачи (внутри проектов)...');
        const tasksData = [
            { name: 'Главная страница', description: 'Адаптивная главная', tag: 'frontend', complexity: 8, deadline: addDays(14), business_priority: 3, status: 'in progress', projectId: projects[0].id, assignedTeamId: teams[0].id },
            { name: 'Личный кабинет', description: 'Кабинет сотрудника', tag: 'frontend', complexity: 7, deadline: addDays(18), business_priority: 3, status: 'todo', projectId: projects[0].id, assignedTeamId: teams[1].id },
            { name: 'API авторизации', description: 'JWT', tag: 'backend', complexity: 8, deadline: addDays(10), business_priority: 3, status: 'in progress', projectId: projects[0].id, assignedTeamId: teams[3].id },
            { name: 'База данных', description: 'Схема БД', tag: 'backend', complexity: 9, deadline: addDays(20), business_priority: 3, status: 'backlog', projectId: projects[0].id },
            { name: 'Классификация текстов', description: 'ML-модель', tag: 'ML', complexity: 9, deadline: addDays(25), business_priority: 3, status: 'todo', projectId: projects[1].id, assignedTeamId: teams[6].id },
            { name: 'Очистка данных', description: 'Датасет', tag: 'ML', complexity: 6, deadline: addDays(12), business_priority: 2, status: 'backlog', projectId: projects[1].id },
            { name: 'Рекомендательная система', description: 'Алгоритм', tag: 'ML', complexity: 10, deadline: addDays(40), business_priority: 3, status: 'not groomed', projectId: projects[1].id },
            { name: 'Мобильная версия', description: 'Mobile UX', tag: 'frontend', complexity: 6, deadline: addDays(16), business_priority: 2, status: 'todo', projectId: projects[2].id, assignedTeamId: teams[2].id },
            { name: 'API для мобилки', description: 'REST API', tag: 'backend', complexity: 7, deadline: addDays(16), business_priority: 2, status: 'backlog', projectId: projects[2].id },
            { name: 'Оптимизация загрузки', description: 'LCP', tag: 'frontend', complexity: 5, deadline: addDays(8), business_priority: 3, status: 'done', projectId: projects[2].id, assignedTeamId: teams[0].id },
            { name: 'CI/CD Pipeline', description: 'Автосборка', tag: 'backend', complexity: 7, deadline: addDays(22), business_priority: 2, status: 'backlog', projectId: projects[2].id },
            { name: 'UI компоненты', description: 'Библиотека UI', tag: 'frontend', complexity: 6, deadline: addDays(28), business_priority: 2, status: 'backlog', projectId: projects[2].id },
        ];

        const tasks = await Task.bulkCreate(tasksData);
        console.log(`   ✅ ${tasks.length} задач`);

        // Пересчёт currentLoad по назначенным задачам
        for (const team of teams) {
            const load = tasksData
                .filter((t) => t.assignedTeamId === team.id)
                .reduce((sum, t) => sum + t.complexity, 0);
            if (load > 0) {
                await team.update({ currentLoad: load });
            }
        }

        console.log('\n⚙️ Предпочтения пользователей...');
        await UserPreference.bulkCreate([
            { userId: users[0].id, weightCost: 0.33, weightLoad: 0.33, weightPreference: 0.34, maxLoadThreshold: 0.85, preferredTeamIds: [], preferredTags: [] },
            { userId: users[1].id, weightCost: 0.5, weightLoad: 0.3, weightPreference: 0.2, maxLoadThreshold: 0.8, preferredTeamIds: [teams[0].id, teams[3].id], preferredTags: ['frontend', 'backend'] },
            { userId: users[2].id, weightCost: 0.2, weightLoad: 0.3, weightPreference: 0.5, maxLoadThreshold: 0.75, preferredTeamIds: [teams[0].id, teams[1].id], preferredTags: ['frontend'] },
            { userId: users[3].id, weightCost: 0.2, weightLoad: 0.4, weightPreference: 0.4, maxLoadThreshold: 0.7, preferredTeamIds: [teams[3].id, teams[4].id], preferredTags: ['backend'] },
            { userId: users[4].id, weightCost: 0.33, weightLoad: 0.33, weightPreference: 0.34, maxLoadThreshold: 0.85, preferredTeamIds: [teams[0].id], preferredTags: ['frontend'] },
            { userId: users[5].id, weightCost: 0.33, weightLoad: 0.33, weightPreference: 0.34, maxLoadThreshold: 0.85, preferredTeamIds: [teams[3].id], preferredTags: ['backend'] },
        ]);
        console.log('   ✅ предпочтения созданы');

        console.log('\n📊 Итого:');
        console.log(`   Команд: ${teams.length} · Пользователей: ${users.length} · Проектов: ${projects.length} · Задач: ${tasks.length}`);

        console.log('\n🔑 Учётные записи:');
        console.log('='.repeat(62));
        console.log('| Роль               | Email                       | Пароль    |');
        console.log('|--------------------|-----------------------------|-----------|');
        console.log('| Администратор      | admin@example.com           | admin123  |');
        console.log('| Project Manager    | pm@example.com              | pm123     |');
        console.log('| Team Lead Frontend | tl.frontend@example.com     | tl123     |');
        console.log('| Team Lead Backend  | tl.backend@example.com      | tl123     |');
        console.log('| Developer Frontend | dev.frontend@example.com    | dev123    |');
        console.log('| Developer Backend  | dev.backend@example.com     | dev123    |');
        console.log('| Наблюдатель        | viewer@example.com          | viewer123 |');
        console.log('='.repeat(62));
        console.log('\n✨ Готово. Запуск: npm start (бэкенд) + npm run dev (фронт)\n');
    } catch (error) {
        console.error('❌ Ошибка:', error);
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) {
    seedDatabase();
}

module.exports = { seedDatabase };
