
const db = require("../config/db");

const User = {
  async create({ name, email, password, role = "student" }) {
    const [result] = await db.execute(
      `INSERT INTO users (name, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [name, email, password, role]
    );

    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await db.execute(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await db.execute(
      `SELECT id, name, email, role
       FROM users WHERE id = ? LIMIT 1`,
      [id]
    );

    return rows[0] || null;
  }
};

module.exports = User;
