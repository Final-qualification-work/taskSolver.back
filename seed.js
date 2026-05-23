const { sequelize, Team, Task, User, Project, UserPreference } = require('./src/models/index');

const TARGET_TASK_COUNT = 40;

const addDays = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(12, 0, 0, 0);
    return date;
};

function createRng(seed = 20260521) {
    let s = seed >>> 0;
    return () => {
        s = (Math.imul(1664525, s) + 1013904223) >>> 0;
        return s / 0x100000000;
    };
}

function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
}

function pickWeighted(rng, items, weights) {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = rng() * total;
    for (let i = 0; i < items.length; i++) {
        r -= weights[i];
        if (r <= 0) return items[i];
    }
    return items[items.length - 1];
}

function int(rng, min, max) {
    return Math.floor(rng() * (max - min + 1)) + min;
}

const defaultPermissions = {
    admin: {
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: true,
        canAssignTeams: true,
        canManageUsers: true,
        canViewReports: true,
        canOptimize: true,
        canManageProjects: true,
        canDeleteProjects: true,
        canManageTeams: true,
    },
    project_manager: {
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: false,
        canAssignTeams: true,
        canManageUsers: false,
        canViewReports: true,
        canOptimize: true,
        canManageProjects: true,
        canDeleteProjects: false,
        canManageTeams: true,
    },
    team_lead: {
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: false,
        canAssignTeams: true,
        canManageUsers: false,
        canViewReports: true,
        canOptimize: true,
        canManageProjects: false,
        canDeleteProjects: false,
        canManageTeams: false,
    },
    developer: {
        canCreateTasks: true,
        canEditTasks: true,
        canDeleteTasks: false,
        canAssignTeams: true,
        canManageUsers: false,
        canViewReports: false,
        canOptimize: false,
        canManageProjects: false,
        canDeleteProjects: false,
        canManageTeams: false,
    },
    viewer: {
        canCreateTasks: false,
        canEditTasks: false,
        canDeleteTasks: false,
        canAssignTeams: false,
        canManageUsers: false,
        canViewReports: true,
        canOptimize: false,
        canManageProjects: false,
        canDeleteProjects: false,
        canManageTeams: false,
    },
};

