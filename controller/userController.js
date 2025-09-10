const { User } = require('../models/userModel');
const { Store } = require('../models/storeModel');
const { Review } = require('../models/reviewModel');
const { Conversation } = require('../models/conversationModel');
const { Post } = require('../models/postModel');
const { Story } = require('../models/storyModel');
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

exports.getUser = async (req, res) => {
    try {
        const users = await User.find().select('name email isAdmin preferences location favoriteStores wishList stories posts');
        if (!users.length) {
            return res.status(404).json({ message: 'No users found' });
        }
        return res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(
            '-passwordHash -resetPasswordOtp -resetPasswordOtpExpiration'
        );
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { name, email, phone, location } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, email, phone, location },
            { new: true }
        ).select('-passwordHash -resetPasswordOtp -resetPasswordOtpExpiration');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.updatePreferences = async (req, res) => {
    try {
        const { dietary, cuisine, priceRange } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { preferences: { dietary, cuisine, priceRange } },
            { new: true }
        ).select('preferences');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user.id }).populate('store', 'name');
        if (!reviews.length) {
            return res.status(404).json({ message: 'No reviews found for this user' });
        }
        res.status(200).json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.createConversation = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const recipient = await User.findById(req.body.recipientId);
        if (!user || !recipient) {
            return res.status(404).json({ message: 'User or recipient not found' });
        }
        const existingConversation = await Conversation.findOne({
            participants: { $all: [user._id, recipient._id] }
        });
        if (existingConversation) {
            return res.status(200).json(existingConversation);
        }
        const conversation = await Conversation.create({
            participants: [user._id, recipient._id]
        });
        user.conversations.push(conversation._id);
        recipient.conversations.push(conversation._id);
        await user.save();
        await recipient.save();
        res.status(201).json(conversation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getConversations = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'conversations',
            populate: { path: 'lastMessage participants', select: 'name content sentAt' }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user.conversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { name, userName, email, profileImageUrl } = req.body;
        const user = new User({
            name,
            userName,
            email,
            profileImageUrl,
            passwordHash: bcrypt.hashSync(req.body.password, 8),
            posts: [],
            stories: [],
            followers: [],
            following: [],
            chatsOfGroups: [],
            conversations: []
        });
        await user.save();
        res.status(201).json({
            id: user._id,
            name: user.name,
            userName: user.userName,
            email: user.email,
            profileImageUrl: user.profileImageUrl
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Email or username already exists' });
        }
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.updateChannelId = async (req, res) => {
    try {
        const { channelId, userIds } = req.body;
        const isUsersAvailable = [];
        for (const userId of userIds) {
            const user = await User.findById(userId);
            if (!user) {
                isUsersAvailable.push(false);
                continue;
            }
            if (!user.channelId) {
                user.channelId = channelId;
                await user.save();
                isUsersAvailable.push(true);
            } else {
                isUsersAvailable.push(false);
            }
        }
        const currentUser = await User.findByIdAndUpdate(req.user.id, { channelId }, { new: true });
        if (!currentUser) {
            return res.status(404).json({ message: 'Current user not found' });
        }
        res.status(200).json({ isUsersAvailable });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.addThisUserToMyFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const followingUser = await User.findById(req.params.followingUserId);
        if (!user || !followingUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.following.includes(followingUser._id)) {
            return res.status(400).json({ message: 'Already following' });
        }
        user.following.push(followingUser._id);
        followingUser.followers.push(user._id);
        await user.save();
        await followingUser.save();
        res.status(200).json({ message: 'Followed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.unFollowThisUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const followingUser = await User.findById(req.params.followingUserId);
        if (!user || !followingUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.following = user.following.filter(id => id.toString() !== followingUser._id.toString());
        followingUser.followers = followingUser.followers.filter(id => id.toString() !== user._id.toString());
        await user.save();
        await followingUser.save();
        res.status(200).json({ message: 'Unfollowed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.arrayRemoveOfField = async (req, res) => {
    try {
        const { fieldName, removeThisId } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (['posts', 'stories', 'followers', 'following', 'chatsOfGroups', 'conversations'].includes(fieldName)) {
            user[fieldName] = user[fieldName].filter(id => id !== removeThisId);
            await user.save();
            res.status(200).json({ message: `${fieldName} updated` });
        } else {
            return res.status(400).json({ message: 'Invalid field name' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getSpecificUsersPosts = async (req, res) => {
    try {
        const { userIds } = req.body;
        const uniqueUserIds = [...new Set(userIds)];
        const users = await User.find({ _id: { $in: uniqueUserIds } }).select('posts');
        const postIds = users.flatMap(user => user.posts);

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

exports.searchAboutUser = async (req, res) => {
    try {
        let { name, searchForSingleLetter } = req.query;
        name = name.toLowerCase();
        let users;
        if (searchForSingleLetter === 'true') {
            users = await User.find({ userName: name })
                .select('name userName profileImageUrl');
        } else {
            users = await User.find({ charactersOfName: name })
                .select('name userName profileImageUrl');
        }
        if (!users.length) {
            return res.status(404).json({ message: 'No users found' });
        }
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};