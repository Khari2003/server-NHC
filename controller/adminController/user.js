const { User } = require('../model/userModel');
const { Token } = require('../model/tokenModel');
const { Review } = require('../model/reviewModel');
const { Message } = require('../model/messageModel');
const { Conversation } = require('../model/conversationModel');

exports.getUserCount = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        res.status(200).json({ userCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ type: error.name, message: error.message });
    }
};

exports.deleteUser = async function (req, res) {
    try {
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