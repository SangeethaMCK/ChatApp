import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./App.css";

function App({ socket }) {
  const [users, setUsers] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [room, setRoom] = useState("");
  const [rooms, setRooms] = useState([]);
  const [showUsers, setShowUsers] = useState(true);
  const [error, setError] = useState("");
  // const [newMessages, setNewMessages] = useState({});
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const updateUsers = (userList) =>
      setUsers(
        userList.map((user) => ({
          username: user.username,
          connection: user.connection,
        }))
      );
    const updateRoomList = (roomList) => {
      setRooms(roomList);
      roomList.forEach((room) => {
        socket.emit("join_room", room);
        socket.emit("get_rooms", username);
      });
    };

    // const handleNewMsg = (id, username, recipient) => {
    //   setNewMessages((prev) => ({
    //     ...prev,
    //     [recipient]: (prev[recipient] || 0) + 1, // increment the count of new messages
    //   }));
    //   console.log("newmsg", newMessages);
    // };

    socket.emit("get_users");
    socket.emit("get_rooms", username);
    socket.on("update_users", updateUsers);
    socket.on("update_roomList", updateRoomList);
    // socket.on("new_msg", handleNewMsg);

    return () => {
      socket.off("update_users", updateUsers);
      socket.off("update_roomList", updateRoomList);
    };
  }, [socket, username]);

  const handleUserClick = (user) => {
    setRecipient(user);
    // setNewMessages(prev => ({ ...prev, [user]: 0 }));
    navigate(`/chat/${username}/${user}`);
  };

  const handleRoomClick = (room) => {
    navigate(`/chat/${username}/room/${room}`);
  };

  const handleRoomSubmit = (e) => {
    e.preventDefault();
    if (room.trim()) {
      socket.emit("create_room", room, username);
      setRoom("");
      setError("");
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
          <span
            className={`pagination-item ${showUsers ? "active" : ""}`}
            onClick={() => setShowUsers(true)}
          >
            Users
          </span>
          <span
            className={`pagination-item ${!showUsers ? "active" : ""}`}
            onClick={() => setShowUsers(false)}
          >
            Rooms
          </span>
        </div>
        {error && <p className="error">{error}</p>}
        {showUsers ? (
          <div className="users">
            {users.map(
              (user, index) =>
                user.username !== username && (
                  <div className="userChat">
                    <div
                      key={index}
                      onClick={() => handleUserClick(user.username)}
                      className="userName"
                      style={{
                        borderLeft: user.connection
                          ? "5px solid green"
                          : "5px solid red",
                      }}
                    >
                      {user.username}
                    </div>
                    {/* {newMessages[user.username] > 0 && (
                      <div className="badge">{newMessages[user.username]}</div>
                    )} */}
                  </div>
                )
            )}
          </div>
        ) : (
          <div className="rooms">
            <form id="form" onSubmit={handleRoomSubmit}>
              <input
                type="text"
                id="input"
                placeholder="Enter Room Name..."
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                autoComplete="new-password"
              />
              <button type="submit" className="sendBtn">
                Create
              </button>
            </form>
            {rooms.map((roomName, index) => (
              <div
                key={index}
                onClick={() => handleRoomClick(roomName)}
                className="roomName"
              >
                {roomName}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
