const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});

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

    // Insert new user AND return id + username
    const newUser = await pool.query("INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username", [
      username,
      hashedPassword,
    ]);

    res.status(201).json({
      message: "User Created",
      id: newUser.rows[0].id,
      username: newUser.rows[0].username,
    });
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

// Create team
app.post("/create-team", async (req, res) => {
  const { teamName, userId } = req.body;

  try {
    // Check if the team name already exists for this user
    const teamCheck = await pool.query("SELECT * FROM teams WHERE user_id = $1 AND team_name = $2", [userId, teamName]);

    if (teamCheck.rows.length > 0) {
      return res.status(409).json({ message: "You already have a team with this name" });
    }

    // Insert new team
    const newTeam = await pool.query(
      "INSERT INTO teams (user_id, team_name) VALUES ($1, $2) RETURNING id, team_name, user_id",
      [userId, teamName]
    );

    res.status(201).json({
      message: "Team created successfully",
      team: newTeam.rows[0],
    });
  } catch (err) {
    console.error("Error creating team:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//get teams
app.get("/get-teams", async (req, res) => {
  const { userId } = req.query; // get userId from query string

  try {
    const result = await pool.query(
      "SELECT id, team_name FROM teams WHERE user_id = $1",
      [userId] // pass userId safely here
    );

    res.json({ teams: result.rows });
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});
