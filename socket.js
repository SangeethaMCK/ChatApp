const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const mongoose = require('mongoose');

const port = 3003;
const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
  },
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  password: String,
  socketid: { type: String, unique: true }, 
  connection: { type: Boolean, default: false }
});

const RoomSchema = new mongoose.Schema({
  name: String,
  users: [String] 
});

const UserModel = mongoose.model('User', UserSchema);
const RoomModel = mongoose.model('Room', RoomSchema);

mongoose.connect("mongodb://localhost:27017/ChatApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB', err));

app.listen(3002, () => {
  console.log("Express server is listening on port 3002");
}); 

server.listen(port, () => {
  console.log(`Socket.io server is listening on port ${port}`);
});

let rooms = [];
let users = [];

const updateUsers = async () => {
  users = await UserModel.find(); 
};

const updateRooms = async () => {
  rooms = await RoomModel.find();
};

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('login', async (data) => {
    console.log('login', data, socket.id);
    if (data.username) {
      try {
        let user = await UserModel.findOne({ username: data.username });
        if (user) {
          // User exists, update socketid if not already set
          if (user.socketid !== socket.id) {
            user.connection = true;
            await user.save();
          }
          console.log("User logged in");
        } else {
          // Create a new user
          user = new UserModel({ username: data.username, socketid: socket.id, password: data.password, connection: true });
          await user.save();
          console.log("New user created");
        }
        socket.username = data.username;
        await updateUsers();
      } catch (err) {
        console.error(err);
        socket.emit('error', 'Error saving user to database');
      }
    } else {
      socket.emit('error', 'Username is required');
    }
  });

  socket.on('get_users', async () => {
    await updateUsers();
    io.emit('update_users', users);
  });

  socket.on('private_message', ({ content, to, from }) => {
    console.log('private_message', { content, to });
    const recipient = users.find((user) => user.username === to);
    if (recipient) {
      socket.to(recipient.socketid).emit('private_message', { content, from, to });
    } else {
      socket.emit('error', 'User not found');
    }
  });

  socket.on('disconnect', async () => {
    try {
      const user = await UserModel.findOne({ username : socket.username });
       if (user) {
        user.connection = false;
        await user.save();
      }
      await updateUsers();
    } catch (err) {
      console.error('Error updating user on disconnect', err);
    }
    console.log('users after disconnect', users);
    io.emit('update_users', users);
  });

  socket.on('create_room', async (roomName, username) => {
    try {
      let room = await RoomModel.findOne({ name: roomName });
      let user = await UserModel.findOne({ username: username });
      console.log("user in create room", user)
      if (room) {
        console.log('Room already exists');
      } else {
        room = new RoomModel({ name: roomName, users: [user.socketid] });
        await room.save();
        console.log('New room created');
      }
      await updateRooms();
      console.log('Rooms after create', rooms);
    } catch (err) {
      console.error(err);
      socket.emit('error', 'Error saving room to database');
    }
  });
  
  socket.on('get_rooms', async (username) => {
    await updateRooms();
    console.log('get_rooms', username, rooms);
    const socketName = await UserModel.findOne({ username: username });
    console.log('socketName', socketName);
    if (socketName) {
      const socketid = socketName.socketid;
      console.log('socketid', socketid);
      const userRooms = await RoomModel.find({ users: socketid });
      console.log('userRooms', userRooms);
      const roomNames = userRooms.map(room => room.name);
      console.log('roomNames', roomNames);
      socket.emit('update_roomList', roomNames);
    }
  });
  
  socket.on('add_friend', async ({ roomName, friendUsername }) => {
    console.log('add_friend', roomName, friendUsername);
    try {
      const friend = await UserModel.findOne({ username: friendUsername });
      if (friend) {
        const friendid = friend.socketid;
        const room = await RoomModel.findOne({ name: roomName });
        if (room) {
          if (!room.users.includes(friendid)) {
            room.users.push(friendid);
            await room.save();
            console.log('Friend added to room');
            const roomsWithUser = await RoomModel.find({ users: friendid });
            const roomsWithUserNames = roomsWithUser.map(room => room.name);
            io.to(friendid).emit('update_roomList', roomsWithUserNames);
          }
        } else {
          socket.emit('error', 'Room does not exist');
        }
      } else {
        socket.emit('error', 'User not found');
      }
    } catch (err) {
      console.error(err);
      socket.emit('error', 'Error adding friend to room');
    }
  });
  

  socket.on('room_message', ({ content, roomName, from }) => {
    console.log('room_message', content, roomName, from);
    socket.to(roomName).emit('room_message', { content, from });
  });

  socket.on('join_room', (roomName) => {
    console.log('join_room', roomName);
    socket.join(roomName);
  });
});
