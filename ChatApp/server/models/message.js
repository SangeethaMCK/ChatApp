import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    messageId: { type: String, unique: true },
    message: String,
    room: String,
    user: String,
    recipient: String,
  });

  export default mongoose.model('Message', MessageSchema);