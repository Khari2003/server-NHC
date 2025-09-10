const { Schema, model } = require('mongoose');

const notificationSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: String,
    default: '',
    trim: true
  },
  notificationId: {
    type: String,
    default: '',
    trim: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  senderName: {
    type: String,
    required: true,
    trim: true
  },
  personalUserName: {
    type: String,
    required: true,
    trim: true
  },
  postImageUrl: {
    type: String,
    default: '',
    trim: true
  },
  personalProfileImageUrl: {
    type: String,
    required: true,
    trim: true
  },
  isPost: {
    type: Boolean,
    default: true
  },
  isLike: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Tạo index để tối ưu tìm kiếm theo receiver và createdAt
notificationSchema.index({ receiver: 1, createdAt: -1 });
// Index cho notificationId để tìm kiếm nhanh
notificationSchema.index({ notificationId: 1 });

notificationSchema.set('toObject', { virtuals: true });
notificationSchema.set('toJSON', { virtuals: true });

exports.Notification = model('Notification', notificationSchema);