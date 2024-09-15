import authHandlers from './authHandler.js';
import roomHandlers from './roomHandler.js';
import messageHandlers from './messageHandler.js';
import userHandlers from './userHandler.js';

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

export default socketHandlers;
