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
  const { username, password } = req.body;

  try {
    // Check if username already exists
    const userCheck = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

    if (userCheck.rows.length > 0) {
      return res.status(409).json({ message: "Username already exists" });
    }

    // Insert new user
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, password]);

    res.status(201).json({ message: "User registered" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
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
