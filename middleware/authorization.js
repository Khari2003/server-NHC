const jwt = require('jsonwebtoken');

async function authorizeRequests(req, res, next) {
    if (req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') return next();
    if (req.originalUrl.startsWith('/api/admin')) return next();

    const publicEndpoints = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/forgotPassword',
        '/api/auth/verify-otp',
        '/api/auth/reset-password'
    ];

    if (publicEndpoints.some(endpoint => req.originalUrl.includes(endpoint))) return next();

    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ message: 'Thiếu tiêu đề Authorization' });

    const accessToken = authHeader.replace('Bearer ', '').trim();
    let tokenData;
    try {
        tokenData = jwt.verify(accessToken, process.env.ACCESS_TOKEN);
    } catch (error) {
        return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    const userIdFromPath = req.params.id || req.params.userId;
    const isUserSpecificRoute = userIdFromPath && /^[a-zA-Z0-9]{24}$/.test(userIdFromPath) && 
        !req.originalUrl.includes('/api/stores'); // Bỏ qua route cửa hàng
    const isMessageRoute = req.originalUrl.includes('/api/messages');
    const isReviewRoute = req.originalUrl.includes('/reviews');

    if (isUserSpecificRoute && tokenData.id !== userIdFromPath) {
        return res.status(403).json({ message: 'Truy cập dữ liệu người dùng không được phép' });
    }
    if (isMessageRoute && req.body.senderId && tokenData.id !== req.body.senderId) {
        return res.status(403).json({ message: 'Người gửi không được phép' });
    }
    if (isReviewRoute && req.body.user && tokenData.id !== req.body.user) {
        return res.status(403).json({ message: 'Người đánh giá không được phép' });
    }

    req.user = { id: tokenData.id, isAdmin: tokenData.isAdmin };
    return next();
}

module.exports = authorizeRequests;