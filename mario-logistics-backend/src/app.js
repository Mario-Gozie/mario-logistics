/*
  app.js — EXPRESS APP SETUP
  
  This file creates and configures the Express application.
  It does three things:
  1. Sets up middleware (cors, json parsing)
  2. Registers all route files so Express knows what URLs exist
  3. Exports the app so server.js can start it
  
  Think of it as the brain that connects everything together.
  
  Middleware applied here runs on EVERY request.
  Routes registered here define what URLs your API responds to.
*/

const express = require("express");

const cors = require("cors"); // For all apps to run on different Ports
const authRoutes = require("./routes/auth.routes");
const deliveryRoutes = require("./routes/delivery.routes");
const adminRoutes = require("./routes/admin.routes");
const driverRoutes = require("./routes/driver.routes");

const app = express();

/* Seting up middleware- These two would run 
on any request on the backend before anything */

app.use(cors());
app.use(express.json()); //Important for reading Json
app.use("/api/auth", authRoutes); // This is where the route attribute/function of express works
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/driver", driverRoutes);

app.get(`/`, (req, res) => {
  res.json({ message: `Mario Logistics API is running ` });
});

module.exports = app;
