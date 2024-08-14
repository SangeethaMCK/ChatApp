const authHandlers = require('./authHandler');
const roomHandlers = require('./roomHandler');
const messageHandlers = require('./messageHandler');
const userHandlers = require('./userHandler');

const socketHandlers = (io) => {
  io.on("connect", (socket) => {
    console.log("A user connected");

    // Register handlers
    authHandlers(socket, io);
    roomHandlers(socket, io);
    messageHandlers(socket, io);
    userHandlers(socket, io);
  });
};

module.exports = socketHandlers;
