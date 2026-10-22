
require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const db = require("./config/db");
const redis = require("./config/redis");
const { startSubscriber } = require("./pubsub/subscriber");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Make Socket.io accessible inside routes
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "LMS Real-Time Notification System API is running"
  });
});

app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/courses", require("./routes/courseRoutes"));
app.use("/api/v1/instructor", require("./routes/instructorRoutes"));
app.use("/api/v1/students", require("./routes/studentRoutes"));

// Central error handler
app.use((err, req, res, next) => {
  console.error("Application error:", err.message);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// Socket.io authentication and course rooms
const socketHandler = require("./socket/socketHandler");
socketHandler(io);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify MySQL connection
    const connection = await db.getConnection();
    console.log("MySQL connected successfully");
    connection.release();

    // Redis is optional for initial startup.
    // Redis-dependent features require a running Redis server.
    try {
      await redis.connect();
      console.log("Redis connected successfully");
    } catch (error) {
      console.error("Redis unavailable:", error.message);
    }

    // Start the Pub/Sub subscriber if Redis is available.
    try {
      await startSubscriber();
    } catch (error) {
      console.error("Redis subscriber unavailable:", error.message);
    }

    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Notification page: http://localhost:${PORT}/client.html`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };
