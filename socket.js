const http = require('http');
const socketio = require('socket.io');

const port = 3000;
const server = http.createServer();
const io = socketio(server, {
  cors: {
    origin: '*',
  },
});
const users = {};

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle login event
  socket.on('login', (data) => {
    console.log('login', data);
    users[socket.id] = data.username;
    io.emit('update_users', Object.values(users));
  });

  // Handle regular messages
  socket.on('message', (msg) => {
    console.log(`Message received: ${msg}`);
    io.emit('message', msg); // Send the message to all connected clients
  });

  // Handle private messages
  socket.on('private_message', (data) => {
    const { recipientUsername, message } = data;

    // Find the recipient's socket ID
    const recipientSocketId = Object.keys(users).find(socketId => users[socketId] === recipientUsername);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('private_message', { sender: users[socket.id], message });
    } else {
      socket.emit('error', 'User not found');
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    delete users[socket.id];
    io.emit('update_users', Object.values(users));
  });
});
