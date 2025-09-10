const router = require('express').Router();
const ChatController = require('../controller/chatController');

router.post('/', ChatController.chat); // Chat

module.exports = router;