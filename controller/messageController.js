const { User } = require('../models/userModel');
const { Conversation } = require('../models/conversationModel');
const { Message } = require('../models/messageModel');

exports.createChatForGroups = async (req, res) => {
    try {
        const { participants, content } = req.body;
        const user = await User.findById(req.user.id);
        if (!user || !participants.every(id => id !== req.user.id)) {
            return res.status(404).json({ message: 'Invalid participants' });
        }
        const conversation = await Conversation.create({
            participants: [user._id, ...participants],
            isGroupChat: true
        });
        const message = await new Message({
            conversationId: conversation._id,
            sender: user._id,
            content,
            messageId: `message_${Date.now()}`
        }).save();
        conversation.lastMessage = message._id;
        conversation.updatedAt = Date.now();
        await conversation.save();
        await User.updateMany(
            { _id: { $in: [user._id, ...participants] } },
            { $push: { chatsOfGroups: conversation._id } }
        );
        res.status(201).json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

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
            content: req.body.content,
            messageId: `message_${Date.now()}`
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

        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        const messages = await Message.find({ conversationId: conversation._id })
            .populate('sender', 'name')
            .sort({ sentAt: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const totalMessages = await Message.countDocuments({ conversationId: conversation._id });
        res.status(200).json({
            messages,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalMessages / limit),
                totalItems: totalMessages,
                itemsPerPage: parseInt(limit)
            }
        });
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
        await User.updateMany(
            { chatsOfGroups: conversation._id },
            { $pull: { chatsOfGroups: conversation._id } }
        );
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.updateLastMessage = async (req, res) => {
    try {
        const { conversationId, content } = req.body;
        const user = await User.findById(req.user.id);
        const conversation = await Conversation.findById(conversationId);
        if (!user || !conversation) {
            return res.status(404).json({ message: 'User or conversation not found' });
        }
        if (!conversation.participants.includes(user._id)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        const message = await new Message({
            conversationId: conversation._id,
            sender: user._id,
            content,
            messageId: `message_${Date.now()}`
        }).save();
        conversation.lastMessage = message._id;
        conversation.updatedAt = Date.now();
        await conversation.save();
        res.status(200).json(message);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getSpecificChatsInfo = async (req, res) => {
    try {
        const { chatIds } = req.body;
        const conversations = await Conversation.find({ _id: { $in: chatIds } })
            .populate('lastMessage participants', 'name content sentAt');
        if (!conversations.length) {
            return res.status(404).json({ message: 'No chats found' });
        }
        res.status(200).json(conversations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.getChatInfo = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.conversationId)
            .populate('lastMessage participants', 'name content sentAt');
        if (!conversation) {
            return res.status(404).json({ message: 'Chat not found' });
        }
        if (!conversation.participants.includes(req.user.id)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        res.status(200).json(conversation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const message = await Message.findOne({ messageId: req.params.messageId });
        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }
        const conversation = await Conversation.findById(message.conversationId);
        if (!conversation.participants.includes(req.user.id)) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        await Message.findOneAndDelete({ messageId: req.params.messageId });
        if (conversation.lastMessage.toString() === message._id.toString()) {
            const lastMessage = await Message.findOne({ conversationId: conversation._id })
                .sort({ sentAt: -1 });
            conversation.lastMessage = lastMessage ? lastMessage._id : null;
            conversation.updatedAt = Date.now();
            await conversation.save();
        }
        res.status(204).end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};