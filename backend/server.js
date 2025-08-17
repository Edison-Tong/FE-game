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

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await pool.query("INSERT INTO users (username, password) VALUES ($1, $2)", [username, hashedPassword]);

    res.status(201).json({ message: "User registered" });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Compare hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Return the ID (and username) so frontend knows who logged in
    res.json({ message: "Login ok", id: user.id, username: user.username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

// Create team
app.post("/create-team", async (req, res) => {
  const { teamName } = req.body;
});
