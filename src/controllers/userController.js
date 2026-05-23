const { User, Team, UserPreference } = require('../models/index');

const getAllUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Доступ запрещен. Требуются права администратора' });
        }

        const users = await User.findAll({
            include: [
                { model: Team, as: 'team', attributes: ['id', 'name', 'tag'] },
                { model: UserPreference, as: 'preferences' }
            ],
            attributes: { exclude: ['password'] }
        });

        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ success: false, message: 'Доступ запрещен' });
        }

        const user = await User.findByPk(id, {
            include: [
                { model: Team, as: 'team', attributes: ['id', 'name', 'tag'] },
                { model: UserPreference, as: 'preferences' }
            ],
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Доступ запрещен. Требуются права администратора' });
        }

        const { username, email, password, role, teamId, isActive } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Пользователь с таким email уже существует' });
        }

        const user = await User.create({
            username,
            email,
            password,
            role: role || 'developer',
            teamId: teamId || null,
            isActive: isActive !== undefined ? isActive : true
        });

        await UserPreference.create({ userId: user.id });

        const userResponse = user.toJSON();
        delete userResponse.password;

        res.status(201).json({ success: true, data: userResponse });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }

        if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ success: false, message: 'Доступ запрещен' });
        }

        const { username, email, password, role, teamId, isActive } = req.body;
        const updateData = {};

        if (username) updateData.username = username;
        if (email) updateData.email = email;
        if (password) updateData.password = password;
        if (teamId !== undefined) updateData.teamId = teamId;
        if (isActive !== undefined && req.user.role === 'admin') updateData.isActive = isActive;
        if (role && req.user.role === 'admin') updateData.role = role;

        await user.update(updateData);

        const updatedUser = await User.findByPk(id, {
            include: [{ model: Team, as: 'team' }],
            attributes: { exclude: ['password'] }
        });

        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Доступ запрещен. Требуются права администратора' });
        }

        const { id } = req.params;

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Нельзя удалить самого себя' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }

        await user.destroy();

        res.status(200).json({ success: true, message: 'Пользователь удален' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            include: [
                { model: Team, as: 'team' },
                { model: UserPreference, as: 'preferences' }
            ],
            attributes: { exclude: ['password'] }
        });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getMe
};
