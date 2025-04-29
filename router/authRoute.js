const router = require('express').Router();
const AuthController = require('../controller/authController');
const { body } = require('express-validator');

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

const validatePassword = [
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .isStrongPassword()
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one symbol')
];

router.post('/login', AuthController.login);
router.post('/verifyToken', AuthController.verifyToken);
router.post('/register', validateUser, AuthController.register);
router.post('/forgotPassword', AuthController.forgotPassword);
router.post('/verify-otp', AuthController.verifyPasswordResetOtp);
router.post('/reset-password', validatePassword, AuthController.resetPassword);
router.post('/logout', AuthController.logout);

module.exports = router;