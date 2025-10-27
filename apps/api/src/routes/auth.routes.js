const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

// POST /auth/register
router.post('/register', async (req, res) => {
    try {
        const { email, username, password, avatarId } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({ error: 'Please provide email, username, and password.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: email,
                username: username,
                passwordHash: hashedPassword,
                avatarId: avatarId || 1,
            },
        });

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
        );

        delete user.passwordHash;
        res.status(201).json({ user, token }); // 201 Created

    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Email or username already exists.' });
        }
        res.status(500).json({ error: error.message });
    }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email: email },
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
        );

        delete user.passwordHash;
        res.json({ user, token }); // 200 OK (default)

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
