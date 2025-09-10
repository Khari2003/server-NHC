const { Schema, model } = require('mongoose');

const commentSchema = new Schema({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  whoComment: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  commentId: {
    type: String,
    default: '',
    trim: true
  },
  parentCommentId: {
    type: String,
    default: '',
    trim: true
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Tạo index để tối ưu tìm kiếm theo postId và createdAt
commentSchema.index({ postId: 1, createdAt: -1 });

commentSchema.set('toObject', { virtuals: true });
commentSchema.set('toJSON', { virtuals: true });

exports.Comment = model('Comment', commentSchema);