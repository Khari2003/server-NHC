const { Post } = require('../models/postModel');
const { User } = require('../models/userModel');
const { Comment } = require('../models/commentModel');
const { validationResult } = require('express-validator');

exports.createPost = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { caption, blurHash, isImage, postUrl, imagesUrls, aspectRatio, coverOfVideoUrl, isMix } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const post = new Post({
            publisher: user._id,
            caption,
            blurHash,
            isImage,
            postId: `post_${Date.now()}`,
            postUrl,
            imagesUrls,
            aspectRatio,
            coverOfVideoUrl,
            isMix,
            likes: [],
            comments: []
        });
        await post.save();
        user.posts.push(post.postId);
        await user.save();
        res.status(201).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findOne({ postId: req.params.postId });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.publisher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await User.updateMany(
            { posts: post.postId },
            { $pull: { posts: post.postId } }
        );
        await Post.findOneAndDelete({ postId: req.params.postId });
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.updatePost = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const post = await Post.findOne({ postId: req.params.postId });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.publisher.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        post.caption = req.body.caption;
        await post.save();
        res.status(200).json(post);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getPostsInfo = async (req, res) => {
    try {
        const { postIds } = req.body;
        const posts = await Post.find({ postId: { $in: postIds } })
            .populate('publisher', 'name userName profileImageUrl')
            .sort({ createdAt: -1 });
        if (!posts.length) {
            return res.status(404).json({ message: 'No posts found' });
        }
        res.status(200).json(posts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getCommentsOfPost = async (req, res) => {
    try {
        const post = await Post.findOne({ postId: req.params.postId });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const comments = await Comment.find({ commentId: { $in: post.comments } })
            .populate('whoComment', 'name userName profileImageUrl');
        res.status(200).json(comments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getAllPostsInfo = async (req, res) => {
    try {
        const { isVideosWantedOnly, skippedVideoUid, page = 1, limit = 10 } = req.query;
        let query = {};
        if (isVideosWantedOnly === 'true') {
            query.isImage = false;
        }
        if (skippedVideoUid) {
            query.postId = { $ne: skippedVideoUid };
        }

        // Thêm phân trang
        const skip = (page - 1) * limit;
        const posts = await Post.find(query)
            .populate('publisher', 'name userName profileImageUrl')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalPosts = await Post.countDocuments(query); // Tổng số bài đăng
        if (!posts.length) {
            return res.status(404).json({ message: 'No posts found' });
        }

        res.status(200).json({
            posts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalPosts / limit),
                totalItems: totalPosts,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.putLikeOnThisPost = async (req, res) => {
    try {
        const post = await Post.findOne({ postId: req.params.postId });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        if (post.likes.includes(req.user.id)) {
            return res.status(400).json({ message: 'Post already liked' });
        }
        post.likes.push(req.user.id);
        await post.save();
        res.status(200).json({ message: 'Like added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.removeLikeOnThisPost = async (req, res) => {
    try {
        const post = await Post.findOne({ postId: req.params.postId });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        post.likes = post.likes.filter(id => id.toString() !== req.user.id);
        await post.save();
        res.status(200).json({ message: 'Like removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.putCommentOnThisPost = async (req, res) => {
    try {
        const post = await Post.findOne({ postId: req.params.postId });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        const comment = await Comment.findOne({ commentId: req.body.commentId });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        if (post.comments.includes(comment.commentId)) {
            return res.status(400).json({ message: 'Comment already added' });
        }
        post.comments.push(comment.commentId);
        await post.save();
        res.status(200).json({ message: 'Comment added' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.removeCommentOnThisPost = async (req, res) => {
    try {
        const post = await Post.findOne({ postId: req.params.postId });
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        post.comments = post.comments.filter(id => id !== req.params.commentId);
        await post.save();
        res.status(200).json({ message: 'Comment removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};