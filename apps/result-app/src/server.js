const express = require("express");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 4000;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "postgres",
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postme",
  database: process.env.POSTGRES_DB || "feedbackdb",
});

app.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, rating, comment, created_at FROM feedback ORDER BY created_at DESC LIMIT 20"
    );

    const rows = result.rows
      .map(
        (item) => `
        <tr>
          <td>${item.id}</td>
          <td>${item.rating}</td>
          <td>${item.comment}</td>
          <td>${item.created_at}</td>
        </tr>
      `
      )
      .join("");

    res.send(`
      <html>
        <head>
          <title>Feedback Results</title>
          <style>
            body { font-family: Arial; background: #f4f6f8; padding: 40px; }
            .container { background: white; padding: 30px; border-radius: 10px; max-width: 900px; margin: auto; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 10px; }
            th { background: #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Feedback Results</h1>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <br>
            <a href="/health">Health Check</a>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading feedback results");
  }
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "result-app",
  });
});

app.listen(PORT, () => {
  console.log(`Result app running on port ${PORT}`);
});
