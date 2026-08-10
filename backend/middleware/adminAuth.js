function adminAuth(req, res, next) {
  const provided = req.header('x-admin-key');
  const expected = process.env.ADMIN_API_KEY;

  if (!expected) {
    return res.status(503).json({ error: 'Admin API is not configured. Set ADMIN_API_KEY.' });
  }

  if (!provided || provided !== expected) {
    return res.status(401).json({ error: 'Missing or invalid x-admin-key header' });
  }

  return next();
}

module.exports = adminAuth;
