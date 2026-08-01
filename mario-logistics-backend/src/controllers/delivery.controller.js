/*
  controllers/delivery.controller.js — DELIVERY LOGIC
  
  This file contains all logic for creating and managing deliveries.
  This is the most important controller — the heart of the system.
  
  Think of it as the operations room where all delivery actions are processed.
  
  Functions:
  
  getDeliveries  → fetches all deliveries for this company
                   supports filtering by status, driver, date
                   supports pagination (page 1, 2, 3...)
  
  createDelivery → creates a new delivery record
                   auto-generates a tracking code (ML-XXXX)
                   sets initial status to 'pending'
  
  getDelivery    → fetches one delivery by ID with full status history
  
  updateDelivery → edits delivery details (only if still pending)
  
  assignDriver   → links a driver to a delivery
                   changes status from pending to assigned
  
  updateStatus   → driver updates delivery status
                   records the change in delivery_logs table
                   emits 'delivery:updated' event via Socket.io
                   so dispatcher sees it live
  
  uploadProof    → receives photo from driver via Multer
                   uploads it to Supabase Storage
                   saves the returned URL to the delivery record
  
  cancelDelivery → deletes a delivery (only if still pending)
*/

const supabase = require("../config/supabase");

const getDeliveries = async (req, res) => {
  try {
    const { status } = req.query;

    /*
  FOREIGN KEY JOIN — get the driver's name in one query

  Works because our schema declared: driver_id uuid REFERENCES users(id)
  Supabase reads that relationship, so it knows how to walk from a
  delivery to its driver. One query instead of N+1 lookups.

  SYNTAX: "*, driver:driver_id (name)"
    *          → all delivery columns
    driver:    → label the joined result
    driver_id  → follow this foreign key
    (name)     → bring back only the name

  SHAPE — Supabase returns driver nested:
    { tracking_code: "ML-0001", driver: { name: "Jari" } }*/

    let query = supabase
      .from("deliveries")
      .select("*,driver:driver_id(name)")
      .eq("company_id", process.env.COMPANY_ID);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: fetchedDeliveries, error: fetchedDeliveriesError } =
      await query;

    if (fetchedDeliveriesError) {
      return res.status(400).json({ error: "No deliveries" });
    }
    /*The frontend reads a flat d.driver_name, so we flatten with .map():
    { tracking_code: "ML-0001", driver_name: "Jari" }

  ...d spreads existing fields through.
  d.driver?.name guards against unassigned deliveries (driver is null).
*/
    const deliveries = fetchedDeliveries?.map((d) => ({
      ...d,
      driver_name: d.driver?.name || null,
    }));

    res.status(200).json({ deliveries });
  } catch (error) {
    res.status(400).json({ error: "No deliveries found" });
  }
};

const createDelivery = async (req, res) => {
  try {
    const {
      recipient_name,
      recipient_phone,
      address,
      notes,
      priority,
      package_count,
    } = req.body;
    const { data: existingDeliveries } = await supabase
      .from("deliveries")
      .select("id")
      .eq("company_id", process.env.COMPANY_ID);

    const count = (existingDeliveries?.length || 0) + 1;
    const tracking_code = `ML-${String(count).padStart(4, "0")}`;

    const newDelivery = {
      tracking_code,
      recipient_name,
      recipient_phone,
      address,
      notes,
      priority,
      package_count,
      company_id: process.env.COMPANY_ID,
      created_by: req.user.id,
    };

    const { data: newDeliveryData, error: insertError } = await supabase
      .from("deliveries")
      .insert(newDelivery)
      .select()
      .single();

    if (insertError) {
      return res.status(400).json({ error: "Data not saved" });
    }

    return res.status(201).json({ delivery: newDeliveryData });
  } catch (error) {
    res.status(500).json({ error: "An error creating delivery" });
  }
};

const assignDriver = async (req, res) => {
  try {
    const id = req.params.id;

    const driver_id = req.body.driver_id;

    const { data: toAssignDriver, error: toAssignDriverError } = await supabase
      .from("deliveries")
      .select("*")
      .eq("id", id)
      .single();

    if (toAssignDriverError) {
      return res.status(400).json({ error: "delivery not found" });
    }

    if (!["pending", "failed"].includes(toAssignDriver.status)) {
      return res.status(400).json({
        error: "Cannot reassign — delivery already picked up",
      });
    } else {
      const { data: updatedDelivery, error: updateError } = await supabase
        .from("deliveries")
        .update({ driver_id: driver_id })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        return res.status(400).json({ error: "Failed to assign driver" });
      }

      req.app.get("io").emit("delivery:updated", updatedDelivery);

      return res.status(200).json({ delivery: updatedDelivery });
    }
  } catch (error) {
    res.status(500).json({ error: "An error Assigning driver" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const id = req.params.id;
    const { status, note } = req.body;

    // fetch current delivery so we can log the old status
    const { data: currentDelivery, error: fetchError } = await supabase
      .from("deliveries")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) {
      return res.status(400).json({ error: "Couldn't get delivery detail" });
    }

    // build update — add a timestamp depending on the new status
    const updateData = { status };
    if (status === "in_transit") updateData.picked_up_at = new Date();
    if (status === "delivered") updateData.delivered_at = new Date();

    const { data: updated, error: updateError } = await supabase
      .from("deliveries")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: "Error updating delivery" });
    }

    // audit trail — record who changed what
    await supabase.from("delivery_logs").insert({
      delivery_id: id,
      changed_by: req.user.id,
      old_status: currentDelivery.status,
      new_status: status,
      note,
    });

    // push live update to connected dispatchers
    req.app.get("io").emit("delivery:updated", updated);

    return res.status(200).json({ delivery: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const cancelDelivery = async (req, res) => {
  try {
    const id = req.params.id;
    const { data: orderToCancel, error: orderCancelError } = await supabase
      .from("deliveries")
      .select("*")
      .eq("id", id)
      .eq("status", "pending")
      .single();

    if (orderCancelError) {
      return res
        .status(400)
        .json({ error: "No pending delivery for this customer" });
    }

    const { data: deletedData, error: deleteError } = await supabase
      .from("deliveries")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return res.status(400).json({ error: "Data not deleted" });
    }

    return res.status(200).json({ message: "Delivery cancelled successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const uploadProof = async (req, res) => {
  try {
    const id = req.params.id;

    if (!req.file) {
      return res.status(400).json({ error: "No photo uploaded" });
    }

    const fileExt = req.file.originalname.split(".").pop();
    const fileName = `${id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("delivery_proofs")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) {
      return res.status(400).json({ error: "Failed to upload photo" });
    }

    const { data: publicUrlData } = supabase.storage
      .from("delivery_proofs")
      .getPublicUrl(fileName);

    const photoUrl = publicUrlData.publicUrl;

    const { data: updated, error: updateError } = await supabase
      .from("deliveries")
      .update({ proof_photo_url: photoUrl })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: "Failed to save photo URL" });
    }

    req.app.get("io").emit("delivery:updated", updated);

    return res.status(200).json({ delivery: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = {
  getDeliveries,
  createDelivery,
  assignDriver,
  updateStatus,
  cancelDelivery,
  uploadProof,
};
