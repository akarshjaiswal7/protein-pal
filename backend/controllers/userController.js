const db = require('../db');

exports.getUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const [users] = await db.query(
      'SELECT UserID, Username, Email, Age, Weight, Gender, ActivityID, ProteinGoalPerDay FROM user_final WHERE UserID = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(users[0]);
  } catch (err) {
    console.error('Get User Error:', err);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { userId, age, weight, gender, activityID, proteinGoalPerDay } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const [result] = await db.query(
      `UPDATE user_final 
       SET Age = COALESCE(?, Age), 
           Weight = COALESCE(?, Weight), 
           Gender = COALESCE(?, Gender), 
           ActivityID = COALESCE(?, ActivityID), 
           ProteinGoalPerDay = COALESCE(?, ProteinGoalPerDay)
       WHERE UserID = ?`,
      [age, weight, gender, activityID, proteinGoalPerDay, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const bcrypt = require('bcryptjs');

exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }

    // Verify user and password
    const [users] = await db.query('SELECT PasswordHash FROM user_final WHERE UserID = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, users[0].PasswordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    await db.query('DELETE FROM user_final WHERE UserID = ?', [id]);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete User Error:', err);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};
