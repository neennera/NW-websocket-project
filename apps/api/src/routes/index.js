const express = require('express');

const router = express.Router();

// GET / - hello world
router.get('/', (req, res) => {
  res.json({ message: 'hello world' });
});

// GET /api/health - health check
router.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
