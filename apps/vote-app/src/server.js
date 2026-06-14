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
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: Arial, sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #0f172a, #1e3a8a, #2563eb);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 30px;
            color: #0f172a;
          }

          .card {
            width: 100%;
            max-width: 560px;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 22px;
            padding: 35px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
          }

          .badge {
            display: inline-block;
            padding: 8px 14px;
            border-radius: 999px;
            background: #dbeafe;
            color: #1d4ed8;
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 15px;
          }

          h1 {
            margin: 0;
            font-size: 32px;
            color: #0f172a;
          }

          .subtitle {
            margin-top: 10px;
            margin-bottom: 25px;
            color: #475569;
            line-height: 1.5;
          }

          label {
            font-weight: bold;
            color: #334155;
          }

          select,
          textarea {
            width: 100%;
            margin-top: 8px;
            margin-bottom: 20px;
            padding: 14px;
            border-radius: 12px;
            border: 1px solid #cbd5e1;
            font-size: 15px;
            outline: none;
          }

          select:focus,
          textarea:focus {
            border-color: #2563eb;
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
          }

          textarea {
            min-height: 120px;
            resize: vertical;
          }

          button {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 14px;
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
          }

          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(37, 99, 235, 0.35);
          }

          .footer {
            margin-top: 22px;
            display: flex;
            justify-content: space-between;
            font-size: 14px;
          }

          .footer a {
            color: #2563eb;
            text-decoration: none;
            font-weight: bold;
          }

          .stack {
            margin-top: 20px;
            padding: 14px;
            border-radius: 14px;
            background: #f8fafc;
            color: #475569;
            font-size: 14px;
          }
        </style>
      </head>

      <body>
        <div class="card">
          <div class="badge">🚀 DevOps Feedback Platform</div>

          <h1>Share your feedback</h1>

          <p class="subtitle">
            Your feedback will be sent to Redis, processed by a .NET worker,
            stored in PostgreSQL, and displayed in the result dashboard.
          </p>

          <form method="POST" action="/feedback">
            <label>How was your experience?</label>
            <select name="rating" required>
              <option value="excellent">🌟 Excellent</option>
              <option value="good">👍 Good</option>
              <option value="average">🙂 Average</option>
              <option value="bad">⚠️ Bad</option>
            </select>

            <label>Your comment</label>
            <textarea name="comment" placeholder="Write your feedback here..."></textarea>

            <button type="submit">Submit Feedback ✅</button>
          </form>

          <div class="stack">
            🧩 Stack: Node.js → Redis → .NET Worker → PostgreSQL → Result App
          </div>

          <div class="footer">
            <a href="/health">Health Check</a>
            <span>v2 Helm GitOps</span>
          </div>
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
      <head>
        <title>Feedback Submitted</title>
        <style>
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            min-height: 100vh;
            background: linear-gradient(135deg, #16a34a, #15803d);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .card {
            background: white;
            padding: 35px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 20px 50px rgba(0,0,0,0.25);
          }

          h2 {
            color: #166534;
          }

          a {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 18px;
            background: #16a34a;
            color: white;
            border-radius: 10px;
            text-decoration: none;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>✅ Feedback submitted successfully</h2>
          <p>Your feedback was sent to Redis and will be processed by the worker.</p>
          <a href="/">Back to Vote App</a>
        </div>
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
