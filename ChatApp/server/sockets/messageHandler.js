import MessageModel from "../models/message.js";
import UserModel from "../models/users.js";
import { handleError } from '../utils/utils.js';
import {  v4 } from 'uuid';

const messageHandlers = (socket, io) => {
  socket.on("get_msgs", async ({ to, from }) => {
    try {
        const messages = await MessageModel.find({
          $or: [
            { $and: [{ user: from }, { recipient: to }] },
            { $and: [{ user: to }, { recipient: from }] },
          ],
        });
        socket.emit("messages", messages);
      } catch (err) {
        handleError(socket, "Error fetching private messages");
      }
  });

  socket.on("private_message", async ({ content, to, from }) => {
    console.log("private_message", content, to, from);

    try {
        const msgId = v4();
        const recipient = await UserModel.findOne({ username: to });
        if (recipient) {
          await MessageModel.create({
            messageId: msgId,
            message: content,
            user: from,
            recipient: to,
          });
          io.emit("pvt_message", { content, from, to  });
        } else {
          handleError(socket, "User not found private message");
        }
      } catch (err) {
        handleError(socket, "Error saving private message");
      }
  });
};

export default messageHandlers;