const TASK_CATALOG = {
    frontend: [
        ['Адаптивная вёрстка каталога', 'Верстка сетки товаров и фильтров для desktop/tablet/mobile'],
        ['Компонент таблицы с сортировкой', 'Универсальная data-table на React с виртуализацией строк'],
        ['Интеграция OAuth-кнопок', 'Вход через корпоративный SSO и обработка callback'],
        ['Страница профиля пользователя', 'Редактирование ФИО, аватара, настроек уведомлений'],
        ['Дашборд KPI на главной', 'Виджеты: выручка, конверсия, активные заказы'],
        ['Тёмная тема интерфейса', 'CSS-переменные и переключатель theme в шапке'],
        ['Форма многошагового оформления', 'Wizard из 4 шагов с валидацией и сохранением черновика'],
        ['Accessibility-аудит UI', 'Исправление контраста, focus-trap, aria-labels'],
        ['Storybook для UI-kit', 'Документация и визуальные тесты базовых компонентов'],
        ['Оптимизация LCP главной', 'Lazy-load изображений, preload шрифтов, code-splitting'],
        ['PWA: offline-режим', 'Service Worker и кэш статики для полевых сотрудников'],
        ['Интернационализация i18n', 'Переключение RU/EN, формат дат и валют'],
        ['Чат поддержки в виджете', 'WebSocket-клиент и список обращений'],
        ['Календарь планирования спринтов', 'Drag-and-drop задач по дням и исполнителям'],
        ['Экран согласования документов', 'Статусы approve/reject и история комментариев'],
        ['Визуализация org-structure', 'Дерево подразделений с поиском и collapse'],
        ['Модуль push-уведомлений', 'Подписка в браузере и центр уведомлений'],
        ['Рефакторинг state management', 'Перенос контекста на Zustand, разбиение store'],
    ],
    backend: [
        ['REST API заказов v2', 'CRUD заказов, пагинация, фильтры по статусу и дате'],
        ['JWT и refresh-токены', 'Ротация refresh, blacklist при logout, rate-limit login'],
        ['Миграция схемы PostgreSQL', 'Новые индексы, партиционирование таблицы events'],
        ['Очередь фоновых задач', 'BullMQ: email, отчёты, синхронизация с 1С'],
        ['Интеграция платёжного шлюза', 'Webhook подтверждения оплаты и идемпотентность'],
        ['Кэширование Redis', 'Кэш справочников TTL 15 мин, инвалидация по событию'],
        ['Экспорт отчётов в Excel', 'Генерация xlsx потоком для больших выборок'],
        ['Аудит изменений сущностей', 'Таблица audit_log: кто, когда, diff JSON'],
        ['API rate limiting', 'Лимиты по API-key и IP, ответ 429 с Retry-After'],
        ['Синхронизация с Active Directory', 'Импорт пользователей и групп по LDAP'],
        ['Health-check и метрики', 'Эндпоинты /health, Prometheus counters'],
        ['Версионирование OpenAPI', 'Swagger 3.0, генерация клиента для фронта'],
        ['Обработка загрузки файлов', 'S3 pre-signed URL, проверка MIME и размера'],
        ['Распределённые транзакции заказа', 'Saga: резерв склада → оплата → отгрузка'],
        ['Поиск по Elasticsearch', 'Индексация каталога, fuzzy search, facets'],
        ['Webhook для партнёров', 'Подпись HMAC, retry с exponential backoff'],
        ['Резервное копирование БД', 'Cron pg_dump в object storage, проверка restore'],
        ['Нагрузочное тестирование API', 'k6-сценарии: 500 RPS на чтение каталога'],
    ],
    ML: [
        ['Обучение модели рекомендаций', 'Matrix factorization на истории покупок за 12 мес'],
        ['Пайплайн очистки датасета', 'Удаление дублей, заполнение пропусков, нормализация'],
        ['A/B тест ранжирования', 'Сравнение baseline vs новой модели, метрика CTR'],
        ['Классификация обращений в поддержку', 'BERT fine-tune на 8 категориях тикетов'],
        ['Прогноз оттока клиентов', 'Feature engineering, XGBoost, SHAP-объяснения'],
        ['Детекция аномалий в транзакциях', 'Isolation Forest, алерты в Slack'],
        ['Сегментация пользователей RFM', 'Кластеризация K-means, визуализация в BI'],
        ['MLOps: деплой модели', 'Docker + MLflow registry, canary 10% трафика'],
        ['Разметка обучающей выборки', 'Инструкция для разметчиков, контроль качества 5%'],
        ['Оценка качества NER', 'F1 по сущностям: товар, бренд, артикул'],
        ['Чат-бот на базе LLM', 'RAG по базе знаний, ограничение галлюцинаций'],
        ['Прогноз спроса на склад', 'Временной ряд Prophet, горизонт 4 недели'],
        ['Рекомендации «похожие товары»', 'Embeddings каталога, cosine similarity top-20'],
        ['Мониторинг data drift', 'Сравнение распределений признаков train vs prod'],
        ['Оптимизация гиперпараметров', 'Optuna 50 trials, целевая метрика NDCG@10'],
    ],
};

const STATUSES = ['not groomed', 'backlog', 'todo', 'in progress', 'done'];

function statusWeightsForProject(projectStatus) {
    if (projectStatus === 'completed') {
        return [0.02, 0.05, 0.08, 0.15, 0.7];
    }
    if (projectStatus === 'planning') {
        return [0.2, 0.35, 0.25, 0.15, 0.05];
    }
    if (projectStatus === 'on_hold') {
        return [0.1, 0.4, 0.25, 0.2, 0.05];
    }
    return [0.06, 0.18, 0.24, 0.34, 0.18];
}

