const { sequelize, User, Team } = require('./src/models/index');

const initUsers = async () => {
    try {
        console.log('👤 Инициализация пользователей...\n');
        
        // Синхронизируем модели (создаем таблицу users)
        await sequelize.sync({ alter: true });
        console.log('✅ Таблицы синхронизированы\n');
        
        // Получаем существующие команды для привязки
        const teams = await Team.findAll();
        const frontendTeam = teams.find(t => t.tag === 'frontend');
        const backendTeam = teams.find(t => t.tag === 'backend');
        
        // Удаляем старых пользователей (если есть)
        await User.destroy({ where: {}, truncate: true });
        console.log('📋 Старые пользователи удалены\n');
        
        // Создаем пользователей
        const users = await User.bulkCreate([
            {
                username: 'admin',
                email: 'admin@example.com',
                password: 'admin123',
                role: 'admin',
                permissions: {
                    canCreateTasks: true,
                    canEditTasks: true,
                    canDeleteTasks: true,
                    canAssignTeams: true,
                    canManageUsers: true,
                    canViewReports: true
                },
                isActive: true
            },
            {
                username: 'pm',
                email: 'pm@example.com',
                password: 'pm123',
                role: 'project_manager',
                permissions: {
                    canCreateTasks: true,
                    canEditTasks: true,
                    canDeleteTasks: false,
                    canAssignTeams: true,
                    canManageUsers: false,
                    canViewReports: true
                },
                isActive: true
            },
            {
                username: 'developer_frontend',
                email: 'dev.frontend@example.com',
                password: 'dev123',
                role: 'developer',
                permissions: {
                    canCreateTasks: true,
                    canEditTasks: true,
                    canDeleteTasks: false,
                    canAssignTeams: false,
                    canManageUsers: false,
                    canViewReports: false
                },
                teamId: frontendTeam ? frontendTeam.id : null,
                isActive: true
            },
            {
                username: 'developer_backend',
                email: 'dev.backend@example.com',
                password: 'dev123',
                role: 'developer',
                permissions: {
                    canCreateTasks: true,
                    canEditTasks: true,
                    canDeleteTasks: false,
                    canAssignTeams: false,
                    canManageUsers: false,
                    canViewReports: false
                },
                teamId: backendTeam ? backendTeam.id : null,
                isActive: true
            },
            {
                username: 'viewer',
                email: 'viewer@example.com',
                password: 'viewer123',
                role: 'viewer',
                permissions: {
                    canCreateTasks: false,
                    canEditTasks: false,
                    canDeleteTasks: false,
                    canAssignTeams: false,
                    canManageUsers: false,
                    canViewReports: true
                },
                isActive: true
            }
        ]);
        
        console.log(`✅ Создано ${users.length} пользователей\n`);
        console.log('📋 ТЕСТОВЫЕ УЧЕТНЫЕ ЗАПИСИ:');
        console.log('='.repeat(50));
        console.log('| Роль              | Email                      | Пароль   |');
        console.log('|-------------------|----------------------------|----------|');
        console.log('| Администратор     | admin@example.com          | admin123 |');
        console.log('| Project Manager   | pm@example.com             | pm123    |');
        console.log('| Frontend Developer| dev.frontend@example.com   | dev123   |');
        console.log('| Backend Developer | dev.backend@example.com    | dev123   |');
        console.log('| Наблюдатель       | viewer@example.com         | viewer123|');
        console.log('='.repeat(50));
        
        // Выводим информацию о пользователях
        console.log('\n📊 ДЕТАЛИ ПОЛЬЗОВАТЕЛЕЙ:');
        for (const user of users) {
            console.log(`   ${user.username} (${user.role}): ${user.email}`);
            if (user.teamId) {
                const team = teams.find(t => t.id === user.teamId);
                console.log(`      → Команда: ${team ? team.name : 'Не найдена'}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        console.error('Детали:', error.message);
    } finally {
        await sequelize.close();
    }
};

initUsers();