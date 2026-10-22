
const Redis = require("ioredis");
require("dotenv").config();

const subscriber = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  retryStrategy(times) {
    return Math.min(times * 500, 3000);
  }
});

const CHANNEL = "assignment_notifications";

subscriber.on("error", (error) => {
  console.error("Redis subscriber error:", error.message);
});

subscriber.on("ready", () => {
  console.log("Redis subscriber is ready");
});

async function startSubscriber() {
  if (subscriber.status === "wait") {
    await subscriber.connect();
  }

  await subscriber.subscribe(CHANNEL);

  console.log(`Subscribed to Redis channel: ${CHANNEL}`);
}

subscriber.on("message", (channel, message) => {
  if (channel !== CHANNEL) {
    return;
  }

  try {
    const notification = JSON.parse(message);

    console.log("Redis Pub/Sub notification received:");
    console.log(JSON.stringify(notification, null, 2));
  } catch (error) {
    console.error("Invalid notification message:", error.message);
  }
});

module.exports = {
  startSubscriber,
  subscriber
};
