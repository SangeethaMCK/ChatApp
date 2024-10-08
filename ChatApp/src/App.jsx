import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Existing from "./Existing";
import "./styles/App.css";

function App({ socket }) {
  const [users, setUsers] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [room, setRoom] = useState("");
  const [rooms, setRooms] = useState([]);
  const [showUsers, setShowUsers] = useState(true);
  const [newMessages, setNewMessages] = useState({});
  const [error, setError] = useState("");
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCookie() {
      try {
        const response = await fetch("http://localhost:3001/cookie", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        if (data.sessionId) {
          socket.emit("existingCookie", data.sessionId, username);
        } else {
          navigate("/");
        }
      } catch (error) {
        setError("Failed to fetch session cookie. Please try again.");
        console.error("Error fetching cookie:", error);
      }
    }

    fetchCookie();
  }, [socket, navigate, username]);

  useEffect(() => {
    const getUsers = (userList) => {
      setUsers(userList.map((user) => ({
        username: user.username,
        connection: user.connection,
      })));
    };

    const updateRoomList = (roomList) => {
      setRooms(roomList);
      roomList.forEach((room) => {
        socket.emit("join_room", room);
      });
    };

    const handlePrivateMessage = ({ content, from, to }) => {
      if (to === username) {
        setNewMessages((prevMessages) => ({
          ...prevMessages,
          [from]: (prevMessages[from] || 0) + 1,
        }));
      }
    };

    const handleRoomMessage = ({ content, from, roomName }) => {
      if (roomName in newMessages) {
        setNewMessages((prevMessages) => ({
          ...prevMessages,
          [roomName]: (prevMessages[roomName] || 0) + 1,
        }));
      }
    };

    socket.emit("get_users");
    socket.emit("get_rooms", username);
    socket.on("update_users", getUsers);
    socket.on("update_roomList", updateRoomList);
    socket.on('pvt_message', handlePrivateMessage);
    socket.on('room_message', handleRoomMessage);
    socket.on("error", (err) => {
      setError(  err);
    });

    return () => {
      socket.off("update_users", getUsers);
      socket.off("update_roomList", updateRoomList);
      socket.off('pvt_message', handlePrivateMessage);
      socket.off('room_message', handleRoomMessage);
    };
  }, [socket, username]);

  const handleUserClick = (user) => {
    setRecipient(user);
    setNewMessages((prevMessages) => ({
      ...prevMessages,
      [user]: 0,  // Reset the message count to 0
    }));
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
      setError(""); // Clear error on successful submission
    } else {
      setError("Room name cannot be empty.");
    }
  };

  const handleLogout = async () => {
    socket.emit("logout");
    try {
      const response = await fetch("http://localhost:3001/cookie", {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      console.log("Cookie deleted:", data);
    } catch (error) {
      setError("Error deleting cookie. Please try again.");
      console.error("Error deleting cookie:", error);
    }
    navigate("/");
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
            {users.map((user, index) => (
              user.username !== username && (
                <div key={index} className="userChat">
                  <div
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
                  {newMessages[user.username] > 0 && (
                    <div className="badge">{newMessages[user.username]}</div>
                  )}
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
      <button onClick={handleLogout} className="logoutBtn">
        Logout
      </button>
    </div>
  );
}

export default App;
