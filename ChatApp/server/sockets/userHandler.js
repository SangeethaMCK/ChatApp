import { getUsers } from '../utils/utils.js';

const userHandlers = (socket, io) => {
  socket.on("get_users", async () => {
    io.emit("update_users", await getUsers());
    
  });
};

export default userHandlers;