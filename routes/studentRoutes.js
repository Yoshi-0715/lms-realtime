
const express = require("express");
const db = require("../config/db");
const redis = require("../config/redis");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

const LEADERBOARD_KEY = "students:leaderboard";

// Student dashboard
router.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware("student"),
  async (req, res) => {
    try {
      const [enrollments] = await db.execute(
        `SELECT c.id AS course_id,
                c.title AS course_title,
                c.description
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE e.student_id = ?
         ORDER BY c.id DESC`,
        [req.user.id]
      );

      const [assignments] = await db.execute(
        `SELECT a.id, a.title, a.description,
                a.course_id, a.due_date, c.title AS course_title
         FROM assignments a
         JOIN courses c ON c.id = a.course_id
         JOIN enrollments e ON e.course_id = c.id
         WHERE e.student_id = ?
         ORDER BY a.id DESC`,
        [req.user.id]
      );

      return res.json({
        success: true,
        message: "Student dashboard loaded successfully",
        enrolledCourses: enrollments,
        assignments
      });
    } catch (error) {
      console.error("Student dashboard error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not load student dashboard"
      });
    }
  }
);

// Get leaderboard: top 10 students
router.get(
  "/leaderboard",
  authMiddleware,
  async (req, res) => {
    try {
      await redis.connect().catch(() => {});

      const leaderboard = await redis.zrevrange(
        LEADERBOARD_KEY,
        0,
        9,
        "WITHSCORES"
      );

      const students = [];

      for (let i = 0; i < leaderboard.length; i += 2) {
        students.push({
          studentId: leaderboard[i],
          score: Number(leaderboard[i + 1])
        });
      }

      return res.json({
        success: true,
        source: "redis-sorted-set",
        leaderboard: students
      });
    } catch (error) {
      console.error("Leaderboard error:", error.message);

      return res.status(503).json({
        success: false,
        message: "Leaderboard is temporarily unavailable"
      });
    }
  }
);

// Add or update a student's score
// In a real deployment, this route should be restricted to trusted grading logic.
router.post(
  "/leaderboard/score",
  authMiddleware,
  roleMiddleware("instructor"),
  async (req, res) => {
    try {
      const { studentId, score } = req.body;

      if (
        !studentId ||
        score === undefined ||
        !Number.isFinite(Number(score)) ||
        Number(score) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid studentId and non-negative score are required"
        });
      }

      const [users] = await db.execute(
        "SELECT id FROM users WHERE id = ? AND role = 'student' LIMIT 1",
        [studentId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Student not found"
        });
      }

      await redis.connect().catch(() => {});

      await redis.zadd(
        LEADERBOARD_KEY,
        Number(score),
        String(studentId)
      );

      return res.json({
        success: true,
        message: "Student score updated",
        studentId: String(studentId),
        score: Number(score)
      });
    } catch (error) {
      console.error("Update score error:", error.message);

      return res.status(503).json({
        success: false,
        message: "Could not update leaderboard"
      });
    }
  }
);

module.exports = router;
