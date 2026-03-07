const { sequelize, Team, Task } = require('./src/models/index');

const seedDatabase = async () => {
    try {
        console.log('🌱 Начинаем наполнение базы данных...\n');

        // СИНХРОНИЗИРУЕМ МОДЕЛИ С БАЗОЙ ДАННЫХ (СОЗДАЕМ ТАБЛИЦЫ)
        console.log('🔄 Синхронизация моделей с базой данных...');
        await sequelize.sync({ force: true }); // force: true пересоздаст таблицы
        console.log('✅ Таблицы созданы\n');

        // // ИЛИ если не хотите удалять существующие таблицы:
        // await sequelize.sync(); // просто синхронизирует без удаления
        // // А потом очистите данные:
        // await Team.destroy({ where: {}, truncate: true });
        // await Task.destroy({ where: {}, truncate: true });

        console.log('📋 Старые данные удалены (таблицы пересозданы)');

        // === 1. СОЗДАЕМ КОМАНДЫ ===
        console.log('\n🏢 СОЗДАЕМ КОМАНДЫ...');
        
        const teams = await Team.bulkCreate([
            {
                name: 'Frontend Pros',
                tag: 'frontend',
                cost: 2500,
                capacity: 40,
                currentLoad: 0
            },
            {
                name: 'Frontend Juniors',
                tag: 'frontend',
                cost: 1500,
                capacity: 25,
                currentLoad: 0
            },
            {
                name: 'Backend Masters',
                tag: 'backend',
                cost: 3000,
                capacity: 35,
                currentLoad: 0
            },
            {
                name: 'Backend Support',
                tag: 'backend',
                cost: 2000,
                capacity: 20,
                currentLoad: 0
            },
            {
                name: 'ML Engineers',
                tag: 'ML',
                cost: 4000,
                capacity: 30,
                currentLoad: 0
            },
            {
                name: 'Data Science Team',
                tag: 'ML',
                cost: 3500,
                capacity: 25,
                currentLoad: 0
            },
            {
                name: 'DevOps Team',
                tag: 'backend',
                cost: 2800,
                capacity: 15,
                currentLoad: 0
            }
        ]);

        console.log(`✅ Создано ${teams.length} команд:`);
        teams.forEach(team => {
            console.log(`   - ${team.name} (${team.tag}): ${team.cost}₽/час, вместимость: ${team.capacity}`);
        });

        // === 2. СОЗДАЕМ ЗАДАЧИ ===
        console.log('\n📝 СОЗДАЕМ ЗАДАЧИ...');

        const tasksData = [
            // Frontend задачи (высокий приоритет)
            {
                name: 'Разработать главную страницу',
                description: 'Создать адаптивную главную страницу с анимациями и слайдерами',
                tag: 'frontend',
                complexity: 5,
                deadline: new Date('2025-04-15'),
                business_priority: 3,
                status: 'backlog'
            },
            {
                name: 'Создать личный кабинет пользователя',
                description: 'Разработать интерфейс личного кабинета с настройками профиля',
                tag: 'frontend',
                complexity: 7,
                deadline: new Date('2025-04-20'),
                business_priority: 3,
                status: 'backlog'
            },
            {
                name: 'Оптимизация производительности',
                description: 'Оптимизировать загрузку изображений, добавить ленивую загрузку',
                tag: 'frontend',
                complexity: 4,
                deadline: new Date('2025-04-01'),
                business_priority: 2,
                status: 'backlog'
            },
            {
                name: 'Разработать UI компоненты',
                description: 'Создать библиотеку переиспользуемых компонентов',
                tag: 'frontend',
                complexity: 6,
                deadline: new Date('2025-04-25'),
                business_priority: 2,
                status: 'backlog'
            },
            {
                name: 'Исправить баги в интерфейсе',
                description: 'Исправить критичные баги на странице авторизации',
                tag: 'frontend',
                complexity: 3,
                deadline: new Date('2025-03-30'),
                business_priority: 3,
                status: 'backlog'
            },

            // Backend задачи
            {
                name: 'API для авторизации',
                description: 'Реализовать JWT аутентификацию, регистрацию, восстановление пароля',
                tag: 'backend',
                complexity: 8,
                deadline: new Date('2025-03-20'),
                business_priority: 3,
                status: 'backlog'
            },
            {
                name: 'Проектирование базы данных',
                description: 'Спроектировать схему БД, создать миграции',
                tag: 'backend',
                complexity: 6,
                deadline: new Date('2025-03-25'),
                business_priority: 3,
                status: 'backlog'
            },
            {
                name: 'Разделение на микросервисы',
                description: 'Разделить монолит на микросервисную архитектуру',
                tag: 'backend',
                complexity: 9,
                deadline: new Date('2025-05-15'),
                business_priority: 2,
                status: 'backlog'
            },
            {
                name: 'Настройка CI/CD',
                description: 'Настроить автоматическое тестирование и деплой',
                tag: 'backend',
                complexity: 5,
                deadline: new Date('2025-04-10'),
                business_priority: 2,
                status: 'backlog'
            },
            {
                name: 'Оптимизация запросов к БД',
                description: 'Оптимизировать медленные запросы, добавить индексы',
                tag: 'backend',
                complexity: 4,
                deadline: new Date('2025-04-05'),
                business_priority: 2,
                status: 'backlog'
            },

            // ML задачи
            {
                name: 'Модель классификации текстов',
                description: 'Обучить модель для классификации отзывов на позитивные/негативные',
                tag: 'ML',
                complexity: 8,
                deadline: new Date('2025-05-01'),
                business_priority: 2,
                status: 'backlog'
            },
            {
                name: 'Очистка и подготовка данных',
                description: 'Подготовить датасет для обучения, удалить выбросы',
                tag: 'ML',
                complexity: 5,
                deadline: new Date('2025-04-10'),
                business_priority: 1,
                status: 'backlog'
            },
            {
                name: 'Визуализация результатов',
                description: 'Создать дашборд для визуализации предсказаний модели',
                tag: 'ML',
                complexity: 4,
                deadline: new Date('2025-04-05'),
                business_priority: 1,
                status: 'backlog'
            },
            {
                name: 'Обучение рекомендательной системы',
                description: 'Разработать модель для рекомендаций товаров',
                tag: 'ML',
                complexity: 9,
                deadline: new Date('2025-06-01'),
                business_priority: 3,
                status: 'backlog'
            },
            {
                name: 'A/B тестирование моделей',
                description: 'Провести A/B тестирование разных моделей',
                tag: 'ML',
                complexity: 6,
                deadline: new Date('2025-04-20'),
                business_priority: 2,
                status: 'backlog'
            }
        ];

        const tasks = await Task.bulkCreate(tasksData);
        console.log(`✅ Создано ${tasks.length} задач`);

        // === 3. НАЗНАЧАЕМ ЗАДАЧИ КОМАНДАМ ===
        console.log('\n🤝 НАЗНАЧАЕМ ЗАДАЧИ КОМАНДАМ...');

        // Группируем команды по тегам
        const teamsByTag = {
            frontend: teams.filter(t => t.tag === 'frontend'),
            backend: teams.filter(t => t.tag === 'backend'),
            ML: teams.filter(t => t.tag === 'ML')
        };

        // Группируем задачи по тегам
        const tasksByTag = {
            frontend: tasks.filter(t => t.tag === 'frontend'),
            backend: tasks.filter(t => t.tag === 'backend'),
            ML: tasks.filter(t => t.tag === 'ML')
        };

        // Сортируем задачи по приоритету (сначала высокий)
        for (const tag in tasksByTag) {
            tasksByTag[tag].sort((a, b) => b.business_priority - a.business_priority);
        }

        const assignments = [];
        
        // Функция для распределения задач
        const assignTasksToTeams = (tag, tasks, teams) => {
            if (teams.length === 0 || tasks.length === 0) return;

            console.log(`\n📌 Распределяем ${tag.toUpperCase()} задачи:`);
            
            // Копируем загрузку команд для расчетов
            const teamLoads = {};
            teams.forEach(team => {
                teamLoads[team.id] = 0;
            });

            // Распределяем задачи
            tasks.forEach((task, index) => {
                // Ищем команду с наименьшей загрузкой, но с достаточной вместимостью
                const availableTeams = teams.filter(team => 
                    teamLoads[team.id] + task.complexity <= team.capacity
                );

                if (availableTeams.length > 0) {
                    // Выбираем команду с наименьшей загрузкой
                    const selectedTeam = availableTeams.reduce((min, team) => 
                        teamLoads[team.id] < teamLoads[min.id] ? team : min
                    );

                    assignments.push({
                        task,
                        team: selectedTeam,
                        loadAfter: teamLoads[selectedTeam.id] + task.complexity
                    });

                    teamLoads[selectedTeam.id] += task.complexity;

                    const priority = task.business_priority === 3 ? '🔴' :
                                   task.business_priority === 2 ? '🟡' : '🔵';
                    
                    console.log(`   ${priority} "${task.name.substring(0, 30)}..." → ${selectedTeam.name} (загрузка: ${teamLoads[selectedTeam.id]}/${selectedTeam.capacity})`);
                } else {
                    console.log(`   ⚠️  Нет места для "${task.name.substring(0, 30)}..."`);
                }
            });
        };

        // Распределяем задачи по каждой категории
        assignTasksToTeams('frontend', tasksByTag.frontend, teamsByTag.frontend);
        assignTasksToTeams('backend', tasksByTag.backend, teamsByTag.backend);
        assignTasksToTeams('ML', tasksByTag.ML, teamsByTag.ML);

        // Сохраняем назначения в БД
        console.log('\n💾 Сохраняем назначения...');
        
        for (const assignment of assignments) {
            await assignment.task.update({
                assignedTeamId: assignment.team.id,
                status: 'in progress'
            });

            await assignment.team.update({
                currentLoad: assignment.loadAfter
            });
        }

        console.log(`✅ Назначено ${assignments.length} задач`);

        // === 4. ИТОГОВАЯ СТАТИСТИКА ===
        console.log('\n📊 ИТОГОВАЯ СТАТИСТИКА:');
        
        // Общая статистика
        console.log(`\n   Команд: ${await Team.count()}`);
        console.log(`   Задач: ${await Task.count()}`);
        console.log(`   Назначено: ${assignments.length}`);
        console.log(`   Не назначено: ${tasks.length - assignments.length}`);

        // Статистика по статусам
        const statusStats = await Task.findAll({
            attributes: ['status', [sequelize.fn('COUNT', sequelize.col('status')), 'count']],
            group: ['status']
        });
        
        console.log('\n📌 Задачи по статусам:');
        statusStats.forEach(s => {
            console.log(`   ${s.status}: ${s.dataValues.count}`);
        });

        // Статистика по тегам
        const tagStats = await Task.findAll({
            attributes: ['tag', [sequelize.fn('COUNT', sequelize.col('tag')), 'count']],
            group: ['tag']
        });
        
        console.log('\n🏷️ Задачи по тегам:');
        tagStats.forEach(t => {
            console.log(`   ${t.tag}: ${t.dataValues.count}`);
        });

        // Загрузка команд
        const updatedTeams = await Team.findAll({
            order: [['tag', 'ASC'], ['currentLoad', 'DESC']]
        });

        console.log('\n📈 ЗАГРУЗКА КОМАНД:');
        updatedTeams.forEach(team => {
            const percentage = ((team.currentLoad / team.capacity) * 100).toFixed(1);
            const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
            console.log(`   ${team.name} (${team.tag}): ${bar} ${team.currentLoad}/${team.capacity} (${percentage}%)`);
        });

        // Задачи по командам
        console.log('\n📋 ЗАДАЧИ ПО КОМАНДАМ:');
        for (const team of updatedTeams) {
            const teamTasks = await Task.findAll({
                where: { assignedTeamId: team.id },
                order: [['business_priority', 'DESC'], ['deadline', 'ASC']]
            });
            
            if (teamTasks.length > 0) {
                console.log(`\n${team.name} (${teamTasks.length} задач):`);
                teamTasks.forEach(task => {
                    const priority = task.business_priority === 3 ? '🔴' :
                                   task.business_priority === 2 ? '🟡' : '🔵';
                    const daysLeft = Math.ceil((task.deadline - new Date()) / (1000 * 60 * 60 * 24));
                    console.log(`   ${priority} ${task.name} (сложн: ${task.complexity}, осталось дней: ${daysLeft})`);
                });
            }
        }

        console.log('\n✨ База данных успешно наполнена и задачи распределены!');
        console.log('\n🔍 Проверьте результаты:');
        console.log('   http://localhost:3000/api/teams');
        console.log('   http://localhost:3000/api/tasks');
        console.log('   http://localhost:3000/api/teams/load');
        console.log('   http://localhost:3000/api/tasks/statistics');

    } catch (error) {
        console.error('❌ Ошибка при наполнении базы данных:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
};

seedDatabase();