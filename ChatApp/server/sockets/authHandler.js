import { handleError, getUsers, sessionValidity, getRooms } from '../utils/utils.js';
import UserModel from '../models/users.js';
import SessionModel from '../models/session.js';
import RoomModel from '../models/rooms.js'; 
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';

const authHandlers = (socket, io) => {
  socket.on("existingCookie", async (cookieId, username, recipient) => {
    try {
      const existingSession = await SessionModel.findOne({ sessionId: cookieId });
      if (!existingSession) {
        socket.emit("login_existUser", "", "");
        return;
      }
      const user = await UserModel.findOne({ userId: existingSession.userId });
      if (!user || (username && username !== user.username)) {
        socket.emit("login_existUser", "", "");
        return;
      }

      const appUsers = await getUsers();
      const rooms = await getRooms();
      const roomDetails = await RoomModel.findOne({ name: recipient });
      const idsInRoom = roomDetails ? roomDetails.users : [];
      const recipientExists = appUsers.some(u => u.username === recipient);
      const roomExists = idsInRoom.includes(user.userId);

      if (recipient && !recipientExists) {
        if (roomExists) {
          socket.emit("login_existUser", username, recipient);
          return;
        }
        socket.emit("login_existUser", "", "");
        return;
      }

      socket.userId = user.userId;
      socket.username = user.username;
      socket.emit("login_existUser", user.username, recipient);

    } catch (error) {
      handleError(socket, `Error during existing cookie check: ${error.message}`);
    }
  });

  socket.on("login", async (data) => {
    try {
      const { username, password } = data;
      const user = await UserModel.findOne({ username: username.trim() });

      if (user) {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          let session = await SessionModel.findOne({ userId: user.userId });

          if (!session || session.expires < Date.now()) {
            if (session) await SessionModel.deleteOne({ userId: user.userId });

            const sessionId = uuid();
            session = new SessionModel({
              sessionId,
              userId: user.userId,
              expires: Date.now() + sessionValidity,
            });
            await session.save();
          }

          socket.userId = user.userId;
          socket.username = user.username;
          user.connection = true;
          await user.save();

          socket.emit("login_success", session.sessionId);
          io.emit("update_users", await getUsers());
        } else {
          socket.emit("error", "Incorrect password");
        }
      } else {
        socket.emit("error", "Incorrect username");
      }
    } catch (error) {
      console.error("Error during login", error);
      socket.emit("error", "Error during login");
    }
  });

  socket.on("signup", async (data) => {
    try {
      let user = await UserModel.findOne({ username: data.username.trim() });
      if (user) {
        handleError(socket, "Username already exists");
      } else {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);

        user = new UserModel({
          userId: uuid(),
          username: data.username.trim(),
          password: hashedPassword,
          email: data.email.trim(),
          connection: false,
        });
        await user.save();
        socket.emit("signup_success");
        io.emit("update_users", await getUsers());
      }
    } catch (err) {
      handleError(socket, "Error during signup");
    }
  });

  socket.on("logout", async () => {
    try {
      await SessionModel.deleteOne({ userId: socket.userId });
      const user = await UserModel.findOne({ userId: socket.userId });
      user.connection = false;
      await user.save();
      io.emit("update_users", await getUsers());
      socket.disconnect();
    } catch (err) {
      handleError(socket, "Error during logout");
    }
  });

  socket.on("disconnect", async () => {
    try {
      if (socket.userId) {
        const user = await UserModel.findOne({ userId: socket.userId });
        user.connection = false;
        await user.save();
        io.emit("update_users", await getUsers());
      }
      socket.disconnect();
    } catch (err) {
      handleError(socket, "Error updating user on disconnect");
    }
  });
};

export default authHandlers;
