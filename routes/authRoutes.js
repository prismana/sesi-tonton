const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');

// Login page
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/customer');
  }
  res.render('login', { error: null });
});

// login Process
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.render('login', { error: 'Username atau password salah!' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.render('login', { error: 'Username atau password salah!' });
    }

    // Save important data to session
    req.session.user = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    }

    // Redirect as user level
    if (user.role === 'admin') {
      res.redirect('/admin');
    } else {
      res.redirect('/customer');
    }
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Terjadi kesalahan pada server' });
  }
});

// Logout process
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  })
});

module.exports = router;
