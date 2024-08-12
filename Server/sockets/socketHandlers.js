const UserModel = require("../models/users");
const RoomModel = require("../models/rooms");
const MessageModel = require("../models/message");
const SessionModel = require("../models/session");
const uuid = require("uuid");
const sessionValidity = 1000 * 60 * 60 * 24 * 7;

const updateUsers = async () => UserModel.find();
const updateRooms = async () => RoomModel.find();

const socketio = (io) => {
 
io.on("connect", (socket) => {
  console.log("A user connected");
   

  socket.on("existingCookie", async (cookie, username, recipient) => {
    try {
      const existingSession = await SessionModel.findOne({ sessionId: cookie });
      if (existingSession) {
        const user = await UserModel.findOne({ userId: existingSession.userId });
        const appUsers = await updateUsers(); // Assuming updateUsers() returns a list of active users
        
        if (user && 
            (!username || username === user.username) &&
            (!recipient || appUsers.some(u => u.username === recipient))
        ) {
          socket.userId = user.userId;
          socket.username = user.username;
          socket.emit("login_existUser", user.username, recipient);
        } else {
          socket.emit("login_existUser", "", "");
        }
      } else {
        socket.emit("login_existUser", "", "");
      }
    } catch (error) {
      console.error("Error during existing cookie check", error);
      socket.emit("error", "Error during authorization");
    }
  });
  
  
  
  socket.on("login", async (data) => {
    try {
      const { username, password } = data;
      const user = await UserModel.findOne({ username: username.trim() });
      if (user && user.password === password.trim()) {
        let session = await SessionModel.findOne({ userId: user.userId });
        if (!session || session.expires < Date.now()) {
          if (session) await SessionModel.deleteOne({ userId: user.userId });
          const sessionId = uuid.v4();
          session = new SessionModel({
            sessionId,
            userId: user.userId,
            expires: Date.now() + sessionValidity,
          });
          await session.save();
        }
        socket.userId = user.userId;
        socket.username = user.username;
        socket.emit("login_success", session.sessionId);
        io.emit("update_users", await updateUsers());
      } else {
        socket.emit("error", "Incorrect username or password");
      }
    } catch (error) {
      console.error("Error during login", error);
      socket.emit("error", "Error during login");
    }
  });
  

  socket.on("signup", async (data) => {
    try {
      let user = await UserModel.findOne({ username: data.username.trim() });
      if (user) {
        socket.emit("error", "Username already exists");
      } else {
        user = new UserModel({
          userId: uuid.v4(),
          username: data.username.trim(),
          password: data.password.trim(),
          email: data.email.trim(),
        });
        await user.save();
        socket.emit("signup_success");
        io.emit("update_users", await updateUsers());
      }
    } catch (err) {
      console.error("Error during signup", err);
      socket.emit("error", "Error during signup");
    }
  });

 socket.on("login", async (data) => {
  try {
    const username = data.username.trim();
    const password = data.password.trim();

    const user = await UserModel.findOne({ username });
    
    if (user && user.password === password) {
      let session = await SessionModel.findOne({ userId: user.userId });

      if (!session || session.expires < Date.now()) {
        if (session) await SessionModel.deleteOne({ userId: user.userId });

        const sessionId = uuid.v4();
        session = new SessionModel({
          sessionId,
          userId: user.userId,
          expires: Date.now() + sessionValidity,
        });

        await session.save();

        socket.userId = user.userId;
        socket.username = user.username;
        
        socket.emit("login_success", session.sessionId);

        io.emit("update_users", await updateUsers());
      } else {
        socket.emit("login_success", session.sessionId);
      }
    } else {
      socket.emit("error", "Incorrect username or password");
    }
  } catch (err) {
    console.error("Error during login", err);
    socket.emit("error", "Error during login");
  }
});


  socket.on("get_users", async () => {
    io.emit("update_users", await updateUsers());
  });

  socket.on("get_msgs", async ({ to, from }) => {
    try {
      const messages = await MessageModel.find({
        $or: [
          // check if either user is the sender or recipient
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
      const recipient = await UserModel.findOne({ username: to });
      if (recipient) {
        await MessageModel.create({
          messageId: uuid.v4(),
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
        if (user) {
          room = new RoomModel({
            roomId: uuid.v4(),
            name: roomName,
            users: [user.userId],
          });
          await room.save();
          io.emit(
            "update_roomList",
            (await updateRooms()).map((r) => r.name)
          );
        } else {
          socket.emit("error", "User not found");
        }
      }
    } catch (err) {
      socket.emit("error", "Error creating room");
    }
  });

  socket.on("get_rooms", async (username) => {
    try {
      const user = await UserModel.findOne({ username });
      if (user) {
        const userRooms = await RoomModel.find({ users: user.userId });
        socket.emit(
          "update_roomList",
          userRooms.map((room) => room.name)
        );
      } else {
        socket.emit("error", "User not found");
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
        if (room && !room.users.includes(friend.userId)) {
          room.users.push(friend.userId);
          await room.save();
          io.emit(
            "update_roomList",
            (await updateRooms()).map((r) => r.name)
          );

          const roomMembers = await UserModel.find({
            userId: { $in: room.users },
          });
          socket.emit(
            "room_members",
            roomMembers.map((roomMember) => roomMember.username)
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

      const roomDetails = await RoomModel.findOne({ name: roomName });
      if (roomDetails) {
        const roomMembersIds = roomDetails.users;
        const roomMembersDetails = await UserModel.find({
          userId: { $in: roomMembersIds },
        });
        const roomMember = roomMembersDetails.map(
          (roomMembersDetail) => roomMembersDetail.username
        );
        socket.emit("room_members", roomMember);
      } else {
        socket.emit("error", "Room not found");
      }
    } catch (err) {
      socket.emit("error", "Error fetching room messages");
    }
  });

  socket.on("room_message", async ({ content, roomName, from }) => {
    try {
      await MessageModel.create({
        messageId: uuid.v4(),
        message: content,
        user: from,
        room: roomName,
      });
      socket.to(roomName).emit("room_message", { content, from, roomName });
    } catch (err) {
      socket.emit("error", "Error saving room message");
    }
  });

  socket.on("logout", async () => {
    console.log("logout");
    await SessionModel.deleteOne({ userId: socket.userId });

    io.emit("update_users", await updateUsers());
    socket.disconnect();
  });

  socket.on("disconnect", async () => {
    try {
      if (socket.userId) {
        console.log("disconnect");
        // await SessionModel.deleteOne({ userId: socket.userId });

        io.emit("update_users", await updateUsers());
      }
      socket.disconnect();
    } catch (err) {
      console.error("Error updating user on logout", err);
      socket.emit("error", "Error updating user on logout");
    }
  });
});
};  

module.exports = socketio;