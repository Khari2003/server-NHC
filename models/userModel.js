const { Schema, model } = require('mongoose');

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        trim: true
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    preferences: {
        dietary: [{ type: String, enum: ['vegan', 'vegetarian', 'gluten-free', 'halal', 'kosher', 'other'] }],
        cuisine: [{ type: String }],
        priceRange: { type: String, enum: ['$', '$$', '$$$', '$$$$'] }
    },
    location: {
        street: String,
        city: String,
        postalCode: String,
        country: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },
    favoriteStores: [{
        type: Schema.Types.ObjectId,
        ref: 'Store'
    }],
    wishList: [{
        type: Schema.Types.ObjectId,
        ref: 'Store'
    }],
    conversations: [{
        type: Schema.Types.ObjectId,
        ref: 'Conversation'
    }],
    resetPasswordOtp: {
        type: String
    },
    resetPasswordOtpExpiration: {
        type: Date
    }
});

userSchema.index({ 'location.coordinates': '2dsphere' });

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

exports.User = model('User', userSchema);