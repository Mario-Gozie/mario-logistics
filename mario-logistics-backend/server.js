/*
  server.js — ENTRY POINT
  
  This is the first file that runs when you start the backend.
  It imports the Express app from app.js and starts listening
  on a port (5000) for incoming requests.
  
  Think of it as the ON switch for the entire backend.
  
  To start the server: npm run dev
*/

require("dotenv").config();

const http = require("http"); // needed to create server manually for Socket.io
const { initSocket } = require("./src/config/socket"); // Socket.io setup
const app = require("./src/app");

const PORT = process.env.PORT || 5000;

const server = http.createServer(app); // create HTTP server manually
const io = initSocket(server); // attach Socket.io and get io instance back
app.set("io", io); // store io on app so any controller can access it via req.app.get('io')

server.listen(PORT, () => {
  console.log(`Mario Logistics backend running on port ${PORT}`);
});
