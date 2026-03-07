const { sequelize, Team, Task } = require('./src/models/index');

const checkDatabase = async () => {
    try {
        console.log('ПРОВЕРКА БАЗЫ ДАННЫХ\n');

        // Проверяем подключение
        await sequelize.authenticate();
        console.log('Подключение к БД работает\n');

        // Получаем все команды
        const teams = await Team.findAll();
        console.log(`КОМАНДЫ (${teams.length}):`);
        console.table(teams.map(t => ({
            ID: t.id,
            Название: t.name,
            Тег: t.tag,
            Стоимость: t.cost,
            Вместимость: t.capacity,
            Загрузка: t.currentLoad
        })));

        // Получаем все задачи
        const tasks = await Task.findAll({
            include: [{
                model: Team,
                as: 'assignedTeam',
                required: false
            }]
        });
        
        console.log(`\n📝 ЗАДАЧИ (${tasks.length}):`);
        console.table(tasks.map(t => ({
            ID: t.id,
            Название: t.name.substring(0, 30) + '...',
            Тег: t.tag,
            Сложность: t.complexity,
            Приоритет: t.business_priority,
            Статус: t.status,
            Команда: t.assignedTeam?.name || 'Не назначена'
        })));

        // Статистика
        console.log('\nСТАТИСТИКА:');
        
        const taskStats = await Task.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('status')), 'count']
            ],
            group: ['status']
        });
        
        console.log('\nПо статусам:');
        taskStats.forEach(s => {
            console.log(`   ${s.status}: ${s.dataValues.count}`);
        });

        const tagStats = await Task.findAll({
            attributes: [
                'tag',
                [sequelize.fn('COUNT', sequelize.col('tag')), 'count']
            ],
            group: ['tag']
        });
        
        console.log('\nПо тегам:');
        tagStats.forEach(t => {
            console.log(`   ${t.tag}: ${t.dataValues.count}`);
        });

    } catch (error) {
        console.error('Ошибка:', error);
    } finally {
        await sequelize.close();
    }
};

checkDatabase();