const axios = require('axios');

const API_URL = 'http://localhost:3000/api';
let authToken = null;
let currentUser = null;

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    blue: '\x1b[36m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.blue}📌 ${msg}${colors.reset}`),
    test: (msg) => console.log(`${colors.yellow}🧪 ${msg}${colors.reset}`)
};

const api = async (method, endpoint, data = null, token = null) => {
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    try {
        const response = await axios({ method, url: `${API_URL}${endpoint}`, data, headers });
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { success: false, error: error.response?.data || error.message, status: error.response?.status };
    }
};

const testAuth = async () => {
    log.test('1. АВТОРИЗАЦИЯ');

    const result = await api('POST', '/auth/login', {
        email: 'admin@example.com',
        password: 'admin123'
    });

    if (result.success) {
        authToken = result.data.token;
        log.success(`Вход выполнен: ${result.data.data.email} (${result.data.data.role})`);
        return true;
    } else {
        log.error(`Ошибка входа: ${JSON.stringify(result.error)}`);
        return false;
    }
};

const testProjects = async () => {
    log.test('\n2. ПРОЕКТЫ');

    const projects = await api('GET', '/projects', null, authToken);
    if (projects.success) {
        log.success(`Получено проектов: ${projects.data.data.length}`);
        projects.data.data.forEach(p => {
            console.log(`   - ${p.name} (${p.status})`);
        });
    } else {
        log.error(`Ошибка: ${projects.error?.message}`);
    }
};

const testVisualization = async () => {
    log.test('\n3. ВИЗУАЛИЗАЦИЯ');

    const dashboard = await api('GET', '/visualization/dashboard', null, authToken);
    if (dashboard.success) {
        log.success('Дашборд получен');
        console.log(`   Завершено: ${dashboard.data.data.metrics.completionRate}%`);
    } else {
        log.error(`Ошибка: ${dashboard.error?.message}`);
    }
};

const testOptimization = async () => {
    log.test('\n4. ОПТИМИЗАЦИЯ');

    const optimize = await api('GET', '/tasks/optimize', null, authToken);
    if (optimize.success) {
        log.success('Оптимизация выполнена');
        console.log(`   Найдено решений: ${optimize.data.data.summary.solutionsCount}`);
    } else {
        log.error(`Ошибка: ${optimize.error?.message}`);
    }
};

const testExport = async () => {
    log.test('\n5. ЭКСПОРТ');

    const json = await api('GET', '/tasks/export?format=json', null, authToken);
    if (json.success) {
        log.success(`JSON экспорт: ${json.data.data.count} задач`);
    } else {
        log.error(`Ошибка: ${json.error?.message}`);
    }
};

const runTests = async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 ТЕСТИРОВАНИЕ API');
    console.log('='.repeat(60));

    try {
        await axios.get('http://localhost:3000');
    } catch {
        log.error('Сервер не запущен! Запустите: npm start');
        return;
    }

    const authOk = await testAuth();
    if (!authOk) return;

    await testProjects();
    await testVisualization();
    await testOptimization();
    await testExport();

    console.log('\n' + '='.repeat(60));
    console.log('✨ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО');
    console.log('='.repeat(60) + '\n');
};

runTests();
