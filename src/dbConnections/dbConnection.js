import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connection successful!");
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    throw error; // Re-throw so startServer catches it
  }
};