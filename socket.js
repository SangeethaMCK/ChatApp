const http = require('http');
const socketio = require('socket.io');

const port = 3000;
const server = http.createServer();
const io = socketio(server, {
  cors: {
    origin: '*', // Allow all origins for development. Update this for production.
    methods: ["GET", "POST"]
  }
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('message', (msg) => {
    console.log(`Message received: ${msg}`);
    io.emit('message', msg);  // Send the message to all connected clients
  }); 

  io.on('disconnect', () => {
    console.log('A user disconnected');
  });
});
