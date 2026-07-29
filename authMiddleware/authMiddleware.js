const { verifyToken } = require('../public/javascripts/auth.js');

function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Authentication required. Please log in.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res
      .status(401)
      .json({ success: false, message: 'Session expired. Please log in again.' });
  }

  req.userId = decoded.id;
  next();
}

module.exports = authMiddleware;