import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./App.css";

function App({ socket }) {
  const [users, setUsers] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [room, setRoom] = useState("");
  const [rooms, setRooms] = useState([]);
  const [showUsers, setShowUsers] = useState(true);
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Request initial data
    socket.emit("get_users");
    socket.emit("get_rooms", username);

    // Handle updates to user list
    const handleUpdateUsers = (userList) => {
      console.log("update_users", userList);
      setUsers(userList.map(user => ({
        username: user.username,
        connection: user.connection,
      })));
    };

    // Handle updates to room list
    const handleUpdateRoomList = (roomList) => {
      roomList.forEach(room => {
        socket.emit("join_room", room);
      });
      setRooms(roomList);
    };

    // Register event listeners
    socket.on("update_users", handleUpdateUsers);
    socket.on("update_roomList", handleUpdateRoomList);

    // Cleanup on unmount
    return () => {
      socket.off("update_users", handleUpdateUsers);
      socket.off("update_roomList", handleUpdateRoomList);
    };
  }, [socket, username]);

  useEffect(() => {
    if (recipient) {
      navigate(`/chat/${username}/${recipient}`);
    }
  }, [recipient, navigate, username]);

  const handleUserClick = (user) => {
    setRecipient(user);
  };

  const handleRoomClick = (room) => {
    navigate(`/chat/${username}/room/${room}`);
  };

  const handleRoomSubmit = (e) => {
    e.preventDefault();
    if (room.trim()) {
      socket.emit("create_room", room, username);
      setRoom("");
    }
  };

  return (
    <div className="App">
      <h2 className="heading">CHATTER-BOX</h2>
      <span className="username">
        {username.charAt(0).toUpperCase()}
        <div className="username-text">{username}</div>
      </span>
      <div>
        <div className="pagination">
          <span className="usersPge" onClick={() => setShowUsers(true)}>Users</span>
          <span className="roomsPge" onClick={() => setShowUsers(false)}>Rooms</span>
        </div>
        {showUsers ? (
          <div className="users">
            {users.map((user, index) => (
              user.username !== username && (
                <div
                  key={index}
                  onClick={() => handleUserClick(user.username)}
                  className="userName"
                  style={{ color: user.connection ? "green" : "red" }}
                >
                  {user.username}
                </div>
              )
            ))}
          </div>
        ) : (
          <div className="rooms">
            <form id="form" onSubmit={handleRoomSubmit}>
              <input
                type="text"
                id="input"
                placeholder="Enter room name here..."
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />
              <button type="submit">Create</button>
            </form>
            <div className="roomsList">
              {rooms.map((room, index) => (
                <div
                  key={index}
                  onClick={() => handleRoomClick(room)}
                  className="roomName"
                >
                  {room}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
