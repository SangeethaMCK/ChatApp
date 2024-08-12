const http = require("http");
const socketio = require("socket.io");
const express = require("express");
const mongoose = require("mongoose");
const uuid = require("uuid");
const sharedsession = require("socket.io-express-session");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const sessionMiddleware = require("./config/session");
const connectDB = require("./config/db");
const socketHandlers = require("./sockets/socketHandlers");
const cookieRoutes = require("./routes/cookieRoutes");

const port = 3000;
const app = express();
const server = http.createServer(app);

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser(process.env.cookieSecret));
app.use(sessionMiddleware);

// Use the cookie routes
app.use("/", cookieRoutes);

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

socketHandlers(io);

server.listen(port, () => console.log(`Server running on port ${port}`));

connectDB();
