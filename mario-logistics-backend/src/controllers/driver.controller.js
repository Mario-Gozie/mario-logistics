/*
  controllers/driver.controller.js — DRIVER LOGIC
  
  This file contains logic for what drivers can see and do.
  Drivers only ever see their OWN deliveries — the queries
  here always filter by the logged-in driver's ID.
  
  Think of it as a personalised filtered view of the system
  built specifically for the person on the road.
  
  Functions:
  
  getMyDeliveries → fetches deliveries assigned to THIS driver only
                    filters to show today's deliveries first
                    ordered by priority (high first)
  
  getMyHistory    → fetches all past completed deliveries
                    for THIS driver only
                    ordered by most recent first
*/

const supabase = require("../config/supabase");

const getMyDeliveries = async (req, res) => {
  try {
    /*token always carry the user detail */
    const { id } = req.user;

    const { data: todayDelivery, error: errorDeliveryFetch } = await supabase
      .from("deliveries")
      .select("*")
      .eq("driver_id", id)
      .eq("company_id", process.env.COMPANY_ID);

    if (errorDeliveryFetch)
      return res.status(400).json({
        error: "You probably have no deliveries or couldn't get deliveries",
      });

    res.status(200).json(todayDelivery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getMyHistory = async (req, res) => {
  try {
    const { id } = req.user;

    const { data: driverHistory, error: driverHistoryError } = await supabase
      .from("deliveries")
      .select("*")
      .eq("driver_id", id)
      .eq("company_id", process.env.COMPANY_ID)
      .in("status", ["delivered", "failed"]);
    if (driverHistoryError)
      return res.status(400).json({ error: "unable to get history" });

    res.status(200).json(driverHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getMyDeliveries, getMyHistory };
