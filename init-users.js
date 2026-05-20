/**
 * Объединено с seed.js — один скрипт наполняет всю БД.
 * node init-users.js === npm run seed
 */
console.log('ℹ️  init-users.js → seed.js (команды, проекты, задачи, пользователи)\n');
const { seedDatabase } = require('./seed');
seedDatabase();
