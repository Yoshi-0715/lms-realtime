
const Redis = require("ioredis");
require("dotenv").config();

const redis = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
  retryStrategy() {
    return null;
  },
  enableOfflineQueue: false
});

redis.on("connect", () => {
  console.log("Redis connected successfully");
});

redis.on("error", (err) => {
  if (err.code !== "ECONNREFUSED") {
    console.error("Redis error:", err.message);
  }
});

module.exports = redis;
