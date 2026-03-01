import jwt from "jsonwebtoken";

const generateToken = (id) => {
  console.log("JWT SECRET INSIDE FILE:", process.env.JWT_SECRET);

  return jwt.sign(
    { id },
    "testkey123456789" || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

export default generateToken;