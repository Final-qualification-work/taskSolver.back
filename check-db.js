const { sequelize, Team, Task, User, Project, UserPreference } = require('./src/models/index');

const checkDatabase = async () => {
    try {
        console.log('\n🔍 ПРОВЕРКА БАЗЫ ДАННЫХ\n');
        console.log('='.repeat(80));

        await sequelize.authenticate();
        console.log('✅ Подключение к БД работает\n');

        const teams = await Team.findAll();
        console.log(`🏢 КОМАНДЫ (${teams.length}):`);
        console.log('='.repeat(80));
        console.table(teams.map(t => ({
            'ID': t.id,
            'Название': t.name,
            'Тег': t.tag,
            'Стоимость (₽/час)': t.cost,
            'Вместимость (поинты)': t.capacity,
            'Тек. загрузка': t.currentLoad,
            'Свободно': t.capacity - t.currentLoad,
            'Загрузка %': ((t.currentLoad / t.capacity) * 100).toFixed(1) + '%'
        })));

        const users = await User.findAll({
            include: [{ model: Team, as: 'team', required: false }]
        });

        console.log(`\n👤 ПОЛЬЗОВАТЕЛИ (${users.length}):`);
        console.log('='.repeat(80));
        console.table(users.map(u => ({
            'ID': u.id,
            'Имя': u.username,
            'Email': u.email,
            'Роль': u.role,
            'Активен': u.isActive ? '✅' : '❌',
            'Команда': u.team?.name || '-'
        })));

        const projects = await Project.findAll({
            include: [{ model: User, as: 'creator', attributes: ['username'] }]
        });

        console.log(`\n📁 ПРОЕКТЫ (${projects.length}):`);
        console.log('='.repeat(80));
        console.table(projects.map(p => ({
            'ID': p.id,
            'Название': p.name,
            'Статус': p.status,
            'Бюджет': p.budget ? p.budget.toLocaleString() + ' ₽' : '-',
            'Создатель': p.creator?.username || '-',
            'Дата начала': p.startDate ? p.startDate.toISOString().split('T')[0] : '-',
            'Дата конца': p.endDate ? p.endDate.toISOString().split('T')[0] : '-'
        })));

        const tasks = await Task.findAll({
            include: [
                { model: Team, as: 'assignedTeam', required: false },
                { model: Project, as: 'project', required: false }
            ],
            order: [['id', 'ASC']]
        });

        console.log(`\n📝 ВСЕ ЗАДАЧИ (${tasks.length}):`);
        console.log('='.repeat(80));
        console.table(tasks.map(t => ({
            'ID': t.id,
            'Название': t.name.length > 25 ? t.name.substring(0, 25) + '...' : t.name,
            'Тег': t.tag,
            'Сложн.': t.complexity,
            'Приор.': t.business_priority,
            'Статус': t.status,
            'Дедлайн': t.deadline.toISOString().split('T')[0],
            'Проект': t.project?.name.substring(0, 15) || '-',
            'Команда': t.assignedTeam?.name.substring(0, 15) || '❌ НЕ НАЗНАЧЕНА'
        })));

        const preferences = await UserPreference.findAll({
            include: [{ model: User, as: 'user', attributes: ['username', 'role'] }]
        });

        console.log(`\n⚙️ ПРЕДПОЧТЕНИЯ ПОЛЬЗОВАТЕЛЕЙ (${preferences.length}):`);
        console.log('='.repeat(80));
        console.table(preferences.map(p => ({
            'Пользователь': p.user?.username || '-',
            'Роль': p.user?.role || '-',
            'Вес стоимости': p.weightCost,
            'Вес загрузки': p.weightLoad,
            'Вес качества': p.weightPreference,
            'Порог загрузки': `${(p.maxLoadThreshold * 100).toFixed(0)}%`,
            'Избранные команды': p.preferredTeamIds?.length || 0
        })));

        console.log('\n📊 СТАТИСТИКА ПО СТАТУСАМ ЗАДАЧ:');
        console.log('='.repeat(80));

        const statusStats = await Task.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('status')), 'count']
            ],
            group: ['status']
        });

        statusStats.forEach(s => {
            const barLength = Math.min(30, s.dataValues.count);
            const bar = '█'.repeat(barLength) + '░'.repeat(30 - barLength);
            console.log(`   ${s.status.padEnd(15)}: ${s.dataValues.count.toString().padStart(3)} задач ${bar}`);
        });

        console.log('\n🏷️ СТАТИСТИКА ПО ТЕГАМ ЗАДАЧ:');
        console.log('='.repeat(80));

        const tagStats = await Task.findAll({
            attributes: [
                'tag',
                [sequelize.fn('COUNT', sequelize.col('tag')), 'count']
            ],
            group: ['tag']
        });

        for (const t of tagStats) {
            const totalComplexity = tasks
                .filter(task => task.tag === t.tag)
                .reduce((sum, task) => sum + task.complexity, 0);
            console.log(`   ${t.tag.padEnd(10)}: ${t.dataValues.count} задач (общая сложность: ${totalComplexity} поинтов)`);
        }

        console.log('\n📊 СТАТИСТИКА ПО ПРОЕКТАМ:');
        console.log('='.repeat(80));

        for (const project of projects) {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const completed = projectTasks.filter(t => t.status === 'done').length;
            const inProgress = projectTasks.filter(t => t.status === 'in progress').length;
            const completionRate = projectTasks.length ? ((completed / projectTasks.length) * 100).toFixed(1) : 0;

            const barLength = Math.floor(completionRate / 5);
            const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

            console.log(`\n   📌 ${project.name}:`);
            console.log(`      Статус: ${project.status} | Задач: ${projectTasks.length} | ${bar} ${completionRate}%`);
            console.log(`      Выполнено: ${completed} | В работе: ${inProgress} | Осталось: ${projectTasks.length - completed - inProgress}`);
        }

        console.log('\n📈 ДЕТАЛЬНАЯ ЗАГРУЗКА КОМАНД:');
        console.log('='.repeat(80));

        const sortedTeams = [...teams].sort((a, b) => b.currentLoad - a.currentLoad);

        for (const team of sortedTeams) {
            const percentage = ((team.currentLoad / team.capacity) * 100).toFixed(1);
            const barLength = Math.floor(percentage / 5);
            const bar = '█'.repeat(Math.min(20, barLength)) + '░'.repeat(20 - Math.min(20, barLength));

            let statusIcon = '🟢';
            if (parseFloat(percentage) > 85) statusIcon = '🔴';
            else if (parseFloat(percentage) > 70) statusIcon = '🟡';
            else if (parseFloat(percentage) < 30) statusIcon = '🔵';

            const teamTasks = await Task.findAll({
                where: { assignedTeamId: team.id },
                attributes: ['name', 'complexity', 'business_priority', 'status']
            });

            console.log(`\n   ${statusIcon} ${team.name} (${team.tag}):`);
            console.log(`      Вместимость: ${team.capacity} | Загрузка: ${team.currentLoad} | ${bar} ${percentage}%`);

            if (teamTasks.length > 0) {
                console.log(`      Задачи (${teamTasks.length}):`);
                for (const task of teamTasks.slice(0, 5)) {
                    const priorityIcon = task.business_priority === 3 ? '🔴' :
                                       task.business_priority === 2 ? '🟡' : '🔵';
                    const statusIcon = task.status === 'done' ? '✅' :
                                      task.status === 'in progress' ? '🔄' : '⏳';
                    console.log(`         ${priorityIcon} ${statusIcon} ${task.name.substring(0, 40)}... (${task.complexity} поинтов)`);
                }
                if (teamTasks.length > 5) {
                    console.log(`         ... и еще ${teamTasks.length - 5} задач`);
                }
            } else {
                console.log(`      ⚠️ Нет назначенных задач`);
            }
        }

        const unassignedTasks = tasks.filter(t => !t.assignedTeamId);
        if (unassignedTasks.length > 0) {
            console.log(`\n⚠️ НЕНАЗНАЧЕННЫЕ ЗАДАЧИ (${unassignedTasks.length}):`);
            console.log('='.repeat(80));
            console.table(unassignedTasks.slice(0, 15).map(t => ({
                'ID': t.id,
                'Название': t.name.substring(0, 30) + '...',
                'Тег': t.tag,
                'Сложность': t.complexity,
                'Приоритет': t.business_priority,
                'Проект': t.project?.name.substring(0, 15) || '-',
                'Дедлайн': t.deadline.toISOString().split('T')[0]
            })));
            if (unassignedTasks.length > 15) {
                console.log(`   ... и еще ${unassignedTasks.length - 15} неназначенных задач`);
            }
        } else {
            console.log(`\n✅ ВСЕ ЗАДАЧИ НАЗНАЧЕНЫ!`);
        }

        console.log('\n📊 ОБЩАЯ СВОДКА:');
        console.log('='.repeat(80));

        const assignedCount = tasks.filter(t => t.assignedTeamId).length;
        const totalCost = tasks
            .filter(t => t.assignedTeamId)
            .reduce((sum, task) => {
                const team = teams.find(t => t.id === task.assignedTeamId);
                return sum + (team ? task.complexity * team.cost : 0);
            }, 0);

        const maxLoad = Math.max(...teams.map(t => t.currentLoad / t.capacity), 0);
        const avgLoad = teams.reduce((sum, t) => sum + (t.currentLoad / t.capacity), 0) / teams.length;

        const activeProjects = projects.filter(p => p.status === 'active').length;
        const completedProjects = projects.filter(p => p.status === 'completed').length;

        console.log(`   🏢 Команд: ${teams.length}`);
        console.log(`   👤 Пользователей: ${users.length}`);
        console.log(`   📁 Проектов: ${projects.length} (активных: ${activeProjects}, завершенных: ${completedProjects})`);
        console.log(`   📝 Задач всего: ${tasks.length}`);
        console.log(`   📌 Назначено задач: ${assignedCount}`);
        console.log(`   ⚠️ Не назначено: ${unassignedTasks.length}`);
        console.log(`   💰 Общая стоимость: ${totalCost.toLocaleString()} ₽`);
        console.log(`   📊 Максимальная загрузка: ${(maxLoad * 100).toFixed(1)}%`);
        console.log(`   📊 Средняя загрузка: ${(avgLoad * 100).toFixed(1)}%`);

        console.log('\n💡 РЕКОМЕНДАЦИИ:');
        console.log('='.repeat(80));

        const criticalTeams = teams.filter(t => (t.currentLoad / t.capacity) > 0.85);
        if (criticalTeams.length > 0) {
            console.log(`   ⚠️ Критическая загрузка у команд: ${criticalTeams.map(t => t.name).join(', ')}`);
            console.log(`      → Рекомендуется перераспределить задачи или увеличить вместимость`);
        }

        const underloadedTeams = teams.filter(t => (t.currentLoad / t.capacity) < 0.3 && t.currentLoad > 0);
        if (underloadedTeams.length > 0) {
            console.log(`   💡 Недогруженные команды: ${underloadedTeams.map(t => t.name).join(', ')}`);
            console.log(`      → Можно назначить дополнительные задачи`);
        }

        const projectsWithoutTasks = projects.filter(p => tasks.filter(t => t.projectId === p.id).length === 0);
        if (projectsWithoutTasks.length > 0) {
            console.log(`   📌 Проекты без задач: ${projectsWithoutTasks.map(p => p.name).join(', ')}`);
            console.log(`      → Добавьте задачи в эти проекты`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('✨ Проверка завершена');
        console.log('='.repeat(80) + '\n');

    } catch (error) {
        console.error('❌ Ошибка:', error);
        console.error('Детали:', error.message);
    } finally {
        await sequelize.close();
    }
};

checkDatabase();
