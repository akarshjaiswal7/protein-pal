require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const foodRoutes = require('./routes/foodRoutes');
const intakeRoutes = require('./routes/intakeRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Root route for health check
app.get('/', (req, res) => {
  res.send('Protein Tracker API is running');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/calculator', calculatorRoutes);
app.use('/api/user', userRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/intake', intakeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/nutritionist', require('./routes/nutritionistRoutes'));
app.use('/api/notes', require('./routes/notesRoutes'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
