const { handleError,getUsers, sessionValidity } = require('../utils/utils');
const UserModel = require("../models/users");
const SessionModel = require("../models/session");
const uuid = require("uuid");
const bcrypt = require("bcrypt");


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

    if (user) {
      // Compare the provided password with the hashed password
      
      const match = await bcrypt.compare(password, user.password);
   
      if (match) {
        let session = await SessionModel.findOne({ userId: user.userId });

        if (!session || session.expires < Date.now()) {
          if (session) await SessionModel.deleteOne({ userId: user.userId });

          const sessionId = uuid.v4();
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

        console.log("sessionId", session.sessionId);
        socket.emit("login_success", session.sessionId);
        io.emit("update_users", await getUsers());
      } else {
        socket.emit("error", "Incorrect  password");
      }
    } else {
      socket.emit("error", "Incorrect username  ");
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
            userId: uuid.v4(),
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
          console.log("disconnecting user", socket.userId);
          const user = await UserModel.findOne({ userId: socket.userId });
          user.connection = false;
          await user.save();
          // await SessionModel.deleteOne({ userId: socket.userId });
          io.emit("update_users", await getUsers());
        }
        socket.disconnect();
      } catch (err) {
        handleError(socket, "Error updating user on disconnect");
      }
    });
};

module.exports = authHandlers;
