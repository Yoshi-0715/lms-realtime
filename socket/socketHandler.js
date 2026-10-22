
const socketAuthMiddleware = require("../middleware/socketAuthMiddleware");

module.exports = (io) => {
  // Authenticate every socket before connecting
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    console.log("Authenticated socket connected:", socket.id);
    console.log("User:", socket.user.id || socket.user.userId);

    socket.on("joinCourse", (courseId) => {
      if (!courseId) {
        socket.emit("errorMessage", {
          message: "Course ID is required"
        });
        return;
      }

      const roomName = `course_${courseId}`;

      socket.join(roomName);

      socket.emit("roomJoined", {
        success: true,
        message: `Joined ${roomName}`,
        courseId
      });

      socket.to(roomName).emit("studentJoined", {
        message: "A user joined this course",
        courseId
      });

      console.log(`${socket.id} joined ${roomName}`);
    });

    socket.on("leaveCourse", (courseId) => {
      if (!courseId) return;

      const roomName = `course_${courseId}`;
      socket.leave(roomName);

      socket.emit("roomLeft", {
        success: true,
        courseId
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", socket.id, reason);
    });
  });
};
