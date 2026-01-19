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

//wake up the server
app.get("/ping", (req, res) => {
  console.log("Ping received");
  res.json({ message: "pong" });
});

// In-memory ready state for rooms (roomId -> { host_ready: bool, joiner_ready: bool })
// Note: ephemeral; restarts will clear this. For production, persist in DB.
const roomReadyStates = {};

// In-memory battle state per room
// Structure: {
//   [roomId]: {
//     active: true,
//     currentTurnUserId: <userId>,
//     attacked: { [charId]: true }
//   }
// }
const battleStates = {};
// Set ready state for a user in a room
app.post("/set-ready", async (req, res) => {
  const { roomId, userId, ready } = req.body;
  if (!roomId || !userId || typeof ready !== "boolean") {
    return res.status(400).json({ message: "Missing roomId, userId, or ready boolean" });
  }

  try {
    const room = await pool.query("SELECT host_id, joiner_id FROM rooms WHERE id = $1", [roomId]);
    if (room.rows.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!roomReadyStates[roomId]) {
      roomReadyStates[roomId] = { host_ready: false, joiner_ready: false };
    }

    const { host_id, joiner_id } = room.rows[0];
    if (userId === host_id) {
      roomReadyStates[roomId].host_ready = ready;
    } else if (userId === joiner_id) {
      roomReadyStates[roomId].joiner_ready = ready;
    } else {
      return res.status(403).json({ message: "User not in room" });
    }

    return res.json({ success: true, ready: roomReadyStates[roomId] });
  } catch (err) {
    console.error("Error setting ready state:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get ready state for a room
app.get("/room-ready", async (req, res) => {
  const { roomId } = req.query;
  if (!roomId) return res.status(400).json({ message: "Missing roomId" });

  try {
    const room = await pool.query("SELECT host_id, joiner_id FROM rooms WHERE id = $1", [roomId]);
    if (room.rows.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    const state = roomReadyStates[roomId] || { host_ready: false, joiner_ready: false };
    return res.json({ ready: state });
  } catch (err) {
    console.error("Error getting room ready state:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
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

// Delete team
app.delete("/delete-team", async (req, res) => {
  const { teamId } = req.body;

  if (!teamId) {
    return res.status(400).json({ message: "No teamId provided" });
  }

  try {
    // Delete all characters from the team first (foreign key constraint)
    await pool.query("DELETE FROM characters WHERE team_id = $1", [teamId]);

    // Then delete the team
    const result = await pool.query("DELETE FROM teams WHERE id = $1 RETURNING *", [teamId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error("Error deleting team:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//get teams
app.get("/get-teams", async (req, res) => {
  const { userId } = req.query; // get userId from query string

  try {
    const result = await pool.query(
      "SELECT id, team_name, char_count FROM teams WHERE user_id = $1",
      [userId] // pass userId safely here
    );

    res.json({ teams: result.rows });
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// get characters
app.get("/get-characters", async (req, res) => {
  const { teamId } = req.query;

  try {
    const result = await pool.query("SELECT * FROM characters WHERE team_id = $1", [teamId]);
    res.json({ characters: result.rows });
  } catch (err) {
    console.error("Error fetching characters:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// create a character
app.post("/create-character", async (req, res) => {
  const { name, label, sizeValue, typeValue, moveAmount, weaponValue, baseStats, abilities, teamId } = req.body;
  try {
    const types = await pool.query("SELECT type FROM characters WHERE team_id = $1", [teamId]);

    const newChar = await pool.query(
      "INSERT INTO characters (team_id, name, label, type, move_value, base_weapon, weapon_ability1, weapon_ability2, health, strength, defense, magick, resistance, speed, skill, knowledge, luck, size) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)  RETURNING id, team_id, name, label, type, move_value, base_weapon, weapon_ability1, weapon_ability2, health, strength, defense, magick, resistance, speed, skill, knowledge, luck, size",
      [
        teamId,
        name,
        label,
        typeValue,
        moveAmount[typeValue],
        weaponValue,
        abilities[0],
        abilities[1],
        baseStats["Hlth"],
        baseStats["Str"],
        baseStats["Def"],
        baseStats["Mgk"],
        baseStats["Res"],
        baseStats["Spd"],
        baseStats["Skl"],
        baseStats["Knl"],
        baseStats["Lck"],
        sizeValue,
      ]
    );
    res.json({ newChar: newChar.rows[0] });
  } catch (err) {
    console.log(err);
  }
});

app.patch("/increment-char-count", async (req, res) => {
  const { teamId } = req.body;

  try {
    const result = await pool.query(
      `UPDATE teams
       SET char_count = char_count + 1
       WHERE id = $1
       RETURNING char_count`,
      [teamId]
    );
    res.json({ success: true, newCount: result.rows[0].char_count });
  } catch (err) {
    console.error("Error incrementing character count:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/decrement-char-count", async (req, res) => {
  const { teamId } = req.body;

  try {
    const result = await pool.query(
      `UPDATE teams
       SET char_count = GREATEST(char_count - 1, 0)
       WHERE id = $1
       RETURNING char_count`,
      [teamId]
    );

    res.json({ success: true, newCount: result.rows[0].char_count });
  } catch (err) {
    console.error("Error decrementing character count:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

//get completed teams
app.get("/get-finished-teams", async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pool.query(
      "SELECT id, team_name, char_count FROM teams WHERE user_id = $1 and char_count = 6",
      [userId]
    );

    res.json({ teams: result.rows });
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Start hosting a game
app.post("/create-room", async (req, res) => {
  const { userId } = req.body;

  // Generate 4-character code
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();

  try {
    const result = await pool.query(
      `INSERT INTO rooms (host_id, code)
       VALUES ($1, $2)
       RETURNING id, code`,
      [userId, code]
    );

    res.json({
      message: "Room created",
      roomId: result.rows[0].id,
      code: result.rows[0].code,
    });
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// join a hosted game
app.post("/join-room", async (req, res) => {
  const { userId, code } = req.body;

  try {
    // Find room by code
    const roomCheck = await pool.query("SELECT * FROM rooms WHERE code = $1", [code.toUpperCase()]);

    if (roomCheck.rows.length === 0) {
      return res.status(404).json({ message: "Invalid code" });
    }

    const room = roomCheck.rows[0];

    if (room.joiner_id) {
      return res.status(409).json({ message: "Room already full" });
    }

    // Update room to link joiner
    await pool.query("UPDATE rooms SET joiner_id = $1 WHERE id = $2", [userId, room.id]);

    res.json({
      message: "Joined room",
      roomId: room.id,
      hostId: room.host_id,
    });
  } catch (err) {
    console.error("Error joining room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// check room status
app.get("/room-status", async (req, res) => {
  const { roomId } = req.query;

  try {
    const result = await pool.query("SELECT host_id, joiner_id FROM rooms WHERE id = $1", [roomId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error checking room status:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a room (Host cancels matchmaking)
app.delete("/delete-room", async (req, res) => {
  const { roomId } = req.body;

  if (!roomId) {
    return res.status(400).json({ message: "Missing roomId" });
  }

  try {
    // Remove room from database
    await pool.query("DELETE FROM rooms WHERE id = $1", [roomId]);

    // Delete only battle copy teams and their characters for this room
    const battleTeams = await pool.query("SELECT id FROM teams WHERE room_id = $1", [roomId]);
    for (const team of battleTeams.rows) {
      await pool.query("DELETE FROM characters WHERE team_id = $1", [team.id]);
      await pool.query("DELETE FROM teams WHERE id = $1", [team.id]);
    }

    return res.status(200).json({ message: "Room and associated battle copy teams deleted" });
  } catch (err) {
    console.error("Error deleting room:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// get opponents username
app.get("/get-user", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const result = await pool.query("SELECT username FROM users WHERE id = $1", [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ username: result.rows[0].username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete character
app.delete("/delete-character", async (req, res) => {
  const { characterId } = req.body;

  if (!characterId) {
    return res.status(400).json({
      success: false,
      message: "No characterId provided",
    });
  }

  try {
    const result = await pool.query("DELETE FROM characters WHERE id = $1 RETURNING *", [characterId]);

    if (result.rowCount === 0) {
      return res.json({
        success: false,
        message: "Character not found",
      });
    }

    res.json({
      success: true,
      message: "Character deleted",
      deleted: result.rows[0],
    });
  } catch (err) {
    console.error("Error deleting character:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// Duplicate a team with all its characters for battle
app.post("/duplicate-team-for-battle", async (req, res) => {
  const { teamId, userId, roomId } = req.body;
  if (!teamId || !userId || !roomId) {
    return res.status(400).json({ message: "Missing teamId, userId, or roomId" });
  }
  try {
    // Get original team
    const teamResult = await pool.query("SELECT * FROM teams WHERE id = $1", [teamId]);
    if (teamResult.rows.length === 0) {
      return res.status(404).json({ message: "Original team not found" });
    }
    const origTeam = teamResult.rows[0];
    // Create new team (battle copy) - keep original team name
    const battleTeamName = origTeam.team_name;
    // If the DB has an `original_team_id` column, record the source team there so copies
    // can be distinguished in the DB while keeping the same visible `team_name`.
    const newTeamResult = await pool.query(
      "INSERT INTO teams (user_id, team_name, char_count, room_id, original_team_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, team_name, user_id, char_count, room_id, original_team_id",
      [userId, battleTeamName, origTeam.char_count || 6, roomId, teamId]
    );
    const newTeamId = newTeamResult.rows[0].id;
    // Copy all characters
    const charsResult = await pool.query("SELECT * FROM characters WHERE team_id = $1", [teamId]);
    for (const char of charsResult.rows) {
      await pool.query(
        `INSERT INTO characters (team_id, name, label, type, move_value, base_weapon, weapon_ability1, weapon_ability2, health, strength, defense, magick, resistance, speed, skill, knowledge, luck, size)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          newTeamId,
          char.name,
          char.label,
          char.type,
          char.move_value,
          char.base_weapon,
          char.weapon_ability1,
          char.weapon_ability2,
          char.health,
          char.strength,
          char.defense,
          char.magick,
          char.resistance,
          char.speed,
          char.skill,
          char.knowledge,
          char.luck,
          char.size,
        ]
      );
    }
    res.json({
      message: "Team duplicated for battle",
      newTeamId,
      newTeam: newTeamResult.rows[0],
    });
  } catch (err) {
    console.error("Error duplicating team for battle:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all battle teams (and their characters) for a room
app.get("/get-battle-teams", async (req, res) => {
  const { roomId } = req.query;

  if (!roomId) {
    return res.status(400).json({ message: "Missing roomId" });
  }

  try {
    const teamsResult = await pool.query(
      "SELECT id, user_id, team_name, char_count, room_id FROM teams WHERE room_id = $1",
      [roomId]
    );
    const teams = [];

    for (const t of teamsResult.rows) {
      const charsRes = await pool.query("SELECT * FROM characters WHERE team_id = $1", [t.id]);
      teams.push({
        id: t.id,
        user_id: t.user_id,
        team_name: t.team_name,
        char_count: t.char_count,
        room_id: t.room_id,
        characters: charsRes.rows,
      });
    }

    return res.json({ teams });
  } catch (err) {
    console.error("Error fetching battle teams:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Start battle when both players are ready. Randomly pick who goes first.
app.post("/start-battle", async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ message: "Missing roomId" });

  try {
    const roomRes = await pool.query("SELECT host_id, joiner_id FROM rooms WHERE id = $1", [roomId]);
    if (roomRes.rows.length === 0) return res.status(404).json({ message: "Room not found" });
    const { host_id, joiner_id } = roomRes.rows[0];

    if (!host_id || !joiner_id) return res.status(400).json({ message: "Both players must be present" });

    const ready = roomReadyStates[roomId] || { host_ready: false, joiner_ready: false };
    if (!ready.host_ready || !ready.joiner_ready) {
      return res.status(400).json({ message: "Both players must be ready to start" });
    }

    // Randomly pick start
    const starter = Math.random() < 0.5 ? host_id : joiner_id;

    // Initialize attacked map for the starting player's characters (all false)
    const teamsRes = await pool.query("SELECT id, user_id FROM teams WHERE room_id = $1", [roomId]);
    const attacked = {};
    for (const t of teamsRes.rows) {
      if (t.user_id === starter) {
        const charsRes = await pool.query("SELECT id FROM characters WHERE team_id = $1", [t.id]);
        for (const c of charsRes.rows) attacked[c.id] = false;
      }
    }

    battleStates[roomId] = {
      active: true,
      currentTurnUserId: starter,
      attacked,
    };

    return res.json({ success: true, currentTurnUserId: starter });
  } catch (err) {
    console.error("Error starting battle:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get current battle state (turn owner, attacked flags, latest characters)
app.get("/battle-state", async (req, res) => {
  const { roomId } = req.query;
  if (!roomId) return res.status(400).json({ message: "Missing roomId" });

  try {
    const state = battleStates[roomId];
    if (!state || !state.active) return res.status(404).json({ message: "Battle not found" });

    // Return fresh characters for both teams
    const teamsResult = await pool.query("SELECT id, user_id, team_name FROM teams WHERE room_id = $1", [roomId]);
    const teams = [];
    for (const t of teamsResult.rows) {
      const charsRes = await pool.query("SELECT * FROM characters WHERE team_id = $1", [t.id]);
      teams.push({ id: t.id, user_id: t.user_id, team_name: t.team_name, characters: charsRes.rows });
    }

    return res.json({ currentTurnUserId: state.currentTurnUserId, attacked: state.attacked, teams });
  } catch (err) {
    console.error("Error fetching battle state:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Perform an attack from an attacker's character to a target character
app.post("/attack", async (req, res) => {
  const { roomId, attackerId, targetId, userId, damage: clientDamage } = req.body;
  if (!roomId || !attackerId || !targetId || !userId) return res.status(400).json({ message: "Missing fields" });

  try {
    const state = battleStates[roomId];
    if (!state || !state.active) return res.status(400).json({ message: "Battle not active" });
    if (state.currentTurnUserId !== userId) return res.status(403).json({ message: "Not your turn" });

    // Verify attacker belongs to current player
    const attackerRes = await pool.query(
      `SELECT c.*, t.user_id as owner_id FROM characters c JOIN teams t ON c.team_id = t.id WHERE c.id = $1`,
      [attackerId]
    );
    if (attackerRes.rows.length === 0) return res.status(404).json({ message: "Attacker not found" });
    const attacker = attackerRes.rows[0];
    if (attacker.owner_id !== userId) return res.status(403).json({ message: "Attacker does not belong to you" });

    // Ensure attacker hasn't already attacked this turn
    if (state.attacked[attackerId])
      return res.status(400).json({ message: "This character already attacked this turn" });

    // Verify target belongs to opponent
    const targetRes = await pool.query(
      `SELECT c.*, t.user_id as owner_id FROM characters c JOIN teams t ON c.team_id = t.id WHERE c.id = $1`,
      [targetId]
    );
    if (targetRes.rows.length === 0) return res.status(404).json({ message: "Target not found" });
    const target = targetRes.rows[0];
    if (target.owner_id === userId) return res.status(400).json({ message: "Cannot attack your own character" });

    // Use client-provided damage if available, otherwise fallback to attacker's strength
    const damage = clientDamage != null ? Number(clientDamage) : attacker.strength || 1;
    const newHealth = Math.max(0, (target.health || 0) - damage);
    await pool.query("UPDATE characters SET health = $1 WHERE id = $2", [newHealth, targetId]);

    // Mark attacker as having attacked this turn
    state.attacked[attackerId] = true;

    // Return updated target and attacked map
    const updatedTargetRes = await pool.query("SELECT * FROM characters WHERE id = $1", [targetId]);
    return res.json({ success: true, attacked: state.attacked, updatedTarget: updatedTargetRes.rows[0] });
  } catch (err) {
    console.error("Error performing attack:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// End the current player's turn and switch to the other player
app.post("/end-turn", async (req, res) => {
  const { roomId, userId } = req.body;
  if (!roomId || !userId) return res.status(400).json({ message: "Missing roomId or userId" });

  try {
    const state = battleStates[roomId];
    if (!state || !state.active) return res.status(400).json({ message: "Battle not active" });
    if (state.currentTurnUserId !== userId) return res.status(403).json({ message: "Not your turn" });

    const roomRes = await pool.query("SELECT host_id, joiner_id FROM rooms WHERE id = $1", [roomId]);
    if (roomRes.rows.length === 0) return res.status(404).json({ message: "Room not found" });
    const { host_id, joiner_id } = roomRes.rows[0];
    const next = host_id === userId ? joiner_id : host_id;

    // Reset attacked map for next player's characters
    const teamsRes = await pool.query("SELECT id, user_id FROM teams WHERE room_id = $1", [roomId]);
    const attacked = {};
    for (const t of teamsRes.rows) {
      if (t.user_id === next) {
        const charsRes = await pool.query("SELECT id FROM characters WHERE team_id = $1", [t.id]);
        for (const c of charsRes.rows) attacked[c.id] = false;
      }
    }

    state.currentTurnUserId = next;
    state.attacked = attacked;

    return res.json({ success: true, currentTurnUserId: next });
  } catch (err) {
    console.error("Error ending turn:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
