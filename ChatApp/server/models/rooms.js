import mongoose from 'mongoose';


const RoomSchema = new mongoose.Schema({
    roomId: { type: String, unique: true },
    name: { type: String, unique: true },
    users: [String],
  });
  
export default mongoose.model('Room', RoomSchema);