/*
  routes/auth.routes.js — AUTHENTICATION ROUTES
  
  This file defines the URL paths for authentication.
  It does NOT contain logic — it just points each URL
  to the correct function in auth.controller.js
  
  Think of it as a signpost that directs traffic.
  
  Routes defined here:
    POST /api/auth/register → create a new user
    POST /api/auth/login    → login and get a JWT token
    GET  /api/auth/me       → get the currently logged in user
  
  No auth required: register, login (public routes)
  Auth required: me
*/

const express = require("express");

const router = express.Router(); // Express built in tool. This groups related routes together

const { register, login, me } = require("../controllers/auth.controller");
const auth = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, me);
module.exports = router;
