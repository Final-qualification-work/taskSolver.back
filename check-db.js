const { sequelize, Team, Task } = require('./src/models/index');

const checkDatabase = async () => {
    try {
        console.log('\n🔍 ПРОВЕРКА БАЗЫ ДАННЫХ\n');
        console.log('=' .repeat(80));

        // Проверяем подключение
        await sequelize.authenticate();
        console.log('✅ Подключение к БД работает\n');

        // === 1. ВСЕ КОМАНДЫ (ТАБЛИЦА) ===
        const teams = await Team.findAll();
        console.log(`🏢 КОМАНДЫ (${teams.length}):`);
        console.log('=' .repeat(80));
        
        // Красивая таблица команд
        console.table(teams.map(t => ({
            'ID': t.id,
            'Название': t.name,
            'Тег': t.tag,
            'Стоимость (₽/час)': t.cost,
            'Вместимость': t.capacity,
            'Тек. загрузка': t.currentLoad,
            'Свободно': t.capacity - t.currentLoad,
            'Загрузка %': ((t.currentLoad / t.capacity) * 100).toFixed(1) + '%'
        })));

        // === 2. ВСЕ ЗАДАЧИ (ТАБЛИЦА) ===
        const tasks = await Task.findAll({
            include: [{
                model: Team,
                as: 'assignedTeam',
                required: false
            }],
            order: [['id', 'ASC']]
        });
        
        console.log(`\n📝 ВСЕ ЗАДАЧИ (${tasks.length}):`);
        console.log('=' .repeat(80));
        
        // Красивая таблица задач
        console.table(tasks.map(t => ({
            'ID': t.id,
            'Название': t.name.length > 30 ? t.name.substring(0, 30) + '...' : t.name,
            'Тег': t.tag,
            'Сложн.': t.complexity,
            'Приор.': t.business_priority,
            'Статус': t.status,
            'Дедлайн': t.deadline.toISOString().split('T')[0],
            'Команда': t.assignedTeam?.name || '❌ НЕ НАЗНАЧЕНА',
            'ID команды': t.assignedTeamId || '-'
        })));

        // === 3. СТАТИСТИКА ПО СТАТУСАМ ===
        console.log('\n📊 СТАТИСТИКА ПО СТАТУСАМ:');
        console.log('=' .repeat(80));
        
        const statusStats = await Task.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('status')), 'count']
            ],
            group: ['status']
        });
        
        statusStats.forEach(s => {
            const bar = '█'.repeat(s.dataValues.count);
            console.log(`   ${s.status}: ${s.dataValues.count} задач ${bar}`);
        });

        // === 4. СТАТИСТИКА ПО ТЕГАМ ===
        console.log('\n🏷️ СТАТИСТИКА ПО ТЕГАМ:');
        console.log('=' .repeat(80));
        
        const tagStats = await Task.findAll({
            attributes: [
                'tag',
                [sequelize.fn('COUNT', sequelize.col('tag')), 'count']
            ],
            group: ['tag']
        });
        
        tagStats.forEach(t => {
            const totalComplexity = tasks
                .filter(task => task.tag === t.tag)
                .reduce((sum, task) => sum + task.complexity, 0);
            console.log(`   ${t.tag}: ${t.dataValues.count} задач (общая сложность: ${totalComplexity})`);
        });

        // === 5. ЗАГРУЗКА КОМАНД (ДЕТАЛЬНО) ===
        console.log('\n📈 ДЕТАЛЬНАЯ ЗАГРУЗКА КОМАНД:');
        console.log('=' .repeat(80));
        
        const sortedTeams = [...teams].sort((a, b) => b.currentLoad - a.currentLoad);
        
        for (const team of sortedTeams) {
            const percentage = ((team.currentLoad / team.capacity) * 100).toFixed(1);
            const barLength = Math.floor(percentage / 5);
            const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
            
            // Получаем задачи команды
            const teamTasks = await Task.findAll({
                where: { assignedTeamId: team.id },
                attributes: ['name', 'complexity', 'business_priority']
            });
            
            console.log(`\n   ${team.name} (${team.tag}):`);
            console.log(`      Вместимость: ${team.capacity} | Загрузка: ${team.currentLoad} | ${bar} ${percentage}%`);
            
            if (teamTasks.length > 0) {
                console.log(`      Задачи (${teamTasks.length}):`);
                teamTasks.forEach(task => {
                    const priorityIcon = task.business_priority === 3 ? '🔴' :
                                       task.business_priority === 2 ? '🟡' : '🔵';
                    console.log(`         ${priorityIcon} ${task.name.substring(0, 40)}... (сложн: ${task.complexity})`);
                });
            } else {
                console.log(`      ⚠️ Нет назначенных задач`);
            }
        }

        // === 6. НЕНАЗНАЧЕННЫЕ ЗАДАЧИ ===
        const unassignedTasks = tasks.filter(t => !t.assignedTeamId);
        if (unassignedTasks.length > 0) {
            console.log(`\n⚠️ НЕНАЗНАЧЕННЫЕ ЗАДАЧИ (${unassignedTasks.length}):`);
            console.log('=' .repeat(80));
            console.table(unassignedTasks.map(t => ({
                'ID': t.id,
                'Название': t.name.substring(0, 35) + '...',
                'Тег': t.tag,
                'Сложность': t.complexity,
                'Приоритет': t.business_priority,
                'Дедлайн': t.deadline.toISOString().split('T')[0]
            })));
        } else {
            console.log(`\n✅ ВСЕ ЗАДАЧИ НАЗНАЧЕНЫ!`);
        }

        // === 7. ОБЩАЯ СВОДКА ===
        console.log('\n📊 ОБЩАЯ СВОДКА:');
        console.log('=' .repeat(80));
        
        const assignedCount = tasks.filter(t => t.assignedTeamId).length;
        const totalCost = tasks
            .filter(t => t.assignedTeamId)
            .reduce((sum, task) => {
                const team = teams.find(t => t.id === task.assignedTeamId);
                return sum + (team ? task.complexity * team.cost : 0);
            }, 0);
        
        const maxLoad = Math.max(...teams.map(t => t.currentLoad / t.capacity), 0);
        const avgLoad = teams.reduce((sum, t) => sum + (t.currentLoad / t.capacity), 0) / teams.length;
        
        console.log(`   ✅ Команд: ${teams.length}`);
        console.log(`   ✅ Задач всего: ${tasks.length}`);
        console.log(`   📌 Назначено задач: ${assignedCount}`);
        console.log(`   ⚠️ Не назначено: ${unassignedTasks.length}`);
        console.log(`   💰 Общая стоимость: ${totalCost.toLocaleString()} ₽`);
        console.log(`   📊 Максимальная загрузка: ${(maxLoad * 100).toFixed(1)}%`);
        console.log(`   📊 Средняя загрузка: ${(avgLoad * 100).toFixed(1)}%`);

        console.log('\n' + '=' .repeat(80));
        console.log('✨ Проверка завершена');
        console.log('=' .repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await sequelize.close();
    }
};

checkDatabase();