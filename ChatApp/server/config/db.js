import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

 export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  mongoose.connect(mongoUri, {
    // No need for useNewUrlParser and useUnifiedTopology options
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));
};

// module.exports = connectDB;