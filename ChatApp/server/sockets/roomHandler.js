import RoomModel from "../models/rooms.js";
import UserModel from "../models/users.js";
import MessageModel from "../models/message.js";
import { handleError} from '../utils/utils.js';
import { v4 } from 'uuid';

const roomHandlers = (socket, io) => {
  
  socket.on("create_room", async (roomName, username) => {
    console.log('createrrom',roomName, username);
    try {
        let room = await RoomModel.findOne({ name: roomName });
        console.log('room',room);
        if (room) {
          handleError(socket, "Room already exists");
        } else {
          const user = await UserModel.findOne({ username });
          console.log('user',user);
          if (user) {
            room = new RoomModel({
              roomId: v4(),
              name: roomName,
              users: [user.userId],
            });
            await room.save();
            const userRooms = await RoomModel.find({ users: user.userId });
            io.emit("update_roomList", userRooms.map((r) => r.name));
          } else {
            handleError(socket, "User not found create room");
          }
        }
      } catch (err) {
        handleError(socket, "Error creating room");
      }
  });

  socket.on("get_rooms", async (username) => {
    console.log("get_rooms", username);
    try {
        const user = await UserModel.findOne({ username });
        console.log("user", user);
        if (user) {
          const userRooms = await RoomModel.find({ users: user.userId });
          socket.emit("update_roomList", userRooms.map((room) => room.name));
        } else {
          handleError(socket, "User not found get rooms");
        }
      } catch (err) {
        handleError(socket, "Error fetching rooms");
      }
  });

  socket.on("add_friend", async ({ roomName, friendUsername }) => {
    try {
        const friend = await UserModel.findOne({ username: friendUsername });
        if (friend) {
          const room = await RoomModel.findOne({ name: roomName });
          if (room && !room.users.includes(friend.userId)) {
            room.users.push(friend.userId);
            await room.save();

            const userRooms = await RoomModel.find({ users: user.userId });
            io.emit("update_roomList", userRooms.map((r) => r.name));

            const roomMembers = await UserModel.find({ userId: { $in: room.users } });
            console.log("roomMembers", roomMembers);
            socket.emit("room_members", roomMembers.map((roomMember) => roomMember.username));
          } else {
            handleError(socket, "Room does not exist or user already in room");
          }
        } else {
          handleError(socket, "User not found add friend to room");
        }
      } catch (err) {
        handleError(socket, "Error adding friend to room");
      }
  });

  socket.on("join_room", (roomName) => {
    socket.join(roomName);
  });

  socket.on("get_roomMsgs", async ({ roomName }) => {
    try {
        const messages = await MessageModel.find({ recipient: roomName });
        socket.emit("room_messages", messages);

        const roomDetails = await RoomModel.findOne({ name: roomName });
        if (roomDetails) {
          const roomMembersIds = roomDetails.users;
          const roomMembersDetails = await UserModel.find({ userId: { $in: roomMembersIds } });
          const roomMember = roomMembersDetails.map((roomMembersDetail) => roomMembersDetail.username);
          socket.emit("room_members", roomMember);
        } else {
          handleError(socket, "Room not found");
        }
      } catch (err) {
        handleError(socket, "Error fetching room messages", err);
      }
  });

  socket.on("room_message", async ({ content, roomName, from }) => {
    console.log("room_message", content, roomName, from);
    try {
        await MessageModel.create({
          messageId: v4(),
          message: content,
          user: from,
          recipient: roomName,
        });
        socket.to(roomName).emit("room_message", { content, from, roomName });
      } catch (err) {
        handleError(socket, "Error saving room message");
      }
  });
};

export default roomHandlers;