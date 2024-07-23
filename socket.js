const http = require('http');
const socketio = require('socket.io');

const port = 3001;
const server = http.createServer();
const io = socketio(server, {
  cors: {
    origin: '*',
  },
});

const users = [];
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.broadcast.emit("user connected", {
    userID: socket.id,
    username: socket.username,
  });

  // Handle login event
  socket.on('login', (data) => {
    console.log('login', data);
    if (data.username) {
      users.push({
        userID: socket.id,
        username: data.username,
      });
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
  socket.on('private_message', ({ content, to , from }) => {
    console.log("private_message", { content, to });

    const recipient = users.find(user => user.username === to);
    if (recipient) {
      socket.to(recipient.userID).emit('private_message', {
        content,
        from: from,
      });
    } else {
      socket.emit('error', 'User not found');
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    const index = users.findIndex(user => user.userID === socket.id);
    if (index !== -1) {
      users.splice(index, 1);
    }
    io.emit('update_users', users);
  });
});
