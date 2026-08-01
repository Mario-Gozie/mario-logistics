/*
  config/socket.js — SOCKET.IO SETUP

  This file sets up Socket.io for real time communication.
  It does NOT update the database — it only pushes UI updates
  to connected browsers when something changes.

  Think of it as a walkie talkie between backend and dispatcher's browser.
*/

const { Server } = require("socket.io"); // import the Server class from socket.io

let io; // empty box — will hold the socket.io instance once created

const initSocket = (server) => {
  // takes your HTTP server as argument

  io = new Server(server, {
    // attach socket.io to your HTTP server
    cors: {
      origin: [
        // which frontend ports are allowed to connect
        "http://localhost:3001", // admin app
        "http://localhost:3002", // dispatcher app
        "http://localhost:3003", // driver app
        "https://mario-logistics.vercel.app",
        "https://mario-logistics-dispatcher.vercel.app",
        "https://mario-logistics-driver.vercel.app",
      ],
      credentials: true, // allow auth headers and cookies
    },
  });

  io.on("connection", (socket) => {
    // runs every time a browser connects
    console.log("Client connected:", socket.id); // log who connected

    socket.on("disconnect", () => {
      // runs when browser disconnects
      console.log("Client disconnected:", socket.id); // log who left
    });
  });

  return io; // return the instance in case server.js needs it
};

const getIO = () => io; // getter — any file calls this to get the io instance

module.exports = { initSocket, getIO }; // export both functions
