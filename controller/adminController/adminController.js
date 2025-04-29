const { User } = require('../../models/userModel');
const { Store } = require('../../models/storeModel');
const { Review } = require('../../models/reviewModel');
const { Token } = require('../../models/tokenModel');
const { Conversation } = require('../../models/conversationModel');
const { Message } = require('../../models/messageModel');
const { deleteImage } = require('../../helper/mediaHepler');

exports.getUserCount = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const userCount = await User.countDocuments();
        res.status(200).json({ userCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await Review.deleteMany({ user: user._id });
        await Message.deleteMany({ sender: user._id });
        await Conversation.updateMany(
            { participants: user._id },
            { $pull: { participants: user._id } }
        );
        await User.findByIdAndDelete(req.params.id);
        await Token.deleteOne({ userId: req.params.id });
        return res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getStores = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const stores = await Store.find().populate('reviews owner', 'name email');
        res.status(200).json(stores);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.approveStore = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const store = await Store.findById(req.params.storeId);
        if (!store) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        store.isApproved = true;
        await store.save();
        res.status(200).json(store);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.deleteStore = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const store = await Store.findById(req.params.storeId);
        if (!store) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        await deleteImage(store.images);
        await Review.deleteMany({ store: store._id });
        await store.deleteOne();
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getReviews = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }
        const reviews = await Review.find().populate('user store', 'name');
        res.status(200).json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};