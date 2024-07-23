const http = require('http');
const socketio = require('socket.io');

const port = 3000;
const server = http.createServer();
const io = socketio(server, {
  cors: {
    origin: '*',
  },
});

const users = {}; // Store users with their socket IDs

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle login event
  socket.on('login', (data) => {
    console.log('login', data);
    if (data.username) {
      users[socket.id] = data.username;
      console.log("users", users);
      io.emit('update_users', users);
    } else {
      socket.emit('error', 'Username is required');
    }
  });

  // Handle regular messages
  socket.on('message', (msg) => {
    console.log(`Message received: ${msg}`);
    io.emit('message', msg); // Broadcast message to all clients
  });

  // Handle private messages
  socket.on('private_message', ({ content, to }) => {
    console.log("private_message", { content, to });
    const recipientSocketId = Object.keys(users).find(socketId => users[socketId] === to);
    console.log("recipientSocketId", recipientSocketId);

    if (recipientSocketId) {
      socket.to(recipientSocketId).emit('private_message_data', {
        content,
        from: socket.id,
      });
    } else {
      socket.emit('error', 'User not found');
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    delete users[socket.id];
    io.emit('update_users', users);
  });
});
