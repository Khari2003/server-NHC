const { Schema, model } = require('mongoose');

const storeSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
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
    cuisine: [{
        type: String,
        default: []
    }],
    priceRange: {
        type: String,
        enum: ['$', '$$', '$$$', '$$$$'],
        default: '$'
    },
    dietaryOptions: [{
        type: String,
        enum: ['vegan', 'vegetarian', 'gluten-free', 'halal', 'kosher', 'other'],
        default: []
    }],
    images: [{
        type: String
    }],
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [{
        type: Schema.Types.ObjectId,
        ref: 'Review'
    }],
    isApproved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

storeSchema.index({ 'location.coordinates': '2dsphere' });

storeSchema.set('toObject', { virtuals: true });
storeSchema.set('toJSON', { virtuals: true });

exports.Store = model('Store', storeSchema);