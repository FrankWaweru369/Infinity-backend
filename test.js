import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/user.js';
import dotenv from 'dotenv';

dotenv.config();

const test = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOne({ email: 'memberone@example.com' });
  console.log('Stored hash:', user.password);

  const isMatch = await bcrypt.compare('ilovemycat', user.password);
  console.log('Password matches?', isMatch);

  mongoose.connection.close();
};

test();
