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
    // cuisine: [{
    //     type: String,
    //     default: []
    // }],
    priceRange: {
        type: String,
        enum: ['Miễn phí','Thấp', 'Tầm trung', 'Cao cấp', 'Sang trọng'],
        default: 'Tầm trung'
    },
    // dietaryOptions: [{
    //     type: String,
    //     enum: ['vegan', 'vegetarian', 'gluten-free', 'halal', 'kosher', 'other'],
    //     default: []
    // }],
    type: {
        type: String,
        enum: [
            'Di tích lịch sử',
            'Bảo tàng',
            'Di tích tự nhiên',
            'Trung tâm giải trí',
            'công viên',
            'Di tích văn hóa',
            'Di tích tôn giáo',
            'Sở thú',
            'Thủy cung',
            'Nhà hàng',
            'Địa điểm ngắm cảnh',
            'Rạp chiếu phim',
            'Khác'
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