// testFetchUser.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.js';

dotenv.config();

const testFetchUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({});
    console.log(users);
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
  }
};

testFetchUser();
