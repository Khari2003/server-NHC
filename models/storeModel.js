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
    menu: [
        {
            name: {
                type: String,
                required: true
            },
            price: {
                type: Number,
                required: true,
                min: 0
            }
        }
    ],
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
        enum: ['Low', 'Moderate', 'High'],
        default: 'Moderate'
    },
    type: {
        type: String,
        enum: [
            'chay-phat-giao',        // Nhà hàng chay Phật giáo (thuần chay)
            'chay-a-au',             // Nhà hàng chay Âu - Á
            'chay-hien-dai',         // Nhà hàng thuần chay hiện đại (vegan bistro/cafe)
            'com-chay-binh-dan',     // Quán cơm chay bình dân
            'buffet-chay',           // Nhà hàng buffet chay
            'chay-ton-giao-khac'     // Nhà hàng chay theo tôn giáo khác (Ấn Độ, Jain, v.v.)
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