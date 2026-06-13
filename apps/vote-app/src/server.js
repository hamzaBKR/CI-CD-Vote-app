const express = require("express");
const redis = require("redis");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = process.env.REDIS_PORT || 6379;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const redisClient = redis.createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

async function startRedis() {
  await redisClient.connect();
  console.log(`Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
}

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Feedback Platform - Vote App</title>
        <style>
          body { font-family: Arial; background: #f4f6f8; padding: 40px; }
          .container { background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: auto; }
          button { padding: 10px 15px; margin-top: 10px; cursor: pointer; }
          textarea { width: 100%; height: 100px; }
          select { width: 100%; padding: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Feedback Platform</h1>
          <form method="POST" action="/feedback">
            <label>Rating:</label><br><br>
            <select name="rating" required>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="average">Average</option>
              <option value="bad">Bad</option>
            </select>
            <br><br>
            <label>Comment:</label><br><br>
            <textarea name="comment" placeholder="Write your feedback..."></textarea>
            <br><br>
            <button type="submit">Submit Feedback</button>
          </form>
          <br>
          <a href="/health">Health Check</a>
        </div>
      </body>
    </html>
  `);
});

app.post("/feedback", async (req, res) => {
  const feedback = {
    rating: req.body.rating,
    comment: req.body.comment || "",
    createdAt: new Date().toISOString(),
  };

  await redisClient.lPush("feedback_queue", JSON.stringify(feedback));

  res.send(`
    <html>
      <body style="font-family: Arial; padding: 40px;">
        <h2>Feedback submitted successfully</h2>
        <a href="/">Back</a>
      </body>
    </html>
  `);
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "vote-app",
  });
});

startRedis()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Vote app running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start vote app:", err);
    process.exit(1);
  });
