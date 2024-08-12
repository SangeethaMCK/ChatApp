const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    sessionId: { type: String, unique: true },
    userId: { type: String, unique: true },
    expires: { type: Date, default: Date.now },
  });

  module.exports = mongoose.model('Session', SessionSchema);