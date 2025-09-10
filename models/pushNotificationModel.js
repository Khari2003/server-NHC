const { Schema, model } = require('mongoose');

const pushNotificationSchema = new Schema({
  body: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  deviceToken: {
    type: String,
    required: true,
    trim: true
  },
  routeParameterId: {
    type: String,
    required: true,
    trim: true
  },
  notificationRoute: {
    type: String,
    required: true,
    trim: true
  },
  userCallingId: {
    type: String,
    default: '',
    trim: true
  },
  isGroupChat: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Tạo index để tối ưu tìm kiếm theo deviceToken
pushNotificationSchema.index({ deviceToken: 1 });

pushNotificationSchema.set('toObject', { virtuals: true });
pushNotificationSchema.set('toJSON', { virtuals: true });

exports.PushNotification = model('PushNotification', pushNotificationSchema);