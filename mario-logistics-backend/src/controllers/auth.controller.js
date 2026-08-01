/*
  controllers/auth.controller.js — AUTHENTICATION LOGIC

  This file contains the actual logic for user authentication.
  This is where real work happens — database queries, password
  hashing, token generation.

  Think of it as the receptionist who actually processes your request.

  REGISTER FUNCTION:
  - Reads name, email, password, role, phone from req.body
  - Checks if email already exists in database → 400 if yes
  - Hashes password using bcrypt (saltRounds: 10)
  - Inserts new user into Supabase users table
  - Deletes password_hash before sending response
  - Returns created user with 201 status

  LOGIN FUNCTION (coming next):
  - Finds user by email in database
  - Compares submitted password with stored hash using bcrypt
  - If correct, creates and returns a JWT token + user object
  - If wrong, returns 401 error

  ME FUNCTION (coming after login):
  - Reads req.user set by auth middleware
  - Returns the currently logged in user's details

  STATUS CODES USED:
  - 201 → resource created successfully
  - 400 → bad request (email exists, insert failed)
  - 401 → unauthorized (wrong password)
  - 500 → something unexpected went wrong

  Exports: { register, login, me }
*/

const bcrypt = require("bcryptjs");

const supabase = require("../config/supabase");

const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  try {
    const { data: existingUser, checkError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: "email already exist" });
    }

    const saltRounds = 10; /* No of times the password should be encrypted */

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        name: name,
        email: email,
        password_hash: hashedPassword,
        role: role,
        company_id: process.env.COMPANY_ID,
        phone: phone,
      })
      .select()
      .single();

    if (insertError) {
      return res.status(400).json({ error: "data insertion unsuccessful" });
    }

    delete newUser.password_hash; // Password shouldn't be shared with frontend so I need to delete

    res.status(201).json({ user: newUser }); // sending who is login in to the front end.
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const { data: dataLoginFetched, error: errorLoginFetch } = await supabase
      .from("users")
      .select("id, name, email, phone, role, password_hash")
      .eq("email", email)
      .single();

    if (errorLoginFetch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      dataLoginFetched.password_hash,
    );

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    delete dataLoginFetched.password_hash;

    const token = jwt.sign(
      {
        id: dataLoginFetched.id,
        name: dataLoginFetched.name,
        role: dataLoginFetched.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({ token, user: dataLoginFetched });
  } catch (error) {
    res.status(400).json({ error: "An error was encountered" });
  }
};

const me = (req, res) => {
  return res.status(200).json({ user: req.user });
};

module.exports = { register, login, me };
