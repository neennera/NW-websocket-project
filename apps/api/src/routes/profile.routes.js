const express = require('express');
const { PrismaClient } = require('@prisma/client');

const { authenticateToken } = require('../auth.middleware.js');

const router = express.Router();
const prisma = new PrismaClient();

// GET /profile/me
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        delete user.passwordHash;
        res.json(user);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /profile/me
router.put('/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { username, avatarId } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                username: username,
                avatarId: avatarId,
            },
        });

        delete updatedUser.passwordHash;
        res.json(updatedUser);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;