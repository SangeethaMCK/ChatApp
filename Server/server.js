// Importing required modules
const http = require("http");
const socketio = require("socket.io");
const express = require("express");
const mongoose = require("mongoose");
const uuid = require("uuid");
const sharedsession = require("socket.io-express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Importing custom modules
const sessionMiddleware = require("./config/session");
const connectDB = require("./config/db");
const socketHandlers = require("./sockets/socketHandlers");
const cookieRoutes = require("./routes/cookieRoutes");

// App and server setup
const app = express();
const server = http.createServer(app);
const port = 3000;

// Middleware configuration
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser(process.env.cookieSecret));
app.use(sessionMiddleware);

// Routes
app.use("/", cookieRoutes);

// Socket.IO setup with shared session
const io = socketio(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

io.use(
  sharedsession(sessionMiddleware, {
    autoSave: true,
  })
);

// Socket handlers
socketHandlers(io);

// Start server and connect to database
server.listen(port, () => console.log(`Server running on port ${port}`));
connectDB();
