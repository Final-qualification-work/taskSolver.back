const { sequelize, Team, Task } = require('./src/models/index');

const seedDatabase = async () => {
    try {
        console.log('🌱 Начинаем наполнение базы данных...\n');

        // СИНХРОНИЗИРУЕМ МОДЕЛИ С БАЗОЙ ДАННЫХ
        console.log('🔄 Синхронизация моделей с базой данных...');
        await sequelize.sync({ force: true });
        console.log('✅ Таблицы созданы\n');

        // === 1. СОЗДАЕМ КОМАНДЫ ===
        console.log('\n🏢 СОЗДАЕМ КОМАНДЫ...');
        
        const teams = await Team.bulkCreate([
            // FRONTEND команды
            {
                name: 'Frontend Experts',
                tag: 'frontend',
                cost: 3000,
                capacity: 50,
                currentLoad: 0
            },
            {
                name: 'Frontend Middle',
                tag: 'frontend',
                cost: 2200,
                capacity: 35,
                currentLoad: 0
            },
            {
                name: 'Frontend Juniors',
                tag: 'frontend',
                cost: 1500,
                capacity: 25,
                currentLoad: 0
            },
            
            // BACKEND команды
            {
                name: 'Backend Architects',
                tag: 'backend',
                cost: 3500,
                capacity: 45,
                currentLoad: 0
            },
            {
                name: 'Backend Developers',
                tag: 'backend',
                cost: 2500,
                capacity: 30,
                currentLoad: 0
            },
            {
                name: 'Backend Support',
                tag: 'backend',
                cost: 1800,
                capacity: 20,
                currentLoad: 0
            },
            
            // ML команды
            {
                name: 'ML Research',
                tag: 'ML',
                cost: 4500,
                capacity: 30,
                currentLoad: 0
            },
            {
                name: 'ML Engineering',
                tag: 'ML',
                cost: 3500,
                capacity: 25,
                currentLoad: 0
            },
            {
                name: 'Data Analytics',
                tag: 'ML',
                cost: 2800,
                capacity: 20,
                currentLoad: 0
            },
            
            // DEVOPS команды
            {
                name: 'DevOps Senior',
                tag: 'backend',
                cost: 3200,
                capacity: 25,
                currentLoad: 0
            },
            {
                name: 'DevOps Junior',
                tag: 'backend',
                cost: 2000,
                capacity: 15,
                currentLoad: 0
            }
        ]);

        console.log(`✅ Создано ${teams.length} команд`);

        // === 2. СОЗДАЕМ ЗАДАЧИ (БЕЗ НАЗНАЧЕНИЙ) ===
        console.log('\n📝 СОЗДАЕМ ЗАДАЧИ...');

        const tasksData = [
            // FRONTEND задачи
            {
                name: 'Главная страница с анимациями',
                description: 'Разработать адаптивную главную страницу с сложными анимациями',
                tag: 'frontend',
                complexity: 8,
                deadline: new Date('2025-04-10'),
                business_priority: 3,
                status: 'backlog',  // ← НЕ назначено
                assignedTeamId: null
            },
            {
                name: 'Личный кабинет пользователя',
                description: 'Полный функционал личного кабинета с настройками',
                tag: 'frontend',
                complexity: 7,
                deadline: new Date('2025-04-15'),
                business_priority: 3,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Админ-панель',
                description: 'Создать админ-панель для управления контентом',
                tag: 'frontend',
                complexity: 9,
                deadline: new Date('2025-04-25'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Мобильная версия',
                description: 'Адаптировать сайт под мобильные устройства',
                tag: 'frontend',
                complexity: 6,
                deadline: new Date('2025-04-20'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Оптимизация загрузки',
                description: 'Оптимизировать скорость загрузки страниц',
                tag: 'frontend',
                complexity: 5,
                deadline: new Date('2025-04-05'),
                business_priority: 3,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'UI компоненты',
                description: 'Создать библиотеку переиспользуемых компонентов',
                tag: 'frontend',
                complexity: 6,
                deadline: new Date('2025-04-30'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Исправление багов',
                description: 'Исправить критические баги в интерфейсе',
                tag: 'frontend',
                complexity: 4,
                deadline: new Date('2025-04-03'),
                business_priority: 3,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Интеграция с API',
                description: 'Настроить интеграцию фронтенда с бэкендом',
                tag: 'frontend',
                complexity: 7,
                deadline: new Date('2025-04-18'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },

            // BACKEND задачи
            {
                name: 'API авторизации',
                description: 'JWT аутентификация, регистрация, восстановление',
                tag: 'backend',
                complexity: 8,
                deadline: new Date('2025-04-08'),
                business_priority: 3,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Проектирование БД',
                description: 'Спроектировать полную схему базы данных',
                tag: 'backend',
                complexity: 9,
                deadline: new Date('2025-04-12'),
                business_priority: 3,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Микросервисная архитектура',
                description: 'Разделить монолит на микросервисы',
                tag: 'backend',
                complexity: 10,
                deadline: new Date('2025-05-01'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'CI/CD Pipeline',
                description: 'Настроить автоматическую сборку и деплой',
                tag: 'backend',
                complexity: 7,
                deadline: new Date('2025-04-20'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Оптимизация запросов',
                description: 'Оптимизировать медленные SQL запросы',
                tag: 'backend',
                complexity: 6,
                deadline: new Date('2025-04-10'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Кэширование данных',
                description: 'Внедрить Redis для кэширования',
                tag: 'backend',
                complexity: 6,
                deadline: new Date('2025-04-25'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'WebSocket сервер',
                description: 'Реализовать WebSocket для чатов',
                tag: 'backend',
                complexity: 7,
                deadline: new Date('2025-04-30'),
                business_priority: 1,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Нагрузочное тестирование',
                description: 'Провести нагрузочное тестирование API',
                tag: 'backend',
                complexity: 5,
                deadline: new Date('2025-04-15'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Мониторинг и логирование',
                description: 'Настроить централизованное логирование',
                tag: 'backend',
                complexity: 6,
                deadline: new Date('2025-04-22'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Резервное копирование',
                description: 'Настроить автоматическое резервное копирование',
                tag: 'backend',
                complexity: 4,
                deadline: new Date('2025-04-28'),
                business_priority: 1,
                status: 'backlog',
                assignedTeamId: null
            },

            // ML задачи
            {
                name: 'Классификация текстов',
                description: 'Обучить модель для классификации отзывов',
                tag: 'ML',
                complexity: 9,
                deadline: new Date('2025-05-05'),
                business_priority: 3,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Очистка данных',
                description: 'Подготовить и очистить датасет',
                tag: 'ML',
                complexity: 6,
                deadline: new Date('2025-04-10'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Визуализация данных',
                description: 'Создать дашборд для визуализации',
                tag: 'ML',
                complexity: 5,
                deadline: new Date('2025-04-15'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Рекомендательная система',
                description: 'Разработать систему рекомендаций',
                tag: 'ML',
                complexity: 10,
                deadline: new Date('2025-06-01'),
                business_priority: 3,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'A/B тестирование',
                description: 'Провести A/B тестирование моделей',
                tag: 'ML',
                complexity: 7,
                deadline: new Date('2025-04-20'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Feature Engineering',
                description: 'Создать новые признаки для модели',
                tag: 'ML',
                complexity: 6,
                deadline: new Date('2025-04-25'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'ML Pipeline',
                description: 'Настроить пайплайн обучения моделей',
                tag: 'ML',
                complexity: 8,
                deadline: new Date('2025-05-10'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Обучение модели',
                description: 'Обучить нейронную сеть',
                tag: 'ML',
                complexity: 9,
                deadline: new Date('2025-05-15'),
                business_priority: 2,
                status: 'backlog',
                assignedTeamId: null
            },
            {
                name: 'Документация ML',
                description: 'Написать документацию по моделям',
                tag: 'ML',
                complexity: 4,
                deadline: new Date('2025-04-30'),
                business_priority: 1,
                status: 'backlog',
                assignedTeamId: null
            }
        ];

        const tasks = await Task.bulkCreate(tasksData);
        console.log(`✅ Создано ${tasks.length} задач`);

        // === 3. ПРОВЕРКА: НЕТ НАЗНАЧЕНИЙ ===
        console.log('\n🔍 ПРОВЕРКА: ВСЕ ЗАДАЧИ БЕЗ НАЗНАЧЕНИЙ');
        console.log('=============================================\n');
        
        const unassignedTasks = await Task.findAll({
            where: { assignedTeamId: null }
        });
        
        console.log(`✅ Задач без назначения: ${unassignedTasks.length} из ${tasks.length}`);
        console.log(`✅ Статус всех задач: backlog`);
        console.log(`✅ Загрузка всех команд: 0`);

        // Статистика
        console.log('\n📊 СТАТИСТИКА БАЗЫ ДАННЫХ:');
        console.log(`   Команд: ${teams.length}`);
        console.log(`   Задач: ${tasks.length}`);
        console.log(`   Frontend задач: ${tasks.filter(t => t.tag === 'frontend').length}`);
        console.log(`   Backend задач: ${tasks.filter(t => t.tag === 'backend').length}`);
        console.log(`   ML задач: ${tasks.filter(t => t.tag === 'ML').length}`);

        console.log('\n✨ База данных успешно наполнена!');
        console.log('⚠️  ВНИМАНИЕ: Никакие задачи не назначены командам');
        console.log('\n💡 Дальнейшие действия:');
        console.log('   1. Запустите оптимизатор: node test-optimizer.js');
        console.log('   2. Или через API: GET http://localhost:3000/api/tasks/optimize');
        console.log('   3. Проверьте БД: node check-db.js');

    } catch (error) {
        console.error('❌ Ошибка при наполнении базы данных:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
};

seedDatabase();