const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.sendStatus(401); // 401 = Unauthorized
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, userPayload) => {
        if (err) {
            console.log('JWT Error:', err.message);
            return res.sendStatus(403); // 403 = Forbidden
        }

        req.user = userPayload;
        next();
    });
}

module.exports = { authenticateToken };