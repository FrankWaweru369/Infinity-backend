import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.js';

dotenv.config();

const deleteAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const result = await User.deleteMany({});
    console.log(`Deleted ${result.deletedCount} users`);
    mongoose.disconnect();
  } catch (err) {
    console.error(err);
    mongoose.disconnect();
  }
};

deleteAllUsers();
