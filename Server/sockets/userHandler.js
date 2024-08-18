const { getUsers } = require('../utils/utils');

const userHandlers = (socket, io) => {
  socket.on("get_users", async () => {
    io.emit("update_users", await getUsers());
    
  });
};

module.exports = userHandlers;
