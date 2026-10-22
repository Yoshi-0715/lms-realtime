
const Redis = require("ioredis");
require("dotenv").config();

const publisher = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  retryStrategy(times) {
    return Math.min(times * 500, 3000);
  }
});

publisher.on("error", (error) => {
  console.error("Redis publisher error:", error.message);
});

const CHANNEL = "assignment_notifications";

async function publishAssignment(notification) {
  if (publisher.status === "wait") {
    await publisher.connect();
  }

  const message = JSON.stringify({
    type: "NEW_ASSIGNMENT",
    data: notification,
    publishedAt: new Date().toISOString()
  });

  const subscriberCount = await publisher.publish(
    CHANNEL,
    message
  );

  console.log(
    `Assignment notification published. Subscribers: ${subscriberCount}`
  );

  return subscriberCount;
}

module.exports = {
  publishAssignment,
  publisher,
  CHANNEL
};
