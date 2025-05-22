// cuisine: [{
    //     type: String,
    //     default: []
    // }],
        // dietaryOptions: [{
    //     type: String,
    //     enum: ['vegan', 'vegetarian', 'gluten-free', 'halal', 'kosher', 'other'],
    //     default: []
    // }],
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
        address: String,
        city: String,
        postalCode: {
            type: String,
            default: null
        },
        country: String,
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true
            }
        }
    },
    priceRange: {
        type: String,
        enum: ['Free', 'Low', 'Moderate', 'High', 'Luxury'],
        default: 'Moderate'
    },
    type: {
        type: String,
        enum: [
            'Historical Site',
            'Museum',
            'Natural Landmark',
            'Entertainment Center',
            'Park',
            'Cultural Site',
            'Religious Site',
            'Zoo',
            'Aquarium',
            'Restaurant',
            'Scenic Spot',
            'Cinema',
            'Other'
        ],
        required: true
    },
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