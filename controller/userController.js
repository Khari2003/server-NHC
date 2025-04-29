const { User } = require('../models/userModel');
const { Store } = require('../models/storeModel');
const { Review } = require('../models/reviewModel');
const { Conversation } = require('../models/conversationModel');

exports.getUser = async (req, res) => {
    try {
        const users = await User.find().select('name email isAdmin preferences location favoriteStores wishList');
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
        return res.status(200).json(user);
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