function generateTasks(rng, teams, projects) {
    const tasks = [];
    const usedNames = new Set();

    const projectWeights = projects.map((p) => {
        if (p.status === 'active') return 3;
        if (p.status === 'planning') return 1.5;
        if (p.status === 'completed') return 0.8;
        return 0.6;
    });

    const teamsByTag = {
        frontend: teams.filter((t) => t.tag === 'frontend'),
        backend: teams.filter((t) => t.tag === 'backend'),
        ML: teams.filter((t) => t.tag === 'ML'),
    };

    let catalogIndex = { frontend: 0, backend: 0, ML: 0 };

    while (tasks.length < TARGET_TASK_COUNT) {
        const project = pickWeighted(rng, projects, projectWeights);
        const tag = pickWeighted(rng, ['frontend', 'backend', 'ML'], [0.38, 0.42, 0.2]);

        const catalog = TASK_CATALOG[tag];
        let idx = catalogIndex[tag] % catalog.length;
        catalogIndex[tag] += 1;
        let [name, description] = catalog[idx];

        if (usedNames.has(name)) {
            name = `${name} (${project.name.slice(0, 12)}…)`;
        }
        usedNames.add(name);

        const status = pickWeighted(rng, STATUSES, statusWeightsForProject(project.status));

        let complexity = int(rng, 2, 9);
        if (status === 'done') complexity = int(rng, 2, 6);
        if (status === 'not groomed') complexity = int(rng, 3, 8);

        const business_priority =
            status === 'done'
                ? int(rng, 1, 2)
                : pickWeighted(rng, [1, 2, 3], [0.15, 0.45, 0.4]);

        let deadlineDays = int(rng, 3, 90);
        if (status === 'in progress') deadlineDays = int(rng, 2, 21);
        if (status === 'done') deadlineDays = int(rng, 14, 60);
        if (business_priority === 3 && status !== 'done') deadlineDays = int(rng, 2, 14);

        let assignedTeamId = null;
        const assignChance = status === 'done' ? 0.95 : status === 'not groomed' ? 0.35 : 0.82;

        if (rng() < assignChance) {
            const pool = teamsByTag[tag];
            if (pool.length) {
                assignedTeamId = pick(rng, pool).id;
            }
        }

        tasks.push({
            name,
            description,
            tag,
            complexity,
            deadline: addDays(deadlineDays),
            business_priority,
            status,
            projectId: project.id,
            assignedTeamId,
        });
    }

    const frontLead = teams.find((t) => t.name === 'Frontend Experts');
    const backLead = teams.find((t) => t.name === 'Backend Architects');
    let frontOverload = 0;
    let backOverload = 0;
    for (const task of tasks) {
        if (task.status === 'done' || task.status === 'not groomed') continue;
        if (task.tag === 'frontend' && frontOverload < 7) {
            task.assignedTeamId = frontLead.id;
            task.complexity = Math.max(task.complexity, int(rng, 7, 10));
            task.business_priority = 3;
            task.status = pick(rng, ['in progress', 'todo']);
            frontOverload += 1;
        } else if (task.tag === 'backend' && backOverload < 7) {
            task.assignedTeamId = backLead.id;
            task.complexity = Math.max(task.complexity, int(rng, 7, 10));
            task.business_priority = 3;
            task.status = pick(rng, ['in progress', 'todo']);
            backOverload += 1;
        }
        if (frontOverload >= 7 && backOverload >= 7) break;
    }

    const unassignedHighPriority = tasks.filter(
        (t) => !t.assignedTeamId && t.business_priority >= 2 && t.status !== 'done',
    );
    for (let i = 0; i < Math.min(12, unassignedHighPriority.length); i++) {
        unassignedHighPriority[i].business_priority = 3;
        unassignedHighPriority[i].status = pick(rng, ['backlog', 'todo', 'not groomed']);
    }

    return tasks;
}

async function recalculateTeamLoads(teams, tasks) {
    const loadByTeam = new Map(teams.map((t) => [t.id, 0]));
    for (const task of tasks) {
        if (task.assignedTeamId) {
            loadByTeam.set(
                task.assignedTeamId,
                (loadByTeam.get(task.assignedTeamId) || 0) + task.complexity,
            );
        }
    }
    for (const team of teams) {
        await team.update({ currentLoad: loadByTeam.get(team.id) || 0 });
    }
}

function printTaskStats(tasks, teams) {
    const byStatus = {};
    for (const s of STATUSES) byStatus[s] = 0;
    for (const t of tasks) byStatus[t.status] = (byStatus[t.status] || 0) + 1;

    const unassigned = tasks.filter((t) => !t.assignedTeamId).length;
    const overloaded = teams.filter((t) => t.currentLoad > t.capacity * 0.85).length;

    console.log('   📈 Статистика задач:');
    console.log(`      По статусам: ${STATUSES.map((s) => `${s}=${byStatus[s]}`).join(', ')}`);
    console.log(`      Без команды: ${unassigned} · Перегруженных команд: ${overloaded}`);
    console.log(
        `      Приоритет 3: ${tasks.filter((t) => t.business_priority === 3).length} · ` +
            `В работе: ${byStatus['in progress']}`,
    );
}

