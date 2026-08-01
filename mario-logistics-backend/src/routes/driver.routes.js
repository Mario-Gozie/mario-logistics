/*
  routes/driver.routes.js — DRIVER ROUTES
  
  This file defines URL paths that only drivers can access.
  Drivers only see their own assigned deliveries — never others.
  
  Think of it as the driver's personal noticeboard.
  
  Routes defined here:
    GET /api/driver/deliveries → today's assigned deliveries for this driver
    GET /api/driver/history    → this driver's past delivery history
  
  All routes: auth + requireRole('driver')
*/
const express = require("express");

const {
  getMyDeliveries,
  getMyHistory,
} = require("../controllers/driver.controller");

const authChecker = require("../middleware/auth");
const roleChecker = require("../middleware/requireRole");

const router = express.Router();

router.get("/deliveries", authChecker, roleChecker("driver"), getMyDeliveries);
router.get("/history", authChecker, roleChecker("driver"), getMyHistory);

module.exports = router;
