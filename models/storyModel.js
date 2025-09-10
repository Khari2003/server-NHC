const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    publisher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Index để tối ưu truy vấn theo publisher
    },
    caption: {
        type: String,
        trim: true
    },
    blurHash: {
        type: String,
        trim: true
    },
    isImage: {
        type: Boolean,
        default: true
    },
    storyId: {
        type: String,
        required: true,
        unique: true,
        index: true // Index để tối ưu tìm kiếm theo storyId
    },
    storyUrl: {
        type: String,
        required: true,
        trim: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        type: String // Lưu commentId
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: '24h' } // Tự động xóa story sau 24 giờ
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Story', storySchema);