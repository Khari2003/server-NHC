const { Schema, model } = require('mongoose');

const reviewSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    store: {
        type: Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    comment: {
        type: String,
        trim: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    images: [{
        type: String
    }],
    reply: {
        type: String,
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

exports.Review = model('Review', reviewSchema);