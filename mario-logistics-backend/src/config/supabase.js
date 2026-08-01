/*
  config/supabase.js — DATABASE CONNECTION
  
  This file creates the connection to your Supabase database.
  It reads your SUPABASE_URL and SUPABASE_KEY from the .env file
  and creates a Supabase client that all other files can import and use.
  
  Think of it as the phone line between your backend and your database.
  
  This file is written once and never changed.
  Every controller imports this to query the database.
*/

// require("dotenv").config(); //load .env file

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
