const jwt = require('jsonwebtoken');

const auth = (roles = []) => (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    if (roles && roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  } catch (err) {
    // Log error for diagnostics (do not leak sensitive info)
    console.error('Auth middleware error:', err && err.message ? err.message : err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = auth;
