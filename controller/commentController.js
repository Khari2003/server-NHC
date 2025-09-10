const { Comment } = require('../models/commentModel');
const { User } = require('../models/userModel');
const { validationResult } = require('express-validator');

exports.addComment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { commentText, postId } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const comment = new Comment({
            whoComment: user._id,
            commentText,
            commentId: `comment_${Date.now()}`,
            postId,
            likes: [],
            replies: []
        });
        await comment.save();
        res.status(201).json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.putLikeOnThisComment = async (req, res) => {
    try {
        const comment = await Comment.findOne({ commentId: req.params.commentId });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        if (comment.likes.includes(req.user.id)) {
            return res.status(400).json({ message: 'Comment already liked' });
        }
        comment.likes.push(req.user.id);
        await comment.save();
        res.status(200).json({ message: 'Like added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.removeLikeOnThisComment = async (req, res) => {
    try {
        const comment = await Comment.findOne({ commentId: req.params.commentId });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        comment.likes = comment.likes.filter(id => id.toString() !== req.user.id);
        await comment.save();
        res.status(200).json({ message: 'Like removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.putReplyOnThisComment = async (req, res) => {
    try {
        const comment = await Comment.findOne({ commentId: req.params.commentId });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        const reply = new Comment({
            whoComment: req.user.id,
            commentText: req.body.commentText,
            commentId: `reply_${Date.now()}`,
            postId: comment.postId,
            parentCommentId: comment.commentId,
            likes: [],
            replies: []
        });
        await reply.save();
        comment.replies.push(reply.commentId);
        await comment.save();
        res.status(201).json(reply);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getRepliesOfComments = async (req, res) => {
    try {
        const comment = await Comment.findOne({ commentId: req.params.commentId });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        const replies = await Comment.find({ commentId: { $in: comment.replies } })
            .populate('whoComment', 'name userName profileImageUrl');
        res.status(200).json(replies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getSpecificComments = async (req, res) => {
    try {
        const { commentIds } = req.body;
        const comments = await Comment.find({ commentId: { $in: commentIds } })
            .populate('whoComment', 'name userName profileImageUrl');
        if (!comments.length) {
            return res.status(404).json({ message: 'No comments found' });
        }
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getCommentInfo = async (req, res) => {
    try {
        const comment = await Comment.findOne({ commentId: req.params.commentId })
            .populate('whoComment', 'name userName profileImageUrl');
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        res.status(200).json(comment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.replyOnThisComment = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { commentText, postId } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const parentComment = await Comment.findOne({ commentId: req.params.commentId });
        if (!parentComment) {
            return res.status(404).json({ message: 'Parent comment not found' });
        }
        const reply = new Comment({
            whoComment: user._id,
            commentText,
            commentId: `reply_${Date.now()}`,
            postId,
            parentCommentId: parentComment.commentId,
            likes: [],
            replies: []
        });
        await reply.save();
        parentComment.replies.push(reply.commentId);
        await parentComment.save();
        res.status(201).json(reply);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.putLikeOnThisReply = async (req, res) => {
    try {
        const reply = await Comment.findOne({ commentId: req.params.replyId });
        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }
        if (reply.likes.includes(req.user.id)) {
            return res.status(400).json({ message: 'Reply already liked' });
        }
        reply.likes.push(req.user.id);
        await reply.save();
        res.status(200).json({ message: 'Like added to reply' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.removeLikeOnThisReply = async (req, res) => {
    try {
        const reply = await Comment.findOne({ commentId: req.params.replyId });
        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }
        reply.likes = reply.likes.filter(id => id.toString() !== req.user.id);
        await reply.save();
        res.status(200).json({ message: 'Like removed from reply' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getSpecificReplies = async (req, res) => {
    try {
        const { replyIds } = req.body;
        const replies = await Comment.find({ commentId: { $in: replyIds } })
            .populate('whoComment', 'name userName profileImageUrl');
        if (!replies.length) {
            return res.status(404).json({ message: 'No replies found' });
        }
        res.status(200).json(replies);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getReplyInfo = async (req, res) => {
    try {
        const reply = await Comment.findOne({ commentId: req.params.replyId })
            .populate('whoComment', 'name userName profileImageUrl');
        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }
        res.status(200).json(reply);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};