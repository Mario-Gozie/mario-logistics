/*
  middleware/requireRole.js — ROLE PERMISSION CHECKER
  
  This middleware runs AFTER auth.js has verified the token.
  It checks whether the logged-in user has the correct role
  to access a specific route.
  
  Think of it as a VIP list checker — even if you're inside the building,
  you still need the right access level for each room.
  
  Example usage on a route:
    router.get('/stats', auth, requireRole('admin'), controller.getStats)
  
  If role does not match → returns 403 Forbidden
  If role matches → calls next() and lets the request through
  
  Works together with: auth.js
*/

module.exports = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
};

/*
  middleware/requireRole.js — ROLE PERMISSION CHECKER

  This middleware runs AFTER auth.js has verified the token.
  It checks whether the logged-in user has the correct role
  to access a specific route.

  Think of it as a VIP list checker — even if you are inside
  the building, you still need the right access level for each room.

  HOW IT WORKS:
  - Outer function receives the allowed roles e.g. requireRole('admin')
  - The ...roles rest parameter collects them into an array automatically
  - Inner function checks if req.user.role is inside that roles array
  - If role is NOT in the array → 403 Access denied, request stops
  - If role IS in the array → next() is called, request continues

  STATUS CODES:
  - 401 → you are not logged in (handled by auth.js)
  - 403 → you are logged in but not allowed here (handled here)

  USAGE IN ROUTES:
  router.get('/stats', auth, requireRole('admin'), controller.getStats)
  router.get('/deliveries', auth, requireRole('admin', 'dispatcher'), controller.getDeliveries)
  router.patch('/status', auth, requireRole('driver'), controller.updateStatus)

  Works together with: auth.js
*/
