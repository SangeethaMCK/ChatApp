// Importing required modules
import http from "http";
import {Server as socketio}  from "socket.io"; // for ES6 modules
import express from "express";
import mongoose from "mongoose";
import { v4 as uuid } from "uuid"; // For importing specific functions from uuid
import sharedsession from "socket.io-express-session";
import cors from "cors";
import cookieParser from "cookie-parser";

// Importing custom modules
import sessionMiddleware from "./config/session.js";
import {connectDB} from "./config/db.js";
import socketHandlers from "./sockets/socketHandlers.js";
import cookieRoutes from "./routes/cookieRoutes.js";

// App and server setup
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

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
const io = new socketio(server, {
  cors: {
    origin: 'http://localhost:5173',
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