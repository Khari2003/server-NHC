const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  content: { type: String, required: true },
}, { timestamps: true });

// Tạo text index để tìm kiếm
DocumentSchema.index({ content: "text" });

// Export model
module.exports = mongoose.model("Document", DocumentSchema);