const uuid = require('uuid');
const UserModel = require("../models/users");
const SessionModel = require("../models/session");
const RoomModel = require("../models/rooms");

const sessionValidity = 1000 * 60 * 60 * 24 * 7;

const handleError = (socket, message) => {
    console.error(message);
    socket.emit("error", message);
  };
  
  // const createSession = async (sessionId,userId) => {
  //   // const sessionId = uuid.v4();
  //   const session = new SessionModel({
  //     sessionId,
  //     userId,
  //     expires: Date.now() + sessionValidity,
  //   });
  //   await session.save();
  //   return sessionId;
  // };

  const getUsers = async () => {
    const users = await UserModel.find();
    return users;
  };

  const getRooms = async () => {
    const rooms = await RoomModel.find();
    return rooms;
  };
  
  module.exports = { handleError, getUsers, getRooms, sessionValidity };
  