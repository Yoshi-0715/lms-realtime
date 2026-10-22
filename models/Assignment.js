
const db = require("../config/db");

const Assignment = {
  async create({ title, description, courseId, instructorId, dueDate }) {
    const [result] = await db.execute(
      `INSERT INTO assignments
       (title, description, course_id, instructor_id, due_date)
       VALUES (?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        courseId,
        instructorId,
        dueDate || null
      ]
    );

    return result.insertId;
  },

  async findByCourse(courseId) {
    const [rows] = await db.execute(
      `SELECT id, title, description, course_id,
              instructor_id, due_date, created_at
       FROM assignments
       WHERE course_id = ?
       ORDER BY id DESC`,
      [courseId]
    );

    return rows;
  }
};

module.exports = Assignment;
