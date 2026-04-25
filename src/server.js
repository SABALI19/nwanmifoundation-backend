import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./dbConnections/dbConnection.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "https://nwanmifoundation.vercel.app",
    ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim()) : []),
  ];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Foundation API' });
});
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is listening on PORT ${PORT}`);
    });
  } catch (error) {
    console.error(`Server could not start: ${error.message}`);
    process.exit(1); // Exit if DB connection fails
  }
};

startServer();
