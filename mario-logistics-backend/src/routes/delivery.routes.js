/*
  routes/delivery.routes.js — DELIVERY ROUTES
  
  This file defines URL paths for managing deliveries.
  Some routes are for dispatchers, some for drivers.
  Each route has its own role requirement.
  
  Think of it as the main operations corridor.
  
  Routes defined here:
    GET    /api/deliveries              → list all deliveries (dispatcher)
    POST   /api/deliveries              → create a delivery (dispatcher)
    GET    /api/deliveries/:id          → get one delivery (dispatcher)
    PUT    /api/deliveries/:id          → edit a delivery (dispatcher)
    PATCH  /api/deliveries/:id/assign   → assign driver (dispatcher)
    PATCH  /api/deliveries/:id/status   → update status (driver)
    POST   /api/deliveries/:id/proof    → upload photo (driver)
    DELETE /api/deliveries/:id          → cancel delivery (dispatcher)
*/

const express = require("express");

const {
  getDeliveries,
  createDelivery,
  assignDriver,
  updateStatus,
  cancelDelivery,
  uploadProof,
} = require("../controllers/delivery.controller");

const authChecker = require("../middleware/auth");
const roleChecker = require("../middleware/requireRole");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", authChecker, roleChecker("admin", "dispatcher"), getDeliveries);

router.post(
  "/",
  authChecker,
  roleChecker("admin", "dispatcher"),
  createDelivery,
);
router.patch(
  "/:id/assign",
  authChecker,
  roleChecker("admin", "dispatcher"),
  assignDriver,
);

router.patch("/:id/status", authChecker, roleChecker("driver"), updateStatus);

router.delete(
  "/:id",
  authChecker,
  roleChecker("admin", "dispatcher"),
  cancelDelivery,
);

router.post(
  "/:id/proof",
  authChecker,
  roleChecker("driver"),
  upload.single("photo"),
  uploadProof,
);
module.exports = router;
