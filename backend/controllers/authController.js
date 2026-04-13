const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

exports.signup = async (req, res) => {
  try {
    const { username, email, password, age, weight, gender, activityID, proteinGoalPerDay } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const [existing] = await db.query('SELECT * FROM user_final WHERE Email = ? OR Username = ?', [email, username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const [result] = await db.query(
      `INSERT INTO user_final (Username, Email, PasswordHash, Age, Weight, Gender, ActivityID, ProteinGoalPerDay)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, age || null, weight || null, gender || null, activityID || null, proteinGoalPerDay || null]
    );

    res.status(201).json({ message: 'User created successfully', userId: result.insertId, role: 'User' });
  } catch (err) {
    console.error('Signup Error:', err);
    res.status(500).json({ error: 'Database error during signup' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [users] = await db.query('SELECT * FROM user_final WHERE Email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.UserID, email: user.Email, role: user.Role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ message: 'Login successful', token, userId: user.UserID, username: user.Username, role: user.Role });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Database error during login' });
  }
};
