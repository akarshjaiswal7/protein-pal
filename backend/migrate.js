require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    // 1. Alter user_final
    try {
      await db.query(`ALTER TABLE user_final ADD COLUMN Role ENUM('User', 'Admin', 'Nutritionist') DEFAULT 'User'`);
      console.log('Added Role column');
    } catch(err) {
      if(err.code === 'ER_DUP_FIELDNAME') console.log('Role column already exists');
      else throw err;
    }
    
    // 2. Create user_notes
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_notes (
        NoteID INT AUTO_INCREMENT PRIMARY KEY,
        NutritionistID INT,
        UserID INT,
        Content TEXT,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (NutritionistID) REFERENCES user_final(UserID) ON DELETE SET NULL,
        FOREIGN KEY (UserID) REFERENCES user_final(UserID) ON DELETE CASCADE
      )
    `);
    console.log('Created user_notes table');
    
    // 3. Seed Admin & Nutritionist
    const salt = await bcrypt.genSalt(10);
    const pass = await bcrypt.hash('admin123', salt);
    // Use UPDATE if they accidentally already exist but don't have roles
    await db.query(`INSERT IGNORE INTO user_final (Username, Email, PasswordHash, Role) VALUES ('Admin', 'admin@protein.com', ?, 'Admin')`, [pass]);
    await db.query(`INSERT IGNORE INTO user_final (Username, Email, PasswordHash, Role) VALUES ('Dr. Nutri', 'nutri@protein.com', ?, 'Nutritionist')`, [pass]);
    
    // Just in case INSERT IGNORE failed because Username is unique but role was 'User', we FORCE the role
    await db.query(`UPDATE user_final SET Role = 'Admin' WHERE Email = 'admin@protein.com'`);
    await db.query(`UPDATE user_final SET Role = 'Nutritionist' WHERE Email = 'nutri@protein.com'`);
    
    console.log('Seeded Admin and Nutritionist roles. Password: admin123');
    
  } catch(e) {
     console.error(e);
  }
  process.exit(0);
})();
