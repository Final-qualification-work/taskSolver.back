const { sequelize, User, UserPreference } = require('./src/models/index');

const initPreferences = async () => {
    const users = await User.findAll();

    for (const user of users) {
        const existing = await UserPreference.findOne({ where: { userId: user.id } });
        if (!existing) {
            await UserPreference.create({ userId: user.id });
            console.log(`Созданы предпочтения для ${user.username}`);
        }
    }

    console.log('Инициализация завершена');
    process.exit(0);
};

initPreferences();
