const http = require('http');
const socketio = require('socket.io');


const port = 3000;
const server = http.createServer();
const io = socketio(server, {
  cors: {
    origin: '*',
  },
});


const rooms = {};
const users = [];

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

io.on('connection', (socket) => {
  console.log('A user connected');


  // Handle user login
  socket.on('login', (data) => {
    console.log('login', data, socket.id);
    if (data.username) {
      users.push({
        userID: socket.id,
        username: data.username,
      });
      users1.insertOne(data);
      console.log('users', users);
    } else {
      socket.emit('error', 'Username is required');
    }
  });

  // Get user list
  socket.on('get_users', () => {
    io.emit('update_users', users);
  });

  // Handle private messages
  socket.on('private_message', ({ content, to, from }) => {
    console.log('private_message', { content, to });

    const recipient = users.find((user) => user.username === to);
    if (recipient) {
      socket.to(recipient.userID).emit('private_message', { content, from, to });
    } else {
      socket.emit('error', 'User not found');
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    const index = users.findIndex((user) => user.userID === socket.id);
    if (index !== -1) {
      // Remove user from all rooms
      for (const [roomName, userIDs] of Object.entries(rooms)) {
        const userIndex = userIDs.indexOf(socket.id);
        if (userIndex !== -1) {
          userIDs.splice(userIndex, 1);   // Remove user from room
          if (userIDs.length === 0) {
            delete rooms[roomName];   // Delete room if no users left
          }
        }
      }
      users.splice(index, 1);
    }
    console.log('users', users);
    io.emit('update_users', users);
  });

  // Handle room creation
  socket.on('create_room', (roomName) => {
    if (!rooms[roomName]) {
      rooms[roomName] = [];
    }
    rooms[roomName].push(socket.id);
    socket.join(roomName);
    console.log('rooms', rooms);
    console.log(`${socket.id} joined room ${roomName}`);
  });


  socket.on('get_rooms', (username ) => {
    console.log('get_rooms', username);
    const socketName = users.find((user) => user.username === username);
    console.log('socketName', socketName);
    if (socketName) {
    const socketid = socketName.userID;
    const roomsWithUser = Object.keys(rooms).filter(roomName => rooms[roomName].includes(socketid));
    io.to(socketid).emit('update_roomList', roomsWithUser);
    }
  });

  socket.on('add_friend', ({ roomName, friendUsername }) => {
    console.log('add_friend', roomName, friendUsername);
    const socketName = users.find((user) => user.username === friendUsername);
    const friendid = socketName.userID;
    rooms[roomName].push(friendid);
    console.log('rooms', rooms);
    const roomsWithUser = Object.keys(rooms).filter(roomName => rooms[roomName].includes(friendid));
    io.to(friendid).emit('update_roomList', roomsWithUser);
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