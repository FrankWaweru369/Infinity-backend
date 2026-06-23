import mongoose from "mongoose";
import dotenv from "dotenv";
import Notification from "./models/Notification.js";

dotenv.config();


await mongoose.connect(process.env.MONGO_URI);

console.log("Mongo connected");


const result = await Notification.updateMany(
  {
    isRead: false,
  },
  {
    $set: {
      isRead: true,
    },
  }
);


console.log(
  `Cleaned ${result.modifiedCount} old notifications`
);


await mongoose.disconnect();

process.exit();
