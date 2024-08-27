// redisClient.js
const Redis = require("ioredis");

const redisClient = new Redis({
    // host: process.env.REDIS_HOST || "localhost",  // Redis service hostname
    // port: process.env.REDIS_PORT || 6379,         // Default Redis port
    // password: process.env.REDIS_PASSWORD || "",// Redis password

    // DOCKER CONFI
    host: "redis",
    port: 6379
    password: "password"
});

// Handle Redis connection events
redisClient.on("connect", () => {
    console.log("Redis connected");
});

redisClient.on("error", (err) => {
    console.error("Redis connection error:", err);
});

module.exports = redisClient;
