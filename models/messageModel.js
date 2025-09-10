const { Schema, model } = require('mongoose');

const messageSchema = new Schema({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true,
    default: ''
  },
  receivers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  messageId: {
    type: String,
    default: '',
    trim: true
  },
  blurHash: {
    type: String,
    default: '',
    trim: true
  },
  imageUrl: {
    type: String,
    default: '',
    trim: true
  },
  recordedUrl: {
    type: String,
    default: '',
    trim: true
  },
  isImage: {
    type: Boolean,
    default: false
  },
  isPost: {
    type: Boolean,
    default: false
  },
  isRecord: {
    type: Boolean,
    default: false
  },
  isMultiImages: {
    type: Boolean,
    default: false
  },
  isVideo: {
    type: Boolean,
    default: false
  },
  isGroup: {
    type: Boolean,
    default: false
  },
  chatGroupId: {
    type: String,
    default: '',
    trim: true
  },
  sharedPostId: {
    type: String,
    default: '',
    trim: true
  },
  ownerOfSharedPostId: {
    type: String,
    default: '',
    trim: true
  },
  lengthOfRecord: {
    type: Number,
    default: 0
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
});

// Tạo index để tối ưu tìm kiếm theo conversationId và sentAt
messageSchema.index({ conversationId: 1, sentAt: -1 });

messageSchema.set('toObject', { virtuals: true });
messageSchema.set('toJSON', { virtuals: true });

exports.Message = model('Message', messageSchema);