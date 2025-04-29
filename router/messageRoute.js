const router = require('express').Router();
const messageController = require('../controller/messageController');

router.post('/:conversationId', messageController.sendMessage);
router.get('/:conversationId', messageController.getMessages);
router.put('/:messageId/read', messageController.markAsRead);
router.delete('/:conversationId', messageController.deleteConversation);

module.exports = router;