function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/login');
}

// Khusus role admin
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }

  res.status(403).send('Akses ditolak: Halaman ini khusus admin');
}

// Khusus role Customer
function isCustomer(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'customer') {
    return next();
  }

  res.status(403).send('Akses ditolak: Halaman ini khusus customer');
}

module.exports = { isAuthenticated, isAdmin, isCustomer };