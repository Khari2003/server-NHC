const { Schema, model } = require('mongoose');

const tokenSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    revoked: {
        type: Boolean,
        default: false
    }
});

exports.Token = model('Token', tokenSchema);