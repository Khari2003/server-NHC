const router = require('express').Router();
const userController = require('../controller/userController');
const favoriteController = require('../controller/favoriteController');
const wishlistController = require('../controller/wishlistController');

router.get('/', userController.getUser);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.put('/:id/preferences', userController.updatePreferences);
router.get('/:id/reviews', userController.getUserReviews);
router.post('/:id/conversations', userController.createConversation);
router.get('/:id/conversations', userController.getConversations);
router.get('/:id/favorites', favoriteController.getUserFavorites);
router.post('/:id/favorites', favoriteController.addToFavorites);
router.delete('/:id/favorites', favoriteController.removeFromFavorites);
router.get('/:id/wishlist', wishlistController.getUserWishList);
router.post('/:id/wishlist', wishlistController.addToWishList);
router.delete('/:id/wishlist', wishlistController.removeFromWishList);

module.exports = router;