const { Schema, model } = require('mongoose');

const postSchema = new Schema({
  publisher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caption: {
    type: String,
    default: '',
    trim: true
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  blurHash: {
    type: String,
    required: true,
    trim: true
  },
  isImage: {
    type: Boolean,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Tạo index để tối ưu tìm kiếm theo publisher và createdAt
postSchema.index({ publisher: 1, createdAt: -1 });

postSchema.set('toObject', { virtuals: true });
postSchema.set('toJSON', { virtuals: true });

exports.Post = model('Post', postSchema);