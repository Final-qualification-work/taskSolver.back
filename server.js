const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const specs = require('./src/config/swagger');

// Загрузка переменных окружения
dotenv.config();

// Подключение к базе данных
const { testConnection } = require('./src/config/database');
const { syncDatabase } = require('./src/models/index');

// Импорт роутов
const taskRoutes = require('./src/routes/taskRoutes');
const teamRoutes = require('./src/routes/teamRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Swagger документация
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Task Management API Documentation'
}));

// Логирование запросов
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Роуты
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);

// Базовый роут
app.get('/', (req, res) => {
    res.json({ 
        message: 'API системы управления задачами работает',
        version: '1.0.0',
        database: 'SQLite',
        documentation: '/api-docs'
    });
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Что-то пошло не так!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Обработка 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Маршрут не найден'
    });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await testConnection();
        await syncDatabase(false);
        
        app.listen(PORT, () => {
            console.log(`\nСервер запущен на порту ${PORT}`);
            console.log(`База данных SQLite: ${process.env.DB_STORAGE}`);
            console.log(`Документация Swagger: http://localhost:${PORT}/api-docs`);
            console.log(`Режим: ${process.env.NODE_ENV || 'development'}\n`);
        });
    } catch (error) {
        console.error('Ошибка запуска сервера:', error);
        process.exit(1);
    }
};

startServer();