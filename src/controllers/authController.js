import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const createToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in .env");
  }

  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ,
  });
};

const sendAuthResponse = (res, statusCode, message, user) => {
  const token = createToken(user._id);

  return res.status(statusCode).json({
    message,
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
    },
  });
};

export const signup = async (req, res) => {
  try {
    const { fullName, name, email, password } = req.body;
    const displayName = fullName || name;

    if (!displayName || !email || !password) {
      return res.status(400).json({
        message: "Full name, email, and password are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName: displayName,
      email,
      password: hashedPassword,
    });

    return sendAuthResponse(res, 201, "Signup successful", user);
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((fieldError) => fieldError.message)
        .join(", ");

      return res.status(400).json({ message });
    }

    return res.status(500).json({ message: "Signup failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    return sendAuthResponse(res, 200, "Login successful", user);
  } catch (error) {
    return res.status(500).json({ message: "Login failed" });
  }
};
