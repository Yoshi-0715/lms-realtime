
const express = require("express");
const Assignment = require("../models/Assignment");
const Course = require("../models/Course");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { publishAssignment } = require("../pubsub/publisher");

const router = express.Router();

// Create an assignment for a course
router.post(
  "/assignments",
  authMiddleware,
  roleMiddleware("instructor"),
  async (req, res) => {
    try {
      const {
        title,
        description,
        courseId,
        dueDate
      } = req.body;

      if (!title || !title.trim() || !courseId) {
        return res.status(400).json({
          success: false,
          message: "Assignment title and courseId are required"
        });
      }

      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      // Only the course instructor can create its assignments
      if (Number(course.instructor_id) !== Number(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: "You can create assignments only for your own courses"
        });
      }

      const assignmentId = await Assignment.create({
        title: title.trim(),
        description,
        courseId,
        instructorId: req.user.id,
        dueDate: dueDate || null
      });

      const notification = {
        assignmentId,
        title: title.trim(),
        description: description || "",
        courseId,
        dueDate: dueDate || null,
        message: `New assignment: ${title.trim()}`
      };

      // Notify connected students in the course room
      const io = req.app.get("io");

      if (io) {
        io.to(`course_${courseId}`).emit(
          "newAssignment",
          notification
        );
      }

      // Publish notification through Redis Pub/Sub
      try {
        await publishAssignment(notification);
      } catch (pubsubError) {
        console.error("Redis Pub/Sub warning:", pubsubError.message);
      }

      return res.status(201).json({
        success: true,
        message: "Assignment created successfully",
        assignmentId,
        notification
      });
    } catch (error) {
      console.error("Create assignment error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not create assignment"
      });
    }
  }
);

// Get assignments for a course
router.get(
  "/courses/:courseId/assignments",
  authMiddleware,
  async (req, res) => {
    try {
      const courseId = req.params.courseId;

      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Course not found"
        });
      }

      // Check whether the user is the instructor or enrolled student
      if (req.user.role === "instructor") {
        if (Number(course.instructor_id) !== Number(req.user.id)) {
          return res.status(403).json({
            success: false,
            message: "You cannot access this course"
          });
        }
      } else if (req.user.role === "student") {
        const [enrollments] = await db.execute(
          `SELECT id FROM enrollments
           WHERE course_id = ? AND student_id = ?
           LIMIT 1`,
          [courseId, req.user.id]
        );

        if (enrollments.length === 0) {
          return res.status(403).json({
            success: false,
            message: "You are not enrolled in this course"
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
      }

      const assignments = await Assignment.findByCourse(courseId);

      return res.json({
        success: true,
        assignments
      });
    } catch (error) {
      console.error("Fetch assignments error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Could not fetch assignments"
      });
    }
  }
);

module.exports = router;
