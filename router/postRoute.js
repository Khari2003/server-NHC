const router = require('express').Router();
const PostController = require('../controller/postController');

// Post Routes
router.post('/', PostController.createPost);
router.delete('/:postId', PostController.deletePost);
router.put('/:postId', PostController.updatePost);
router.post('/specific', PostController.getPostsInfo);
router.get('/:postId/comments', PostController.getCommentsOfPost);
router.get('/', PostController.getAllPostsInfo);
router.put('/:postId/like', PostController.putLikeOnThisPost);
router.delete('/:postId/like', PostController.removeLikeOnThisPost);
router.put('/:postId/comment', PostController.putCommentOnThisPost);
router.delete('/:postId/comment/:commentId', PostController.removeCommentOnThisPost);

module.exports = router;