const db = require('../db'); 
async function setup() {
  console.log('Creating meal_plans table...');
  await db.query(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      PlanID INT AUTO_INCREMENT PRIMARY KEY,
      UserID INT NOT NULL,
      PlanData JSON NOT NULL,
      TotalProtein FLOAT NOT NULL,
      IsCustom BOOLEAN DEFAULT FALSE,
      CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_meal_plan_user FOREIGN KEY (UserID) REFERENCES user_final(UserID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
  console.log('Table created successfully.');
}
setup().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
