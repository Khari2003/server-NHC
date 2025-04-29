const { expressjwt } = require('express-jwt');
const { Token } = require('../models/tokenModel');

function authJwt() {
    if (!process.env.ACCESS_TOKEN) {
        throw new Error('ACCESS_TOKEN không được định nghĩa trong tệp .env');
    }
    return expressjwt({
        secret: process.env.ACCESS_TOKEN,
        algorithms: ['HS256'],
        isRevoked: isRevoked
    }).unless({
        path: [
            { url: /\/api\/auth\/(login|register|forgotPassword|verify-otp|reset-password)\/?$/i, methods: ['POST'] },
            { url: /\/api\/users\/?$/, methods: ['GET'] },
            { url: /\/api\/users\/[a-zA-Z0-9]+\/?$/, methods: ['GET'] },
            { url: /\/api\/stores\/?$/, methods: ['GET'] },
            { url: /\/api\/stores\/search\/?$/, methods: ['GET'] },
            { url: /\/api\/stores\/[a-zA-Z0-9]+\/?$/, methods: ['GET'] },
            { url: /\/api\/stores\/[a-zA-Z0-9]+\/reviews\/?$/, methods: ['GET'] },
            { url: /\/public\/Uploads(\/.*)?$/, methods: ['GET'] }
        ]
    });
}

async function isRevoked(req, token) {
    const authHeader = req.header('Authorization');
    if (!authHeader) return true;

    const accessToken = authHeader.replace('Bearer ', '').trim();
    const tokenDoc = await Token.findOne({ accessToken, revoked: false });

    const isAdminRoute = /^\/api\/admin(\/.*)?$/i.test(req.originalUrl);
    const isUnauthorizedAdminAccess = isAdminRoute && !token.payload.isAdmin;

    return isUnauthorizedAdminAccess || !tokenDoc;
}

module.exports = { authJwt };