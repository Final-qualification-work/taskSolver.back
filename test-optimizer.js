const { sequelize, Team, Task } = require('./src/models/index');
const SimplexOptimizer = require('./src/utils/simplexOptimizer');

const testOptimizer = async () => {
    try {
        console.log('🧪 ЗАПУСК ОПТИМИЗАТОРА\n');
        console.log('=' .repeat(60));
        
        // Получаем данные из БД
        const teams = await Team.findAll();
        const tasks = await Task.findAll({
            where: { status: 'backlog' } // Только не назначенные задачи
        });
        
        console.log(`\n📊 ДО ОПТИМИЗАЦИИ:`);
        console.log(`   Команд: ${teams.length}`);
        console.log(`   Задач без назначения: ${tasks.length}`);
        
        // Проверяем, что задачи не назначены
        const unassignedBefore = await Task.findAll({
            where: { assignedTeamId: null }
        });
        console.log(`   Задач без назначения в БД: ${unassignedBefore.length}`);
        
        // Создаем оптимизатор
        const optimizer = new SimplexOptimizer(tasks, teams);
        
        // Запускаем оптимизацию
        const solutions = await optimizer.optimize();
        
        if (solutions.length === 0) {
            console.log('\n❌ Не найдено корректных решений');
            return;
        }
        
        // Выбираем лучшее решение (компромиссное)
        const bestSolution = solutions[Math.floor(solutions.length / 2)];
        
        // Сохраняем назначения в БД
        console.log('\n💾 СОХРАНЯЕМ НАЗНАЧЕНИЯ В БАЗУ ДАННЫХ...');
        await optimizer.saveBestSolution(bestSolution);
        
        // ПРОВЕРЯЕМ, ЧТО ЗАДАЧИ НАЗНАЧЕНЫ
        console.log('\n🔍 ПРОВЕРКА ПОСЛЕ ОПТИМИЗАЦИИ:');
        console.log('=' .repeat(60));
        
        const assignedTasks = await Task.findAll({
            where: { assignedTeamId: { [require('sequelize').Op.ne]: null } },
            include: [{ model: Team, as: 'assignedTeam' }]
        });
        
        const unassignedAfter = await Task.findAll({
            where: { assignedTeamId: null }
        });
        
        console.log(`\n✅ Назначено задач: ${assignedTasks.length}`);
        console.log(`⚠️  Осталось не назначено: ${unassignedAfter.length}`);
        
        // Проверяем статусы задач
        const inProgressTasks = await Task.findAll({
            where: { status: 'in progress' }
        });
        console.log(`📌 Задач со статусом 'in progress': ${inProgressTasks.length}`);
        
        // Проверяем загрузку команд
        console.log('\n📈 ЗАГРУЗКА КОМАНД ПОСЛЕ НАЗНАЧЕНИЯ:');
        const updatedTeams = await Team.findAll({
            order: [['tag', 'ASC']]
        });
        
        updatedTeams.forEach(team => {
            const percentage = ((team.currentLoad / team.capacity) * 100).toFixed(1);
            const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
            console.log(`   ${team.name} (${team.tag}): ${bar} ${team.currentLoad}/${team.capacity} (${percentage}%)`);
        });
        
        // Выводим таблицу назначений
        console.log('\n📋 ТАБЛИЦА НАЗНАЧЕНИЙ (первые 10 задач):');
        console.log('=' .repeat(60));
        
        const recentAssignments = await Task.findAll({
            where: { assignedTeamId: { [require('sequelize').Op.ne]: null } },
            include: [{ model: Team, as: 'assignedTeam' }],
            limit: 10
        });
        
        recentAssignments.forEach(task => {
            const priorityIcon = task.business_priority === 3 ? '🔴' :
                               task.business_priority === 2 ? '🟡' : '🔵';
            console.log(`   ${priorityIcon} "${task.name.substring(0, 35)}..." → ${task.assignedTeam.name} (${task.tag} → ${task.assignedTeam.tag})`);
        });
        
        if (assignedTasks.length > 10) {
            console.log(`   ... и еще ${assignedTasks.length - 10} задач`);
        }
        
        // Проверка на ошибки тегов
        console.log('\n🔍 ПРОВЕРКА КОРРЕКТНОСТИ ТЕГОВ:');
        let hasErrors = false;
        for (const task of assignedTasks) {
            if (task.tag !== task.assignedTeam.tag) {
                console.error(`   ❌ ОШИБКА: "${task.name}" (${task.tag}) → ${task.assignedTeam.name} (${task.assignedTeam.tag})`);
                hasErrors = true;
            }
        }
        
        if (!hasErrors) {
            console.log('   ✅ Все назначения корректны по тегам');
        }
        
        console.log('\n✨ ОПТИМИЗАЦИЯ ЗАВЕРШЕНА!');
        console.log('\n💡 Проверьте базу данных:');
        console.log('   node check-db.js');

    } catch (error) {
        console.error('❌ Ошибка:', error);
    } finally {
        await sequelize.close();
    }
};

testOptimizer();