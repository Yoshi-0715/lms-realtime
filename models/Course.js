
const db = require("../config/db");

const Course = {
  async create({ title, description, instructorId }) {
    const [result] = await db.execute(
      `INSERT INTO courses (title, description, instructor_id)
       VALUES (?, ?, ?)`,
      [title, description || null, instructorId]
    );

    return result.insertId;
  },

  async findAll() {
    const [rows] = await db.execute(
      `SELECT c.id, c.title, c.description,
              c.instructor_id, c.created_at
       FROM courses c
       ORDER BY c.id DESC`
    );

    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute(
      "SELECT * FROM courses WHERE id = ? LIMIT 1",
      [id]
    );

    return rows[0] || null;
  }
};

module.exports = Course;
