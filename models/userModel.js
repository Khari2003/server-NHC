const { Schema, model } = require('mongoose');

const followedSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    followedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const bioSchema = new Schema({
    intro: { 
        type: String 
    },
    website: { 
        type: String 
    }
}, { _id: false });

// const storySchema = new Schema({
//     storyId: {
//         type: String,
//         required: true
//     },
//     mediaUrl: {
//         type: String,
//         required: true
//     },
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// }, { _id: false });

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
    gender: { 
        type: String, 
        enum: ['male', 'female', 'other'], 
        required: true 
    },
    phone: {
        type: String,
        trim: true
    },
    profilephoto: { 
        type: String 
    },
    followedby: [followedSchema],
    follows: [followedSchema],
    storydate: { 
        type: Date 
    },    
    isAdmin: {
        type: Boolean,
        default: false
    },
    preferences: {
        dietary: [{ 
            type: String, 
            enum: ['vegan', 'vegetarian', 'gluten-free', 'halal', 'kosher', 'other'] 
        }],
        cuisine: [{ type: String }],
        priceRange: { 
            type: String, 
            enum: ['Low', 'Moderate', 'High'] 
        }
    },
    location: {
        address: String,
        city: String,
        postalCode: String,
        country: String,
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: false
            }
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
    },
    bio: bioSchema,
    // deviceToken: {
    //     type: String,
    //     default: ''
    // },
    // numberOfNewNotifications: {
    //     type: Number,
    //     default: 0
    // },
    // numberOfNewMessages: {
    //     type: Number,
    //     default: 0
    // },
    // channelId: {
    //     type: String,
    //     default: ''
    // },
    // lastThreePostUrls: [{
    //     type: String
    // }],
    // charactersOfName: [{
    //     type: String
    // }],
    // posts: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'Post'
    // }],
    // chatsOfGroups: [{
    //     type: Schema.Types.ObjectId,
    //     ref: 'Conversation'
    // }],
    // storiesInfo: [storySchema]
});

userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ email: 1 });

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

exports.User = model('User', userSchema);