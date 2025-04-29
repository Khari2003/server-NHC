const { User } = require('../models/userModel');
const { Conversation } = require('../models/conversationModel');
const { Message } = require('../models/messageModel');

exports.sendMessage = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const conversation = await Conversation.findById(req.params.conversationId);
        if (!user || !conversation) {
            return res.status(404).json({ message: 'User or conversation not found' });
        }
        if (!conversation.participants.includes(user._id)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const message = await new Message({
            conversationId: conversation._id,
            sender: user._id,
            content: req.body.content
        }).save();
        conversation.lastMessage = message._id;
        conversation.updatedAt = Date.now();
        await conversation.save();
        res.status(201).json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const conversation = await Conversation.findById(req.params.conversationId);
        if (!user || !conversation) {
            return res.status(404).json({ message: 'User or conversation not found' });
        }
        if (!conversation.participants.includes(user._id)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const messages = await Message.find({ conversationId: conversation._id })
            .populate('sender', 'name')
            .sort({ sentAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const message = await Message.findById(req.params.messageId);
        if (!user || !message) {
            return res.status(404).json({ message: 'User or message not found' });
        }
        const conversation = await Conversation.findById(message.conversationId);
        if (!conversation.participants.includes(user._id)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        message.read = true;
        await message.save();
        res.status(200).json({ message: 'Message marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.deleteConversation = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const conversation = await Conversation.findById(req.params.conversationId);
        if (!user || !conversation) {
            return res.status(404).json({ message: 'User or conversation not found' });
        }
        if (!conversation.participants.includes(user._id)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await Message.deleteMany({ conversationId: conversation._id });
        await Conversation.findByIdAndDelete(conversation._id);
        await User.updateMany(
            { conversations: conversation._id },
            { $pull: { conversations: conversation._id } }
        );
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};