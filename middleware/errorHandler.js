const jwt = require('jsonwebtoken');
const { Token } = require('../models/tokenModel');
const { User } = require('../models/userModel');

async function errorHandler(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        if (err.message !== 'jwt expired') {
            return res.status(401).json({ type: err.name, message: err.message });
        }
        try {
            const authHeader = req.header('Authorization');
            const accessToken = authHeader?.replace('Bearer ', '').trim();
            if (!accessToken) {
                return res.status(401).json({ message: 'No token provided' });
            }
            const token = await Token.findOne({ accessToken, revoked: false });
            if (!token) {
                return res.status(401).json({ message: 'Token is invalid or expired' });
            }
            const userData = jwt.verify(token.refreshToken, process.env.REFRESH_TOKEN);
            const user = await User.findById(userData.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            const newAccessToken = jwt.sign(
                { id: user._id, isAdmin: user.isAdmin },
                process.env.ACCESS_TOKEN,
                { expiresIn: '24h' }
            );
            await Token.updateOne(
                { _id: token._id },
                { $set: { accessToken: newAccessToken } }
            );
            req.headers['Authorization'] = `Bearer ${newAccessToken}`;
            res.set('Authorization', `Bearer ${newAccessToken}`);
            return next();
        } catch (error) {
            console.error('Token refresh error:', error);
            return res.status(401).json({ message: 'Token refresh failed' });
        }
    }
    console.error(err);
    return res.status(500).json({
        type: err.name,
        message: err.message || 'An unexpected error occurred'
    });
}

module.exports = errorHandler;