/*
  middleware/auth.js — AUTHENTICATION CHECKPOINT
  
  This middleware function runs BEFORE any protected route handler.
  It reads the JWT token from the request Authorization header,
  verifies it using the JWT_SECRET, and attaches the decoded
  user info (id, role, name) to req.user.
  
  Think of it as a security guard that checks your ID at the door.
  
  If token is missing → returns 401 Unauthorized
  If token is invalid or expired → returns 401 Unauthorized
  If token is valid → calls next() and lets the request through
  
  Used in: all protected routes
  Works together with: requireRole.js
*/

const jwt = require("jsonwebtoken");

/*req (the request), res (the response), 
and next (a function that says "move on to the next step").*/

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: `No token provided` });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: `invalid or expired token` });
  }
};
