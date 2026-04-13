require('dotenv').config();
const db = require('./db');

(async () => {
  try {
    const query = `
      INSERT IGNORE INTO activity_level (ActivityID, LevelName, ProteinMultiplier) VALUES 
      (1, 'Sedentary', 1.0), 
      (2, 'Light', 1.1), 
      (3, 'Moderate', 1.2), 
      (4, 'Active', 1.3), 
      (5, 'Very Active', 1.4)
    `;
    await db.query(query);
    console.log('Activity levels seeded!');
  } catch(e) {
    console.error('Error seeding activity levels:', e.message);
  }
  process.exit(0);
})();
