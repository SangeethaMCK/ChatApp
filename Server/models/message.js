const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    messageId: { type: String, unique: true },
    message: String,
    room: String,
    user: String,
    recipient: String,
  });

  module.exports = mongoose.model('Message', MessageSchema);