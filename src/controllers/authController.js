const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Team } = require('../models/index');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// @desc    Регистрация нового пользователя
// @route   POST /api/auth/register
const register = async (req, res) => {
    try {
        const { username, email, password, role, teamId } = req.body;
        
        // Проверка на существующего пользователя
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Пользователь с таким email уже существует' 
            });
        }
        
        // Хеширование пароля
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Создание пользователя
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            role: role || 'developer',
            teamId: teamId || null,
            isActive: true
        });
        
        // Создание токена
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        // Ответ без пароля
        const userResponse = user.toJSON();
        delete userResponse.password;
        
        res.status(201).json({
            success: true,
            data: userResponse,
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Вход в систему
// @route   POST /api/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Поиск пользователя
        const user = await User.findOne({ 
            where: { email },
            include: [{ model: Team, as: 'team', required: false }]
        });
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Неверные учетные данные' 
            });
        }
        
        // Проверка пароля
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Неверные учетные данные' 
            });
        }
        
        // Проверка активности пользователя
        if (!user.isActive) {
            return res.status(401).json({ 
                success: false, 
                message: 'Аккаунт деактивирован' 
            });
        }
        
        // Создание токена
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        // Ответ без пароля
        const userResponse = user.toJSON();
        delete userResponse.password;
        
        res.status(200).json({
            success: true,
            data: userResponse,
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// @desc    Получить текущего пользователя
// @route   GET /api/auth/me
const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [{ model: Team, as: 'team', required: false }],
            attributes: { exclude: ['password'] }
        });
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Пользователь не найден' 
            });
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

module.exports = { register, login, getMe };