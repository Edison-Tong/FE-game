// server.js
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Register
app.post("/register", async (req, res) => {
  await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [req.body.username, req.body.password]);
  res.send("Registered");
});

// Login
app.post("/login", async (req, res) => {
  const r = await pool.query("SELECT * FROM users WHERE username = $1 AND password = $2", [
    req.body.username,
    req.body.password,
  ]);
  res.send(r.rows.length > 0 ? "Login ok" : "Login failed");
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
