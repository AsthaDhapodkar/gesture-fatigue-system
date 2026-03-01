import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
      },
      token: generateToken(user._id),
    });

  } catch (err) {
  console.log("REGISTER ERROR:", err);
  res.status(500).json({ message: err.message });
}
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    // 1️⃣ Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // 2️⃣ Normalize email (important!)
    email = email.toLowerCase().trim();

    // 3️⃣ Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 4️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 5️⃣ Success response
    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
      },
      token: generateToken(user._id),
    });

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: err.message });
  }
};