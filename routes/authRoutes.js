
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("../config/passport");
const redis = require("../config/redis");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 8 characters"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await require("../models/User").findByEmail(
      normalizedEmail
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
    }

    const allowedRoles = ["student", "instructor"];

    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const User = require("../models/User");

    const userId = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role || "student"
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        role: role || "student"
      }
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Registration failed"
    });
  }
});

// Login using Passport Local Strategy
router.post("/login", (req, res, next) => {
  passport.authenticate("local", { session: false }, async (error, user, info) => {
    if (error) {
      return next(error);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info?.message || "Invalid email or password"
      });
    }

    try {
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || "1d"
        }
      );

      // Cache basic user details in Redis.
      // Redis failure should not block a successful login.
      try {
        await redis.connect().catch(() => {});
        await redis.hset(`user:${user.id}`, {
          name: user.name,
          email: user.email,
          role: user.role
        });
        await redis.expire(`user:${user.id}`, 3600);
      } catch (redisError) {
        console.error("User cache warning:", redisError.message);
      }

      return res.json({
        success: true,
        message: "Login successful",
        token,
        user
      });
    } catch (loginError) {
      return next(loginError);
    }
  })(req, res, next);
});

// Get the logged-in user's profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch profile"
    });
  }
});

module.exports = router;
