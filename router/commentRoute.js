const router = require('express').Router();
const CommentController = require('../controller/commentController');
const { User } = require('../models/userModel');

// Comment Routes
router.post('/', CommentController.addComment);
router.put('/:commentId/like', CommentController.putLikeOnThisComment);
router.delete('/:commentId/like', CommentController.removeLikeOnThisComment);
router.post('/:commentId/reply', CommentController.replyOnThisComment);
router.get('/:commentId/replies', CommentController.getRepliesOfComments);
router.post('/specific', CommentController.getSpecificComments);
router.get('/:commentId', CommentController.getCommentInfo);
router.put('/replies/:replyId/like', CommentController.putLikeOnThisReply);
router.delete('/replies/:replyId/like', CommentController.removeLikeOnThisReply);
router.post('/replies/specific', CommentController.getSpecificReplies);
router.get('/replies/:replyId', CommentController.getReplyInfo);

module.exports = router;