async function seedDatabase() {
    const rng = createRng();

    try {
        console.log('🌱 Наполнение БД (реалистичный демо-набор)\n');
        console.log('='.repeat(60));

        console.log('🔄 Пересоздание таблиц (sync force)...');
        await sequelize.sync({ force: true });
        console.log('✅ Таблицы созданы\n');

        console.log('🏢 Команды...');
        const teams = await Team.bulkCreate([
            { name: 'Frontend Experts', tag: 'frontend', cost: 3200, capacity: 48, currentLoad: 0 },
            { name: 'Frontend Middle', tag: 'frontend', cost: 2400, capacity: 36, currentLoad: 0 },
            { name: 'Frontend Juniors', tag: 'frontend', cost: 1600, capacity: 28, currentLoad: 0 },
            { name: 'Backend Architects', tag: 'backend', cost: 3800, capacity: 42, currentLoad: 0 },
            { name: 'Backend Developers', tag: 'backend', cost: 2600, capacity: 38, currentLoad: 0 },
            { name: 'Backend Support', tag: 'backend', cost: 1900, capacity: 22, currentLoad: 0 },
            { name: 'ML Research', tag: 'ML', cost: 4800, capacity: 32, currentLoad: 0 },
            { name: 'ML Engineering', tag: 'ML', cost: 3600, capacity: 28, currentLoad: 0 },
            { name: 'Data Analytics', tag: 'ML', cost: 2900, capacity: 24, currentLoad: 0 },
            { name: 'Platform DevOps', tag: 'backend', cost: 3400, capacity: 26, currentLoad: 0 },
            { name: 'QA Automation', tag: 'backend', cost: 2100, capacity: 30, currentLoad: 0 },
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
                    username: 'teamlead_ml',
                    email: 'tl.ml@example.com',
                    password: 'tl123',
                    role: 'team_lead',
                    teamId: teams[6].id,
                    permissions: defaultPermissions.team_lead,
                    isActive: true,
                },
                {
                    username: 'developer_frontend',
                    email: 'dev.frontend@example.com',
                    password: 'dev123',
                    role: 'developer',
                    teamId: teams[1].id,
                    permissions: defaultPermissions.developer,
                    isActive: true,
                },
                {
                    username: 'developer_backend',
                    email: 'dev.backend@example.com',
                    password: 'dev123',
                    role: 'developer',
                    teamId: teams[4].id,
                    permissions: defaultPermissions.developer,
                    isActive: true,
                },
                {
                    username: 'developer_ml',
                    email: 'dev.ml@example.com',
                    password: 'dev123',
                    role: 'developer',
                    teamId: teams[7].id,
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

        const pmId = users.find((u) => u.role === 'project_manager').id;

        console.log('\n📁 Проекты...');
        const projects = await Project.bulkCreate([
            {
                name: 'Корпоративный портал',
                description:
                    'Единая точка входа для сотрудников: новости, заявки, оргструктура, личный кабинет',
                status: 'active',
                startDate: addDays(-45),
                endDate: addDays(120),
                budget: 2_850_000,
                teamIds: [teams[0].id, teams[1].id, teams[3].id, teams[4].id],
                createdBy: pmId,
            },
            {
                name: 'Рекомендательная система',
                description: 'Персонализация витрины интернет-магазина: ML-ранжирование и A/B тесты',
                status: 'active',
                startDate: addDays(-30),
                endDate: addDays(150),
                budget: 3_200_000,
                teamIds: [teams[6].id, teams[7].id, teams[8].id, teams[4].id],
                createdBy: pmId,
            },
            {
                name: 'Мобильное приложение B2B',
                description: 'iOS/Android для торговых представителей: заказы, остатки, геолокация',
                status: 'active',
                startDate: addDays(-20),
                endDate: addDays(90),
                budget: 1_950_000,
                teamIds: [teams[0].id, teams[2].id, teams[4].id, teams[9].id],
                createdBy: pmId,
            },
            {
                name: 'BI-платформа и отчётность',
                description: 'Витрины данных, self-service отчёты для финансов и операционного блока',
                status: 'planning',
                startDate: addDays(-5),
                endDate: addDays(180),
                budget: 1_400_000,
                teamIds: [teams[8].id, teams[3].id, teams[5].id],
                createdBy: pmId,
            },
            {
                name: 'Интеграция с 1С ERP',
                description: 'Двусторонний обмен номенклатурой, заказами и остатками со складом',
                status: 'on_hold',
                startDate: addDays(-60),
                endDate: addDays(200),
                budget: 980_000,
                teamIds: [teams[5].id, teams[9].id, teams[3].id],
                createdBy: pmId,
            },
            {
                name: 'Редизайн маркетингового сайта',
                description: 'Новый лендинг, CMS, SEO — проект завершён, идёт поддержка',
                status: 'completed',
                startDate: addDays(-120),
                endDate: addDays(-10),
                budget: 720_000,
                teamIds: [teams[0].id, teams[2].id],
                createdBy: pmId,
            },
        ]);
        console.log(`   ✅ ${projects.length} проектов`);

        console.log(`\n📝 Задачи (${TARGET_TASK_COUNT} шт.)...`);
        const tasksData = generateTasks(rng, teams, projects);
        const tasks = await Task.bulkCreate(tasksData);
        console.log(`   ✅ ${tasks.length} задач`);

        await recalculateTeamLoads(teams, tasksData);
        await Promise.all(teams.map((t) => t.reload()));
        printTaskStats(tasksData, teams);

        console.log('\n⚙️ Предпочтения оптимизации...');
        await UserPreference.bulkCreate([
            {
                userId: users[0].id,
                weightCost: 0.33,
                weightLoad: 0.33,
                weightPreference: 0.34,
                maxLoadThreshold: 0.85,
                preferredTeamIds: [],
                preferredTags: [],
            },
            {
                userId: users[1].id,
                weightCost: 0.45,
                weightLoad: 0.35,
                weightPreference: 0.2,
                maxLoadThreshold: 0.8,
                preferredTeamIds: [teams[0].id, teams[3].id, teams[6].id],
                preferredTags: ['frontend', 'backend', 'ML'],
            },
            {
                userId: users[2].id,
                weightCost: 0.2,
                weightLoad: 0.35,
                weightPreference: 0.45,
                maxLoadThreshold: 0.75,
                preferredTeamIds: [teams[0].id, teams[1].id],
                preferredTags: ['frontend'],
            },
            {
                userId: users[3].id,
                weightCost: 0.25,
                weightLoad: 0.4,
                weightPreference: 0.35,
                maxLoadThreshold: 0.72,
                preferredTeamIds: [teams[3].id, teams[4].id],
                preferredTags: ['backend'],
            },
            {
                userId: users[4].id,
                weightCost: 0.15,
                weightLoad: 0.25,
                weightPreference: 0.6,
                maxLoadThreshold: 0.7,
                preferredTeamIds: [teams[6].id, teams[7].id],
                preferredTags: ['ML'],
            },
            {
                userId: users[5].id,
                weightCost: 0.33,
                weightLoad: 0.33,
                weightPreference: 0.34,
                maxLoadThreshold: 0.85,
                preferredTeamIds: [teams[1].id],
                preferredTags: ['frontend'],
            },
            {
                userId: users[6].id,
                weightCost: 0.33,
                weightLoad: 0.33,
                weightPreference: 0.34,
                maxLoadThreshold: 0.85,
                preferredTeamIds: [teams[4].id],
                preferredTags: ['backend'],
            },
            {
                userId: users[7].id,
                weightCost: 0.33,
                weightLoad: 0.33,
                weightPreference: 0.34,
                maxLoadThreshold: 0.85,
                preferredTeamIds: [teams[7].id],
                preferredTags: ['ML'],
            },
        ]);
        console.log('   ✅ предпочтения созданы');

        console.log('\n📊 Итого:');
        console.log(
            `   Команд: ${teams.length} · Пользователей: ${users.length} · ` +
                `Проектов: ${projects.length} · Задач: ${tasks.length}`,
        );

        console.log('\n🔑 Учётные записи:');
        console.log('='.repeat(66));
        console.log('| Роль               | Email                       | Пароль    |');
        console.log('|--------------------|-----------------------------|-----------|');
        console.log('| Администратор      | admin@example.com           | admin123  |');
        console.log('| Project Manager    | pm@example.com              | pm123     |');
        console.log('| Team Lead Frontend | tl.frontend@example.com     | tl123     |');
        console.log('| Team Lead Backend  | tl.backend@example.com      | tl123     |');
        console.log('| Team Lead ML       | tl.ml@example.com           | tl123     |');
        console.log('| Developer Frontend | dev.frontend@example.com    | dev123    |');
        console.log('| Developer Backend  | dev.backend@example.com     | dev123    |');
        console.log('| Developer ML       | dev.ml@example.com          | dev123    |');
        console.log('| Наблюдатель        | viewer@example.com          | viewer123 |');
        console.log('='.repeat(66));
        console.log('\n💡 Для демо:');
        console.log('   · PM / тимлиды — оптимизация и перегруженные команды');
        console.log('   · ~15–20 задач без команды — кандидаты для распределения');
        console.log('   · Фильтр «Мои задачи» — dev.frontend / dev.backend / dev.ml');
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

module.exports = { seedDatabase, generateTasks, TARGET_TASK_COUNT };
