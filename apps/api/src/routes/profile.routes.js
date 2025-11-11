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

// GET /profile/search - ค้นหาผู้ใช้จาก username หรือ userID
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const { username, userId } = req.query;
        const currentUserId = req.user.userId;

        if (!username && !userId) {
            return res.status(400).json({ error: 'Please provide username or userId to search' });
        }

        let users = [];

        if (userId) {
            // ค้นหาจาก userID (exact match)
            const user = await prisma.user.findUnique({
                where: { id: parseInt(userId) },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    avatarId: true,
                }
            });
            
            if (user && user.id !== currentUserId) {
                users = [user];
            }
        } else if (username) {
            // ค้นหาจาก username (partial match)
            users = await prisma.user.findMany({
                where: {
                    username: {
                        contains: username,
                        mode: 'insensitive',
                    },
                    id: {
                        not: currentUserId, // ไม่รวมตัวเอง
                    }
                },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    avatarId: true,
                },
                take: 10, // จำกัดผลลัพธ์ไม่เกิน 10 คน
            });
        }

        res.json(users);

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;