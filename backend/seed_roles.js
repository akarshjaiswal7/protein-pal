require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

(async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('ProteinPal@2025', salt);

    // Admin
    await db.query(
      `INSERT INTO user_final (Username, Email, PasswordHash, Role)
       VALUES ('SuperAdmin', 'admin@proteinpal.com', ?, 'Admin')
       ON DUPLICATE KEY UPDATE PasswordHash = ?, Role = 'Admin'`,
      [hash, hash]
    );

    // Nutritionist
    await db.query(
      `INSERT INTO user_final (Username, Email, PasswordHash, Role)
       VALUES ('Dr. Sarah', 'nutri@proteinpal.com', ?, 'Nutritionist')
       ON DUPLICATE KEY UPDATE PasswordHash = ?, Role = 'Nutritionist'`,
      [hash, hash]
    );

    console.log('=== CREDENTIALS SEEDED ===');
    console.log('Admin     | admin@proteinpal.com | ProteinPal@2025');
    console.log('Nutritionist | nutri@proteinpal.com | ProteinPal@2025');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
