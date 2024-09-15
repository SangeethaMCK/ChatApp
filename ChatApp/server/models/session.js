import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
    sessionId: { type: String, unique: true },
    userId: { type: String, unique: true },
    expires: { type: Date, default: Date.now },
  });

 export default mongoose.model('Session', SessionSchema);