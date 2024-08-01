const http = require("http");
const socketio = require("socket.io");
const express = require("express");
const mongoose = require("mongoose");

const port = 3003;
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: "*" },
});

// MongoDB schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: String,
  socketid: { type: String, unique: true },
  connection: { type: Boolean, default: false },
});

const RoomSchema = new mongoose.Schema({
  name: String,
  users: [String],
});

const MessageSchema = new mongoose.Schema({
  message: String,
  room: String,
  user: String,
  recipient: String,
});

// MongoDB models
const UserModel = mongoose.model("User", UserSchema);
const RoomModel = mongoose.model("Room", RoomSchema);
const MessageModel = mongoose.model("Message", MessageSchema);

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/ChatApp")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

server.listen(port, () => {
  console.log(`Socket.io server is listening on port ${port}`);
});

// Variables
let rooms = [];
let users = [];

// Update functions
const updateUsers = async () => (users = await UserModel.find());
const updateRooms = async () => (rooms = await RoomModel.find());

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("login", async (data) => {
    if (data.username) {
      try {
        let user = await UserModel.findOne({ username: data.username });
        if (user) {
          user.connection = true;
          await user.save();
        } else {
          user = new UserModel({
            username: data.username,
            socketid: socket.id,
            password: data.password,
            connection: true,
          });
          await user.save();
        }
        socket.username = data.username;
        await updateUsers();
      } catch (err) {
        socket.emit("error", "Error saving user to database");
      }
    } else {
      socket.emit("error", "Username is required");
    }
  });

  socket.on("get_users", async () => {
    await updateUsers();
    io.emit("update_users", users);
  });

  socket.on("get_msgs", async ({ to, from }) => {
    try {
      const messages = await MessageModel.find({
        $or: [
          { $and: [{ user: from }, { recipient: to }] },
          { $and: [{ user: to }, { recipient: from }] },
        ],
      });
      socket.emit("messages", messages);
    } catch (err) {
      socket.emit("error", "Error fetching private messages");
    }
  });

  socket.on("private_message", async ({ content, to, from }) => {
    try {
      const recipient = users.find((user) => user.username === to);
      if (recipient) {
        await MessageModel.create({
          message: content,
          user: from,
          recipient: to,
          room: null,
        });
        io.emit("pvt_message", { content, from, to });
      } else {
        socket.emit("error", "User not found");
      }
    } catch (err) {
      socket.emit("error", "Error saving private message");
    }
  });

  socket.on("disconnect", async () => {
    try {
      const user = await UserModel.findOne({ username: socket.username });
      if (user) {
        user.connection = false;
        await user.save();
      }
      await updateUsers();
      io.emit("update_users", users);
    } catch (err) {
      socket.emit("error", "Error updating user on disconnect");
    }
  });

  socket.on("create_room", async (roomName, username) => {
    try {
      let room = await RoomModel.findOne({ name: roomName });
      if (room) {
        socket.emit("error", "Room already exists");
      } else {
        const user = await UserModel.findOne({ username });
        room = new RoomModel({ name: roomName, users: [user.socketid] });
        await room.save();
        console.log("New room created", room);
        await updateRooms();
        const userRooms = await RoomModel.find({ users: user.socketid });
        const roomNames = userRooms.map((room) => room.name);
        socket.emit("update_roomList", roomNames);
      }
    } catch (err) {
      socket.emit("error", "Error creating room");
    }
  });

  socket.on("get_rooms", async (username) => {
    try {
      const user = await UserModel.findOne({ username });
      if (user) {
        const userRooms = await RoomModel.find({ users: user.socketid });
        const roomNames = userRooms.map((room) => room.name);
        // console.log(roomNames);
        socket.emit("update_roomList", roomNames);
      }
    } catch (err) {
      socket.emit("error", "Error fetching rooms");
    }
  });

  socket.on("add_friend", async ({ roomName, friendUsername }) => {
    try {
      const friend = await UserModel.findOne({ username: friendUsername });
      const friendSocketId = friend.socketid;
      if (friend) {
        const room = await RoomModel.findOne({ name: roomName });
        if (room && !room.users.includes(friendSocketId)) {
          room.users.push(friend.socketid);
          await room.save();
          const roomsWithUser = await RoomModel.find({
            users: friendSocketId,
          });
          const roomsWithUserNames = roomsWithUser.map((room) => room.name);
          console.log("roomsWithUserNames", roomsWithUserNames);
          io.to(friendSocketId).emit(
            "update_roomList",
            roomsWithUserNames
          );
        } else {
          socket.emit("error", "Room does not exist or user already in room");
        }
      } else {
        socket.emit("error", "User not found");
      }
    } catch (err) {
      socket.emit("error", "Error adding friend to room");
    }
  });

  socket.on("join_room", (roomName) => {
    socket.join(roomName);
  });

  socket.on("get_roomMsgs", async ({ roomName }) => {
    try {
      const messages = await MessageModel.find({ room: roomName });
      socket.emit("room_messages", messages);
    } catch (err) {
      socket.emit("error", "Error fetching room messages");
    }
  });

  socket.on("room_message", async ({ content, roomName, from }) => {
    try {
      await MessageModel.create({
        message: content,
        user: from,
        recipient: null,
        room: roomName,
      });
      socket.to(roomName).emit("room_message", { content, from, roomName });
    } catch (err) {
      socket.emit("error", "Error saving room message");
    }
  });
});
