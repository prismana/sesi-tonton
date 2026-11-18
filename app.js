const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup view engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Setup Session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // Cookie 8 hour
}));

// Global variable user for all template
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Route Tes Koneksi Database
app.get('/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() AS current_time, COUNT(*) AS total_users FROM users');
    res.json({ status: 'OK', db: result.rows[0] });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server run in http://localhost:${PORT}`);
});