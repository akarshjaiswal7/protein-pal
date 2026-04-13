const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const logger = require('../utils/logger');

// ─── SIGNUP ──────────────────────────────────────────────────────────────────
exports.signup = async (req, res) => {
  const { username, email, password, age, weight, gender, activityID, proteinGoalPerDay } = req.body;
  logger.info(`New signup attempt: ${username} (${email})`);

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const [existing] = await db.query('SELECT * FROM user_final WHERE Email = ? OR Username = ?', [email, username]);
    if (existing.length > 0) {
      logger.warn(`Signup blocked: User already exists with email/username: ${email}/${username}`);
      return res.status(400).json({ error: 'A profile with this email or username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO user_final (Username, Email, PasswordHash, Age, Weight, Gender, ActivityID, ProteinGoalPerDay)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, age || null, weight || null, gender || null, activityID || null, proteinGoalPerDay || null]
    );

    logger.info(`User created successfully: ${username} (ID: ${result.insertId})`);
    res.status(201).json({ message: 'Welcome to ProteinPal! Your account has been created.', userId: result.insertId, role: 'User' });
  } catch (err) {
    logger.error('Signup Error:', err.message);
    res.status(500).json({ error: 'Database error: Could not complete registration' });
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  logger.info(`Login attempt: ${email}`);

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Both email and password are required' });
    }

    const [users] = await db.query('SELECT * FROM user_final WHERE Email = ?', [email]);
    if (users.length === 0) {
      logger.warn(`Login failed: No user found with email ${email}`);
      return res.status(401).json({ error: 'Authentication failed: Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    
    if (!isMatch) {
      logger.warn(`Login failed: Incorrect password for ${email}`);
      return res.status(401).json({ error: 'Authentication failed: Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.UserID, email: user.Email, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info(`Successful login: ${user.Username} [Role: ${user.Role}]`);
    res.json({ message: 'Authenticated successfully', token, userId: user.UserID, username: user.Username, role: user.Role });
  } catch (err) {
    logger.error('Login Error:', err.message);
    res.status(500).json({ error: 'Database error: Could not process authentication' });
  }
};
