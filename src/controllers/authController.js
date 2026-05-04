const jwt = require('jsonwebtoken');
const { User, Team } = require('../models/index');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Регистрация
const register = async (req, res) => {
    try {
        const { username, email, password, role, teamId } = req.body;
        
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Пользователь уже существует' });
        }

        const user = await User.create({ username, email, password, role, teamId });
        
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        
        res.status(201).json({
            success: true,
            data: { id: user.id, username: user.username, email: user.email, role: user.role },
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Логин
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ where: { email } });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Неверные учетные данные' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
        
        res.status(200).json({
            success: true,
            data: { id: user.id, username: user.username, email: user.email, role: user.role },
            token
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Получить текущего пользователя
const getMe = async (req, res) => {
    res.status(200).json({ success: true, data: req.user });
};

module.exports = { register, login, getMe };