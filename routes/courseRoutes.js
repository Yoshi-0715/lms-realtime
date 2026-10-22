
const express = require("express");
const Course = require("../models/Course");
const redis = require("../config/redis");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

const CACHE_KEY = "courses:all";
const CACHE_TTL = 300;

// GET all courses with Redis caching
router.get("/", async (req, res) => {
  try {
    // Try Redis cache first
    try {
      await redis.connect().catch(() => {});

      const cachedCourses = await redis.get(CACHE_KEY);

      if (cachedCourses) {
        console.log("CACHE HIT: Courses loaded from Redis");

        return res.json({
          success: true,
          source: "redis-cache",
          courses: JSON.parse(cachedCourses)
        });
      }
    } catch (redisError) {
      console.log("Redis cache unavailable; using MySQL");
    }

    // Cache miss: fetch from MySQL
    console.log("CACHE MISS: Courses loaded from MySQL");

    const courses = await Course.findAll();

    // Save courses in Redis for 5 minutes
    try {
      await redis.set(
        CACHE_KEY,
        JSON.stringify(courses),
        "EX",
        CACHE_TTL
      );
    } catch (redisError) {
      console.log("Could not cache courses in Redis");
    }

    return res.json({
      success: true,
      source: "mysql",
      courses
    });
  } catch (error) {
    console.error("Fetch courses error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not fetch courses"
    });
  }
});

// GET one course by ID
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found"
      });
    }

    return res.json({
      success: true,
      course
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Could not fetch course"
    });
  }
});

// CREATE a course (instructors only)
router.post(
  "/",
  authMiddleware,
  roleMiddleware("instructor"),
  async (req, res) => {
    try {
      const { title, description } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Course title is required"
        });
      }

      const courseId = await Course.create({
        title: title.trim(),
        description,
        instructorId: req.user.id
      });

      // Invalidate cache after creating a course
      try {
        await redis.connect().catch(() => {});
        await redis.del(CACHE_KEY);
      } catch (redisError) {
        console.log("Could not invalidate course cache");
      }

      return res.status(201).json({
        success: true,
        message: "Course created successfully",
        courseId
      });
    } catch (error) {
      console.error("Create course error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not create course"
      });
    }
  }
);

module.exports = router;
