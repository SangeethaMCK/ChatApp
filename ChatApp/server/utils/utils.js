import { v4 as uuid } from 'uuid';
import UserModel from "../models/users.js";
import SessionModel from "../models/session.js";
import RoomModel from "../models/rooms.js";

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

  export  { handleError, getUsers, getRooms, sessionValidity };
