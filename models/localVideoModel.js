const { Schema, model } = require('mongoose');

const localVideoSchema = new Schema({
    filename: {
        type: String,
        required: true,
        trim: true // Tên file, ví dụ: video1.mp4
    },
    path: {
        type: String,
        required: true // Đường dẫn trong container, ví dụ: /uploads/videos/video1.mp4
    },
    title: {
        type: String,
        trim: true,
        default: null // Optional
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

exports.LocalVideo = model('LocalVideo', localVideoSchema);