const router = require('express').Router();
const userController = require('../controller/userController');
const { User } = require('../models/userModel')
const { Conversation } = require('../models/conversationModel');
// const favoriteController = require('../controller/favoriteController');
// const wishlistController = require('../controller/wishlistController');


// User Routes
router.get('/', userController.getUser);
router.get('/:id', userController.getUserById);
router.put('/', userController.updateUser);
router.put('/preferences', userController.updatePreferences);
router.get('/reviews', userController.getUserReviews);
router.post('/conversation', userController.createConversation);
router.get('/conversations', userController.getConversations);
router.post('/create', userController.createUser);
router.put('/channel', userController.updateChannelId);
router.put('/follow/:followingUserId', userController.addThisUserToMyFollowing);
router.delete('/follow/:followingUserId', userController.unFollowThisUser);
router.put('/array-remove', userController.arrayRemoveOfField);
router.get('/search', userController.searchAboutUser);

module.exports = router;