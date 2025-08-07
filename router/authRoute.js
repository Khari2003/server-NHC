const router = require('express').Router();
const AuthController = require('../controller/authController');
const { body } = require('express-validator');

// Quy tắc kiểm tra dữ liệu cho đăng ký
const validateUser = [
    body('name')
        .notEmpty()
        .withMessage("Name is required"),
    body("email")
        .isEmail()
        .withMessage('Please enter a valid email address'),
    body("password")
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .isStrongPassword()
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one symbol'),
    body('phone')
        .isMobilePhone()
        .withMessage('Please enter a valid phone number')
];

// Quy tắc kiểm tra mật khẩu mới
const validatePassword = [
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .isStrongPassword()
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one symbol')
];

// Định nghĩa các route cho xác thực
router.post('/login', AuthController.login); // Đăng nhập
router.post('/verifyToken', AuthController.verifyToken); // Xác minh token
router.post('/refresh-token', AuthController.refreshToken); // Làm mới token
router.post('/register', validateUser, AuthController.register); // Đăng ký
router.post('/forgotPassword', AuthController.forgotPassword); // Yêu cầu đặt lại mật khẩu
router.post('/verify-otp', AuthController.verifyPasswordResetOtp); // Xác minh OTP
router.post('/reset-password', validatePassword, AuthController.resetPassword); // Đặt lại mật khẩu
router.post('/logout', AuthController.logout); // Đăng xuất

module.exports = router;