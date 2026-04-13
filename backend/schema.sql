CREATE DATABASE IF NOT EXISTS protein_tracker;
USE protein_tracker;
-- =========================
-- 1. ACTIVITY LEVEL (BCNF)
-- =========================
CREATE TABLE IF NOT EXISTS activity_level (
    ActivityID INT AUTO_INCREMENT PRIMARY KEY,
    LevelName VARCHAR(50),
    ProteinMultiplier DECIMAL(4,2)
);

-- =========================
-- 2. USER TABLE (BCNF)
-- =========================
CREATE TABLE IF NOT EXISTS user_final (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) UNIQUE,
    Email VARCHAR(100) UNIQUE,
    PasswordHash VARCHAR(255),
    Age INT,
    Weight DECIMAL(5,2),
    Gender ENUM('Male','Female','Other'),
    ActivityID INT,
    ProteinGoalPerDay DECIMAL(6,2),
    FOREIGN KEY (ActivityID) REFERENCES activity_level(ActivityID)
);

-- =========================
-- 3. FOOD CATEGORY (3NF)
-- =========================
CREATE TABLE IF NOT EXISTS food_category (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(50),
    SourceType VARCHAR(50)
);

-- =========================
-- 4. FOOD TABLE (3NF)
-- =========================
CREATE TABLE IF NOT EXISTS food_final (
    FoodID INT AUTO_INCREMENT PRIMARY KEY,
    FoodName VARCHAR(100) UNIQUE,
    ProteinPer100g DECIMAL(6,2),
    CaloriesPer100g DECIMAL(6,2),
    FatPer100g DECIMAL(6,2),
    CarbsPer100g DECIMAL(6,2),
    CategoryID INT,
    FOREIGN KEY (CategoryID) REFERENCES food_category(CategoryID)
);

-- =========================
-- 5. INTAKE TABLE (5NF CORE)
-- =========================
CREATE TABLE IF NOT EXISTS intake_final (
    IntakeID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    FoodID INT,
    QuantityInGrams DECIMAL(7,2),
    IntakeDate DATE,
    IntakeTime TIME,
    MealType ENUM('Breakfast','Lunch','Dinner','Snack'),
    FOREIGN KEY (UserID) REFERENCES user_final(UserID),
    FOREIGN KEY (FoodID) REFERENCES food_final(FoodID)
);

-- =========================
-- 6. USER GOALS (4NF)
-- =========================
CREATE TABLE IF NOT EXISTS user_goal (
    GoalID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    GoalType VARCHAR(50),
    GoalValue DECIMAL(6,2),
    FOREIGN KEY (UserID) REFERENCES user_final(UserID)
);

-- =========================
-- 7. USER PREFERENCES (4NF)
-- =========================
CREATE TABLE IF NOT EXISTS user_preference (
    PreferenceID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    PreferenceType VARCHAR(50),
    FOREIGN KEY (UserID) REFERENCES user_final(UserID)
);

-- =========================
-- 8. OPTIONAL (5NF DECOMPOSITION TABLES)
-- =========================
CREATE TABLE IF NOT EXISTS user_food (
    UserID INT,
    FoodID INT,
    PRIMARY KEY (UserID, FoodID),
    FOREIGN KEY (UserID) REFERENCES user_final(UserID),
    FOREIGN KEY (FoodID) REFERENCES food_final(FoodID)
);

CREATE TABLE IF NOT EXISTS user_date (
    UserID INT,
    IntakeDate DATE,
    PRIMARY KEY (UserID, IntakeDate),
    FOREIGN KEY (UserID) REFERENCES user_final(UserID)
);

CREATE TABLE IF NOT EXISTS food_date (
    FoodID INT,
    IntakeDate DATE,
    PRIMARY KEY (FoodID, IntakeDate),
    FOREIGN KEY (FoodID) REFERENCES food_final(FoodID)
);

-- =========================
-- 9. VIEW (FINAL OUTPUT)
-- =========================
CREATE OR REPLACE VIEW daily_protein_summary AS
SELECT 
    i.UserID,
    i.IntakeDate,
    SUM((f.ProteinPer100g / 100) * i.QuantityInGrams) AS TotalProtein,
    u.ProteinGoalPerDay,
    (SUM((f.ProteinPer100g / 100) * i.QuantityInGrams) / u.ProteinGoalPerDay) * 100 AS ProteinPercentage,
    CASE 
        WHEN (SUM((f.ProteinPer100g / 100) * i.QuantityInGrams) / u.ProteinGoalPerDay) * 100 < 90 THEN 'Deficient'
        WHEN (SUM((f.ProteinPer100g / 100) * i.QuantityInGrams) / u.ProteinGoalPerDay) * 100 BETWEEN 90 AND 110 THEN 'Adequate'
        ELSE 'Excess'
    END AS Status,
    COUNT(*) AS MealCount
FROM intake_final i
JOIN food_final f ON i.FoodID = f.FoodID
JOIN user_final u ON i.UserID = u.UserID
GROUP BY i.UserID, i.IntakeDate;
