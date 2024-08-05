const http = require("http");
const socketio = require("socket.io");
const express = require("express");
const mongoose = require("mongoose");
const exp = require("constants");
const uuid = require("uuid");

const port = 3001;
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: "*" },
});
const sessionValidity = 7 * 24 * 60 * 60 * 1000;

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true },
  userId: { type: String, unique: true },
  expires: { type: Date, default: Date.now },
});
// MongoDB schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: String,
  socketid: { type: String, unique: true },
  email: String,
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
const SessionModel = mongoose.model("Session", SessionSchema);

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/ChatApp")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

server.listen(port, () => {
  console.log(`Socket.io server is listening on port ${port}`);
});

// Helper functions
const updateUsers = async () => UserModel.find();
const updateRooms = async () => RoomModel.find();

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("signup", async (data) => {
    try {
      let user = await UserModel.findOne({ username: data.username.trim() });
      if (user) {
        socket.emit("error", "Username already exists");
      } else {
        user = new UserModel({
          username: data.username.trim(),
          socketid: socket.id,
          password: data.password.trim(),
          email: data.email.trim(),
          connection: false,
        });
        await user.save();
        socket.emit("signup_success");
      }
      io.emit("update_users", await updateUsers());
    } catch (err) {
      socket.emit("error", "Error saving user to database");
    }
  });

  socket.on("login", async (data) => {
    try {
      const user = await UserModel.findOne({ username: data.username.trim() });
      if (user) {
        if (user.password === data.password.trim()) {
          if (!user.connection) {
            const sessionId = uuid.v4();
            const session = new SessionModel({
              sessionId,
              userId: user.socketid,
              expires: new Date(Date.now() + sessionValidity),
            });
            console.log(session);
            user.connection = true;
            await user.save();
            socket.username = data.username.trim();

            io.emit("update_users", await updateUsers());
            socket.emit("login_success");
          } else {
            socket.emit("error", "User already logged in");
          }
        } else {
          socket.emit("error", "Incorrect password");
        }
      } else {
        socket.emit("error", "Username not found");
      }
    } catch (err) {
      socket.emit("error", "Error saving user to database");
    }
  });

  socket.on("get_users", async () => {
    io.emit("update_users", await updateUsers());
  });

  socket.on("get_msgs", async ({ to, from }) => {
    try {
      const messages = await MessageModel.find({
        $or: [
          { $and: [{ user: from }, { recipient: to }] },
          { $and: [{ user: to }, { recipient: from }] },
        ],
      });
      console.log(messages.map((m) => m._id));
      socket.emit("messages", messages);
    } catch (err) {
      socket.emit("error", "Error fetching private messages");
    }
  });

  socket.on("private_message", async ({ content, to, from }) => {
    try {
      const recipient = await UserModel.findOne({ username: to });
      if (recipient) {
        await MessageModel.create({
          message: content,
          user: from,
          recipient: to,
        });
        io.emit("pvt_message", { content, from, to });
      } else {
        socket.emit("error", "User not found");
      }
    } catch (err) {
      socket.emit("error", "Error saving private message");
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
        io.emit(
          "update_roomList",
          (await updateRooms()).map((r) => r.name)
        );
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
        socket.emit(
          "update_roomList",
          userRooms.map((room) => room.name)
        );
      }
    } catch (err) {
      socket.emit("error", "Error fetching rooms");
    }
  });

  socket.on("add_friend", async ({ roomName, friendUsername }) => {
    try {
      const friend = await UserModel.findOne({ username: friendUsername });
      if (friend) {
        const room = await RoomModel.findOne({ name: roomName });
        if (room && !room.users.includes(friend.socketid)) {
          room.users.push(friend.socketid);
          await room.save();
          io.emit(
            "update_roomList",
            (await updateRooms()).map((r) => r.name)
          );
          roomMembers = await UserModel.find({ socketid: { $in: room.users } });
          socket.emit("room_members", room.users);
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

      const roomDetails = await RoomModel.findOne({ name: roomName });
      const roomMembersIds = roomDetails.users;
      const roomMembersDetails = await UserModel.find({
        socketid: { $in: roomMembersIds },
      });
      const roomMembers = roomMembersDetails.map((user) => user.username);
      socket.emit("room_members", roomMembers);
    } catch (err) {
      socket.emit("error", "Error fetching room messages");
    }
  });

  socket.on("room_message", async ({ content, roomName, from }) => {
    try {
      await MessageModel.create({
        message: content,
        user: from,
        room: roomName,
      });
      socket.to(roomName).emit("room_message", { content, from, roomName });
    } catch (err) {
      socket.emit("error", "Error saving room message");
    }
  });

  // socket.on("new_msg", async (id, username, recipient) => {
  //   socket.emit("new_msg", id, username, recipient);
  // })

  socket.on("disconnect", async () => {
    try {
      const user = await UserModel.findOne({ username: socket.username });
      if (user) {
        user.connection = false;
        await user.save();
        io.emit("update_users", await updateUsers());
      }
    } catch (err) {
      console.error("Error updating user on disconnect", err);
    }
  });
});
