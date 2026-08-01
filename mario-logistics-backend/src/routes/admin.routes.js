/*
  routes/admin.routes.js — ADMIN ROUTES
  
  This file defines URL paths that only admins can access.
  Every route here is protected by both auth.js and requireRole('admin').
  
  Think of it as the management-only corridor.
  
  Routes defined here:
    GET    /api/admin/stats           → dashboard statistics
    GET    /api/admin/drivers         → list all drivers
    POST   /api/admin/drivers         → create a new driver
    PATCH   /api/admin/drivers/:id     → edit a driver
    DELETE /api/admin/drivers/:id     → delete a driver
    GET    /api/admin/dispatchers     → list all dispatchers
    POST   /api/admin/dispatchers     → create a new dispatcher
    DELETE /api/admin/dispatchers/:id → delete a dispatcher
    GET    /api/admin/analytics       → delivery analytics data
  
  All routes: auth + requireRole('admin')
*/

const express = require("express");

const {
  getAnalytics,
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getDispatchers,
  createDispatcher,
  deleteDispatcher,
  getStats,
} = require("../controllers/admin.controller");

const authChecker = require("../middleware/auth");
const roleChecker = require("../middleware/requireRole");

const router = express.Router();

router.get("/stats", authChecker, roleChecker("admin"), getStats);
router.get(
  "/drivers",
  authChecker,
  roleChecker("admin", "dispatcher"),
  getDrivers,
);
router.post("/drivers", authChecker, roleChecker("admin"), createDriver);
router.patch("/drivers/:id", authChecker, roleChecker("admin"), updateDriver);
router.delete("/drivers/:id", authChecker, roleChecker("admin"), deleteDriver);
router.get("/dispatchers", authChecker, roleChecker("admin"), getDispatchers);
router.post(
  "/dispatchers",
  authChecker,
  roleChecker("admin"),
  createDispatcher,
);
router.delete(
  "/dispatchers/:id",
  authChecker,
  roleChecker("admin"),
  deleteDispatcher,
);

router.get("/analytics", authChecker, roleChecker("admin"), getAnalytics);

module.exports = router;
