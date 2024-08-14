const { handleError, createSession } = require('../utils/utils');
const UserModel = require("../models/users");
const SessionModel = require("../models/session");
const { getUsers } = require('../utils/utils');

const authHandlers = (socket, io) => {
  socket.on("existingCookie", async (cookie, username, recipient) => {
    try {
        const existingSession = await SessionModel.findOne({ sessionId: cookie });
        if (existingSession) {
          const user = await UserModel.findOne({ userId: existingSession.userId });
          const appUsers = await getUsers();

          if (user &&
              (!username || username === user.username) &&
              (!recipient || appUsers.some(u => u.username === recipient))
          ) {
            socket.userId = user.userId;
            socket.username = user.username;
            socket.emit("login_existUser", user.username, recipient);
          } else {
            socket.emit("login_existUser", "", "");
          }
        } else {
          socket.emit("login_existUser", "", "");
        }
      } catch (error) {
        handleError(socket, "Error during existing cookie check");
      }
  });

  socket.on("login", async (data) => {
    try {
        const { username, password } = data;
        const user = await UserModel.findOne({ username: username.trim() });
        if (user && user.password === password.trim()) {
          let session = await SessionModel.findOne({ userId: user.userId });
          if (!session || session.expires < Date.now()) {
            if (session) await SessionModel.deleteOne({ userId: user.userId });
            const sessionId = await createSession(user.userId);
            socket.emit("login_success", sessionId);
          } else {
            socket.emit("login_success", session.sessionId);
          }
          socket.userId = user.userId;
          socket.username = user.username;
          io.emit("update_users", await getUsers());
        } else {
          handleError(socket, "Incorrect username or password");
        }
      } catch (error) {
        handleError(socket, "Error during login");
      }
  });

  socket.on("signup", async (data) => {
    try {
        let user = await UserModel.findOne({ username: data.username.trim() });
        if (user) {
          handleError(socket, "Username already exists");
        } else {
          user = new UserModel({
            userId: uuid.v4(),
            username: data.username.trim(),
            password: data.password.trim(),
            email: data.email.trim(),
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
        io.emit("update_users", await getUsers());
        socket.disconnect();
      } catch (err) {
        handleError(socket, "Error during logout");
      }
  });

  socket.on("disconnect", async () => {
    try {
        if (socket.userId) {
          await SessionModel.deleteOne({ userId: socket.userId });
          io.emit("update_users", await getUsers());
        }
        socket.disconnect();
      } catch (err) {
        handleError(socket, "Error updating user on disconnect");
      }
    });
};

module.exports = authHandlers;
