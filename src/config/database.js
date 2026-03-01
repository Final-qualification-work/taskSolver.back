const { Sequelize } = require('sequelize');

// Создаем подключение к SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: console.log, // Можно отключить: false
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: false
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Функция для проверки подключения
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Подключение к SQLite установлено успешно.');
        console.log(`Файл базы данных: ${process.env.DB_STORAGE}`);
    } catch (error) {
        console.error('Ошибка подключения к SQLite:', error);
        throw error;
    }
};

module.exports = { sequelize, testConnection };