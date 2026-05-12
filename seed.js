const { sequelize, Team, Task, User, Project, UserPreference } = require('./src/models/index');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        console.log('🌱 НАЧИНАЕМ НАПОЛНЕНИЕ БАЗЫ ДАННЫХ\n');
        console.log('='.repeat(60));

        // Синхронизация
        console.log('🔄 Синхронизация моделей...');
        await sequelize.sync({ force: true });
        console.log('✅ Таблицы созданы\n');

        // === 1. СОЗДАЕМ КОМАНДЫ ===
        console.log('🏢 СОЗДАЕМ КОМАНДЫ...');
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
            { name: 'DevOps Junior', tag: 'backend', cost: 2000, capacity: 15, currentLoad: 0 }
        ]);
        console.log(`✅ Создано ${teams.length} команд`);

        // === 2. СОЗДАЕМ ПОЛЬЗОВАТЕЛЕЙ ===
        console.log('\n👤 СОЗДАЕМ ПОЛЬЗОВАТЕЛЕЙ...');
        
        const users = await User.bulkCreate([
            { username: 'admin', email: 'admin@example.com', password: 'admin123', role: 'admin', isActive: true },
            { username: 'pm_ivanov', email: 'pm@example.com', password: 'pm123', role: 'project_manager', isActive: true },
            { username: 'teamlead_frontend', email: 'tl.frontend@example.com', password: 'tl123', role: 'team_lead', teamId: teams[0].id, isActive: true },
            { username: 'teamlead_backend', email: 'tl.backend@example.com', password: 'tl123', role: 'team_lead', teamId: teams[3].id, isActive: true },
            { username: 'dev_frontend', email: 'dev.frontend@example.com', password: 'dev123', role: 'developer', teamId: teams[0].id, isActive: true },
            { username: 'dev_backend', email: 'dev.backend@example.com', password: 'dev123', role: 'developer', teamId: teams[3].id, isActive: true },
            { username: 'viewer', email: 'viewer@example.com', password: 'viewer123', role: 'viewer', isActive: true }
        ]);
        console.log(`✅ Создано ${users.length} пользователей`);

        // === 3. СОЗДАЕМ ПРОЕКТЫ ===
        console.log('\n📁 СОЗДАЕМ ПРОЕКТЫ...');
        
        const projects = await Project.bulkCreate([
            { name: 'Корпоративный портал', description: 'Разработка внутреннего портала компании', status: 'active', startDate: new Date('2025-03-01'), endDate: new Date('2025-06-30'), budget: 500000, createdBy: users[1].id },
            { name: 'Рекомендательная система', description: 'ML система для рекомендаций товаров', status: 'planning', startDate: new Date('2025-05-01'), endDate: new Date('2025-08-31'), budget: 750000, createdBy: users[1].id },
            { name: 'Мобильное приложение', description: 'React Native приложение для клиентов', status: 'active', startDate: new Date('2025-04-01'), endDate: new Date('2025-07-31'), budget: 600000, createdBy: users[1].id }
        ]);
        console.log(`✅ Создано ${projects.length} проектов`);

        // === 4. СОЗДАЕМ ЗАДАЧИ ===
        console.log('\n📝 СОЗДАЕМ ЗАДАЧИ...');

        const tasksData = [
            // Проект 1: Корпоративный портал
            { name: 'Главная страница', description: 'Адаптивная главная страница', tag: 'frontend', complexity: 8, deadline: new Date('2025-04-10'), business_priority: 3, status: 'backlog', projectId: projects[0].id },
            { name: 'Личный кабинет', description: 'Личный кабинет сотрудника', tag: 'frontend', complexity: 7, deadline: new Date('2025-04-15'), business_priority: 3, status: 'backlog', projectId: projects[0].id },
            { name: 'API авторизации', description: 'JWT аутентификация', tag: 'backend', complexity: 8, deadline: new Date('2025-04-08'), business_priority: 3, status: 'backlog', projectId: projects[0].id },
            { name: 'База данных', description: 'Проектирование схемы БД', tag: 'backend', complexity: 9, deadline: new Date('2025-04-12'), business_priority: 3, status: 'backlog', projectId: projects[0].id },
            
            // Проект 2: Рекомендательная система
            { name: 'Классификация текстов', description: 'Модель для классификации', tag: 'ML', complexity: 9, deadline: new Date('2025-05-05'), business_priority: 3, status: 'backlog', projectId: projects[1].id },
            { name: 'Очистка данных', description: 'Подготовка датасета', tag: 'ML', complexity: 6, deadline: new Date('2025-04-10'), business_priority: 2, status: 'backlog', projectId: projects[1].id },
            { name: 'Рекомендательная система', description: 'Алгоритм рекомендаций', tag: 'ML', complexity: 10, deadline: new Date('2025-06-01'), business_priority: 3, status: 'backlog', projectId: projects[1].id },
            
            // Проект 3: Мобильное приложение
            { name: 'Мобильная версия', description: 'Адаптация под мобильные устройства', tag: 'frontend', complexity: 6, deadline: new Date('2025-04-20'), business_priority: 2, status: 'backlog', projectId: projects[2].id },
            { name: 'API для мобилки', description: 'REST API для приложения', tag: 'backend', complexity: 7, deadline: new Date('2025-04-20'), business_priority: 2, status: 'backlog', projectId: projects[2].id },
            { name: 'Оптимизация загрузки', description: 'Ускорение загрузки страниц', tag: 'frontend', complexity: 5, deadline: new Date('2025-04-05'), business_priority: 3, status: 'backlog', projectId: projects[2].id },
            { name: 'CI/CD Pipeline', description: 'Настройка автоматической сборки', tag: 'backend', complexity: 7, deadline: new Date('2025-04-20'), business_priority: 2, status: 'backlog', projectId: projects[2].id },
            { name: 'UI компоненты', description: 'Библиотека компонентов', tag: 'frontend', complexity: 6, deadline: new Date('2025-04-30'), business_priority: 2, status: 'backlog', projectId: projects[2].id }
        ];

        const tasks = await Task.bulkCreate(tasksData);
        console.log(`✅ Создано ${tasks.length} задач`);

        // === 5. СОЗДАЕМ ПРЕДПОЧТЕНИЯ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ===
        console.log('\n⚙️ СОЗДАЕМ ПРЕДПОЧТЕНИЯ ПОЛЬЗОВАТЕЛЕЙ...');
        
        // Предпочтения для разных ролей
        await UserPreference.bulkCreate([
            { userId: users[0].id, weightCost: 0.33, weightLoad: 0.33, weightPreference: 0.34, maxLoadThreshold: 0.85 }, // admin
            { userId: users[1].id, weightCost: 0.5, weightLoad: 0.3, weightPreference: 0.2, maxLoadThreshold: 0.80 }, // PM (акцент на бюджет)
            { userId: users[2].id, weightCost: 0.2, weightLoad: 0.3, weightPreference: 0.5, maxLoadThreshold: 0.75 }, // TL frontend (акцент на качество)
            { userId: users[3].id, weightCost: 0.2, weightLoad: 0.4, weightPreference: 0.4, maxLoadThreshold: 0.70 } // TL backend (акцент на загрузку)
        ]);
        console.log('✅ Созданы предпочтения');

        // === 6. ИТОГОВАЯ СТАТИСТИКА ===
        console.log('\n📊 ИТОГОВАЯ СТАТИСТИКА:');
        console.log('='.repeat(60));
        console.log(`   🏢 Команд: ${teams.length}`);
        console.log(`   👤 Пользователей: ${users.length}`);
        console.log(`   📁 Проектов: ${projects.length}`);
        console.log(`   📝 Задач: ${tasks.length}`);
        console.log('\n📌 Распределение по ролям:');
        console.log(`   👑 Admin: ${users.filter(u => u.role === 'admin').length}`);
        console.log(`   📊 Project Manager: ${users.filter(u => u.role === 'project_manager').length}`);
        console.log(`   👨‍💼 Team Lead: ${users.filter(u => u.role === 'team_lead').length}`);
        console.log(`   💻 Developer: ${users.filter(u => u.role === 'developer').length}`);
        console.log(`   👁️ Viewer: ${users.filter(u => u.role === 'viewer').length}`);
        
        console.log('\n📌 Статус задач:');
        console.log(`   🔄 Все задачи в статусе 'backlog' (не назначены)`);

        console.log('\n✨ БАЗА ДАННЫХ УСПЕШНО НАПОЛНЕНА!');
        console.log('\n🔑 ТЕСТОВЫЕ УЧЕТНЫЕ ЗАПИСИ:');
        console.log('='.repeat(60));
        console.log('| Роль              | Email                      | Пароль   |');
        console.log('|-------------------|----------------------------|----------|');
        console.log('| Администратор     | admin@example.com          | admin123 |');
        console.log('| PM                | pm@example.com             | pm123    |');
        console.log('| Team Lead Frontend| tl.frontend@example.com    | tl123    |');
        console.log('| Team Lead Backend | tl.backend@example.com     | tl123    |');
        console.log('| Developer         | dev.frontend@example.com   | dev123   |');
        console.log('| Наблюдатель       | viewer@example.com         | viewer123|');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
};

seedDatabase();
