import mongoose from "mongoose";
import dotenv from "dotenv";
import Message from "./models/message.js";

dotenv.config();


await mongoose.connect(process.env.MONGO_URI);

console.log("Mongo connected");


const result = await Message.updateMany(
  { seen: false },
  {
    $set: {
      seen: true,
    },
  }
);


console.log(
  `Cleaned ${result.modifiedCount} old messages`
);


await mongoose.disconnect();

process.exit();
