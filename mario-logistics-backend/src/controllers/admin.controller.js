/*
  controllers/admin.controller.js — ADMIN LOGIC
  
  This file contains all logic for admin-only operations.
  Only users with role 'admin' can trigger these functions.
  
  Think of it as the management office where company-wide
  decisions and data are handled.
  
  Functions:
  
  getStats       → counts total deliveries, active drivers,
                   success rate, average delivery time
  
  getDrivers     → fetches all drivers with their delivery
                   counts and success rates
  
  createDriver   → creates a new driver account (hashes password)
  
  updateDriver   → edits driver details or deactivates them
  
  deleteDriver   → soft deletes a driver (keeps delivery history)
  
  getDispatchers → fetches all dispatcher accounts
  
  createDispatcher → creates a new dispatcher account
  
  deleteDispatcher → removes a dispatcher account
  
  getAnalytics   → returns daily delivery counts, status breakdown,
                   and busiest hours for the analytics charts
*/

const supabase = require("../config/supabase");

const bcrypt = require("bcryptjs");

const getDrivers = async (req, res) => {
  try {
    const { data: driversData, error: driversError } = await supabase
      .from("users")
      .select("*")
      .eq("company_id", process.env.COMPANY_ID)
      .eq("role", "driver");

    if (driversError) {
      return res.status(400).json({ error: driversError });
    }

    return res.status(200).json(driversData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createDriver = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const { data: emailCheck } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (emailCheck) {
      return res.status(400).json({ error: "email already exist" });
    }
    const saltRounds = 10; /* No of times the password should be encrypted */

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const { data: insertDriver, error: insertDriverError } = await supabase
      .from("users")
      .insert({
        name: name,
        email: email,
        password_hash: hashedPassword,
        role: "driver",
        company_id: process.env.COMPANY_ID,
        phone: phone,
      })
      .select()
      .single();

    if (insertDriverError) {
      return res.status(400).json({ error: "Data insertion unsuccessful" });
    }

    delete insertDriver.password_hash;

    res.status(201).json({ data: insertDriver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, is_active } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updateInfo, error: updateInfoError } = await supabase
      .from("users")
      .update(updateData)
      .select("*")
      .eq("company_id", process.env.COMPANY_ID)
      .eq("id", id)
      .single();

    if (updateInfoError) {
      return res.status(400).json({ error: "Error updating Driver's info" });
    }

    res.status(200).json({ data: updateInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: driverToDelete, error: deleteDriverError } = await supabase
      .from("users")
      .update({ is_active: false })
      .eq("id", id)
      .eq("company_id", process.env.COMPANY_ID)
      .select("*")
      .single();

    if (deleteDriverError) {
      return res.status(400).json({ error: "error deleting driver" });
    }

    return res.status(200).json({ data: driverToDelete });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getDispatchers = async (req, res) => {
  try {
    const { data: dispatchersData, error: dispatchersError } = await supabase
      .from("users")
      .select("*")
      .eq("company_id", process.env.COMPANY_ID)
      .eq("role", "dispatcher");

    if (dispatchersError) {
      return res.status(400).json({ error: dispatchersError });
    }

    return res.status(200).json(dispatchersData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createDispatcher = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const { data: emailCheck } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (emailCheck) {
      return res.status(400).json({ error: "email already exist" });
    }
    const saltRounds = 10; /* No of times the password should be encrypted */

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const { data: insertDispatcher, error: insertDispatcherError } =
      await supabase
        .from("users")
        .insert({
          name: name,
          email: email,
          password_hash: hashedPassword,
          role: "dispatcher",
          company_id: process.env.COMPANY_ID,
          phone: phone,
        })
        .select()
        .single();

    if (insertDispatcherError) {
      return res.status(400).json({ error: "Data insertion unsuccessful" });
    }

    delete insertDispatcher.password_hash;

    res.status(201).json({ data: insertDispatcher });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDispatcher = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: dispatcherToDelete, error: deleteDispatcherError } =
      await supabase
        .from("users")
        .update({ is_active: false })
        .eq("id", id)
        .eq("company_id", process.env.COMPANY_ID)
        .select("*")
        .single();

    if (deleteDispatcherError) {
      return res.status(400).json({ error: "error deleting dispatcher" });
    }

    return res.status(200).json({ data: dispatcherToDelete });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    /* I only slected the status colum becaus I want to count 
    and calculate based on status. this is faster and uses less memory.
    it will return results like this 
    [
  { "status": "delivered" },
  { "status": "in_transit" },
  { "status": "failed" },
  { "status": "delivered" }
]

    */
    const { data: allDeliveries } = await supabase
      .from("deliveries")
      .select("status")
      .eq("company_id", process.env.COMPANY_ID);

    /*Getting only active drivers. using only id saves time and memory */

    const { data: activeDrivers } = await supabase
      .from("users")
      .select("id")
      .eq("company_id", process.env.COMPANY_ID)
      .eq("role", "driver")
      .eq("is_active", true);

    /*?.length — the ? means if allDeliveries is null don't crash. || 0 means if undefined use 0. */

    const total = allDeliveries?.length || 0;

    /*
    const delivered =.filter() goes through every delivery and keeps only ones where status is delivered. Then .length counts them.*/
    const delivered =
      allDeliveries?.filter((d) => d.status === "delivered").length || 0;

    const failed =
      allDeliveries?.filter((d) => d.status === "failed").length || 0;

    /*If total is 0 return 0 — avoids dividing by zero which would crash. 
      Otherwise divide delivered by total and multiply by 100 to get a percentage. Math.round removes decimals — so 93.7% becomes 94%. */
    const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    /*Returns all four calculated values to the frontend. The admin dashboard uses these to fill the stat cards.*/

    return res.status(200).json({
      totalDeliveries: total,
      activeDrivers: activeDrivers?.length || 0,
      successRate,
      failedDeliveries: failed,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { data: deliveries } = await supabase
      .from("deliveries")
      .select("status, created_at")
      .eq("company_id", process.env.COMPANY_ID);
    const statusBreakdown = {
      delivered:
        deliveries?.filter((d) => d.status === "delivered").length || 0,
      in_transit:
        deliveries?.filter((d) => d.status === "in_transit").length || 0,
      pending: deliveries?.filter((d) => d.status === "pending").length || 0,
      failed: deliveries?.filter((d) => d.status === "failed").length || 0,
    };

    const dailyMap = {};
    deliveries?.forEach((d) => {
      const date = new Date(d.created_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      dailyMap[date] = (dailyMap[date] || 0) + 1;
    });
    const dailyDeliveries = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      count,
    }));

    const hourMap = {};
    deliveries?.forEach((d) => {
      const hour = new Date(d.created_at).getHours();
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    });
    const busyHours = Object.entries(hourMap).map(([hour, count]) => ({
      hour: Number(hour),
      count,
    }));

    const total = deliveries?.length || 0;
    return res.status(200).json({
      monthTotal: total,
      onTimeRate:
        total > 0 ? Math.round((statusBreakdown.delivered / total) * 100) : 0,
      avgPerDay:
        dailyDeliveries.length > 0
          ? Math.round(total / dailyDeliveries.length)
          : 0,
      dailyDeliveries,
      statusBreakdown,
      busyHours,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  getDispatchers,
  createDispatcher,
  deleteDispatcher,
  getStats,
  getAnalytics,
};
