import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config(); // Load .env

const uri = process.env.MONGO_URI;
console.log('URI from .env:', uri); // Debug

try {
  await mongoose.connect(uri);
  console.log('✅ MongoDB connection successful!');
  process.exit(0);
} catch (err) {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
}
