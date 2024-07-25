const http = require('http');
const socketio = require('socket.io');

const port = 3001;
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
 
  socket.join("myRoom");

  // Handle login event
  socket.on('login', (data) => {
    console.log('login', data);
    if (data.username) {
      users.push({
        userID: socket.id,
        username: data.username,
      });
    } else {
      socket.emit('error', 'Username is required');
    }
  });
  socket.on('get_users', () => {
    io.emit('update_users', users);

  });

  // Handle regular messages
  socket.on('message', (msg) => {
    console.log(`Message received in room: ${msg}`);
    socket.broadcast.to("myRoom").emit('message', msg); // Broadcast message to all clients except the sender
  // io.to("myRoom").emit('message', msg); // Broadcast message to all clients except the sender
  });

  // Handle private messages
  socket.on('private_message', ({ content, to , from }) => {
    console.log("private_message", { content, to });

    const recipient = users.find(user => user.username === to);
    if (recipient) {
      socket.to(recipient.userID).emit('private_message', {
        content,
        from,
      }, ()=>{
        console.log("responses");
      });
    } else {
      socket.emit('error', 'User not found');
    }
  });

  socket.join("join_room", (roomName) => {
    socket.join(roomName);
  if(!rooms[roomName]) {
    rooms[roomName] = [];
  }
  rooms[roomName].push(socket.id);
  console.log("rooms", rooms);
  console.log(`${socket.id} joined room ${roomName}`);
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    const index = users.findIndex(user => user.userID === socket.id);
    if (index !== -1) {
      users.splice(index, 1);
    }
    console.log("users", users);
    io.emit('update_users', users);
  });
});
