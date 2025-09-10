const { validationResult } = require('express-validator');
const { User } = require('../models/userModel');
const { Token } = require('../models/tokenModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailSender = require('../helper/emailSender');

// Đăng ký người dùng mới
exports.register = async function (req, res) {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        const errorMessage = err.array().map(err => ({
            field: err.path,
            message: err.msg
        }));
        return res.status(400).json({ errors: errorMessage });
    }
    try {
        const user = new User({
            ...req.body,
            passwordHash: bcrypt.hashSync(req.body.password, 8) // Mã hóa mật khẩu
        });
        await user.save();
        return res.status(201).json({
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            preferences: user.preferences,
            location: user.location
        });
    } catch (e) {
        if (e.code === 11000) {
            return res.status(409).json({
                type: 'error',
                message: 'Email already exists'
            });
        }
        console.error(e);
        return res.status(500).json({ type: e.name, message: e.message });
    }
};

// Đăng nhập người dùng
exports.login = async function (req, res) {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!bcrypt.compareSync(password, user.passwordHash)) {
            return res.status(401).json({ message: 'Incorrect password' });
        }
        // Tạo accessToken và refreshToken
        const accessToken = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.ACCESS_TOKEN, { expiresIn: '24h' });
        const refreshToken = jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.REFRESH_TOKEN, { expiresIn: '7d' });
        await Token.findOneAndDelete({ userId: user._id }); // Xóa token cũ
        await new Token({
            userId: user._id,
            accessToken,
            refreshToken
        }).save();
        return res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

// Xác minh accessToken
exports.verifyToken = async function (req, res) {
    try {
        const accessToken = req.body.accessToken?.replace('Bearer', '').trim();
        if (!accessToken) {
            return res.status(401).json({ valid: false, message: 'No token provided' });
        }
        const tokenData = jwt.verify(accessToken, process.env.ACCESS_TOKEN);
        const user = await User.findById(tokenData.id).select('name email isAdmin');
        if (!user) {
            return res.status(404).json({ valid: false, message: 'User not found' });
        }
        return res.json({ valid: true, user });
    } catch (error) {
        console.error(error);
        res.status(401).json({ valid: false, message: 'Invalid token' });
    }
};

// Làm mới accessToken bằng refreshToken
exports.refreshToken = async function (req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }
        const tokenRecord = await Token.findOne({ refreshToken });
        if (!tokenRecord) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);
        const user = await User.findById(decoded.id).select('name email isAdmin');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Tạo accessToken và refreshToken mới
        const newAccessToken = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            process.env.ACCESS_TOKEN,
            { expiresIn: '24h' }
        );
        const newRefreshToken = jwt.sign(
            { id: user._id, isAdmin: user.isAdmin },
            process.env.REFRESH_TOKEN,
            { expiresIn: '7d' }
        );
        // Cập nhật token trong database
        tokenRecord.accessToken = newAccessToken;
        tokenRecord.refreshToken = newRefreshToken;
        await tokenRecord.save();
        return res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
};

// Đăng xuất người dùng
exports.logout = async function (req, res) {
    try {
        const accessToken = req.header('Authorization')?.replace('Bearer', '').trim();
        if (!accessToken) {
            return res.status(400).json({ message: 'No token provided' });
        }
        await Token.deleteOne({ accessToken }); // Xóa token khỏi database
        return res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

// Yêu cầu đặt lại mật khẩu
exports.forgotPassword = async function (req, res) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordOtp = bcrypt.hashSync(otp, 8); // Mã hóa OTP
        user.resetPasswordOtpExpiration = Date.now() + 300000; // Hết hạn sau 5 phút
        await user.save();
        const response = await emailSender.sendMail(
            email,
            'Reset Password OTP',
            `Your OTP for resetting your password is ${otp}.\n\nThis OTP will expire in 5 minutes.`
        );
        if (response.statusCode === 500) {
            return res.status(500).json({ message: 'Error sending email' });
        }
        return res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

// Xác minh OTP để đặt lại mật khẩu
exports.verifyPasswordResetOtp = async function (req, res) {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!bcrypt.compareSync(otp, user.resetPasswordOtp) || Date.now() > user.resetPasswordOtpExpiration) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }
        user.resetPasswordOtp = '1'; // Đánh dấu OTP đã xác minh
        user.resetPasswordOtpExpiration = undefined;
        await user.save();
        return res.json({ message: 'OTP confirmed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

// Đặt lại mật khẩu
exports.resetPassword = async function (req, res) {
    const err = validationResult(req);
    if (!err.isEmpty()) {
        const errorMessage = err.array().map(err => ({
            field: err.path,
            message: err.msg
        }));
        return res.status(400).json({ errors: errorMessage });
    }
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.resetPasswordOtp !== "1") {
            return res.status(401).json({ message: 'OTP not confirmed' });
        }
        user.passwordHash = bcrypt.hashSync(newPassword, 8);
        user.resetPasswordOtp = undefined;
        await user.save();
        return res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};