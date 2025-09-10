const router = require('express').Router();
const MessageController = require('../controller/messageController');

// Message Routes
router.post('/groups', MessageController.createChatForGroups);
router.post('/:conversationId', MessageController.sendMessage);
router.get('/:conversationId', MessageController.getMessages);
router.put('/:messageId/read', MessageController.markAsRead);
router.delete('/:conversationId', MessageController.deleteConversation);
router.post('/update-last', MessageController.updateLastMessage);
router.post('/specific', MessageController.getSpecificChatsInfo);
router.get('/info/:conversationId', MessageController.getChatInfo);
router.delete('/message/:messageId', MessageController.deleteMessage);

module.exports = router;