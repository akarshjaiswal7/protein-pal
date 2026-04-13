USE protein_tracker;

INSERT IGNORE INTO food_category (CategoryID, CategoryName) VALUES 
(1, 'Vegetarian'),
(2, 'Non-Veg'),
(3, 'Dairy'),
(4, 'Supplement');

INSERT INTO food_final (FoodName, ProteinPer100g, CaloriesPer100g, FatPer100g, CarbsPer100g, CategoryID) VALUES
('Chicken Breast (Cooked)', 31.0, 165, 3.6, 0.0, 2),
('Eggs (Boiled)', 13.0, 155, 11.0, 1.1, 2),
('Tofu (Firm)', 17.0, 144, 8.7, 2.8, 1),
('Lentils (Cooked)', 9.0, 116, 0.4, 20.0, 1),
('Greek Yogurt (Non-fat)', 10.0, 59, 0.4, 3.6, 3),
('Whey Protein Powder', 80.0, 375, 3.0, 10.0, 4),
('Salmon (Cooked)', 25.0, 206, 12.0, 0.0, 2),
('Almonds', 21.0, 579, 50.0, 22.0, 1),
('Cottage Cheese', 11.0, 98, 4.3, 3.4, 3),
('Lean Beef (Cooked)', 26.0, 250, 15.0, 0.0, 2),
('Pork Chop (Cooked)', 27.0, 231, 14.0, 0.0, 2),
('Chickpeas (Cooked)', 8.9, 164, 2.6, 27.0, 1),
('Edamame (Cooked)', 11.9, 121, 5.2, 8.9, 1),
('Milk (1%)', 3.4, 42, 1.0, 5.0, 3),
('Peanut Butter', 25.0, 588, 50.0, 20.0, 1);
