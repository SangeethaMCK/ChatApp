const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: { type: String, unique: true },
    username: { type: String, required: true, unique: true },
    password: String,
    email: String,
    connection: Boolean,
  });

  module.exports = mongoose.model('User', UserSchema);