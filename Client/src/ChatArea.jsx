import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import "./styles/ChatArea.css";
import { useNavigate } from "react-router-dom";


function ChatArea({ socket }) {
  const [users, setUsers] = useState([]);
  const { username, recipient, roomName } = useParams();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [friend, setFriend] = useState("");
  const [roomMembers, setRoomMembers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

document.addEventListener("DOMContentLoaded", async () => {
    async function fetchCookie() {
      try {
        const response = await fetch("http://localhost:3000/get-cookie", {
          method: "GET",
          credentials: "include",
        });
        const data = await response.json();
        console.log("data", data);  
        if (data.sessionId) {
          socket.emit("existingCookie", data.sessionId, username,(recipient || roomName));
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching cookie:", error);
      }
    }

    fetchCookie();
  });

  socket.on("login_existUser", (username, recipient) => {
    console.log("login_existUser", username);
    if(username && recipient)
    navigate(`/chat/${username}/${recipient}`);
    else
    navigate("/");
  });

  
  useEffect(() => {
    const handleMessages = (messages) => {
      setMessages(messages.map((msg) => ({
        text: msg.message,
        type: msg.user === username ? "sent" : "received",
        from: msg.user === username ? null : msg.user,
      })));
    };

    const handleRoomMessages = (messages) => {
      setMessages(messages.map((msg) => ({
        text: msg.message,
        type: msg.user === username ? "sent" : "received",
        from: msg.user === username ? null : msg.user,
      })));
    };

    const handlePrivateMessage = (data) => {
      if (data.to === username && data.from === recipient) {
        // if(prevState.messages.some(m => m.id === data._id)) setHasNewMsg(false);
        setMessages((prev) => [...prev, { text: data.content, type: "received" }]);
      }
    };

    const handleRoomMessage = (data) => {
      if (data.roomName === roomName) {
        setMessages((prev) => [...prev, {
          text: data.content,
          type: data.from === username ? "sent" : "received",
          from: data.from,
        }]);
      }
    };

    socket.emit("get_users");
    socket.emit("get_rooms");
    socket.on("update_users", setUsers);
    socket.on("update_rooms", (rooms) => setRooms(rooms));

    if (recipient) {
      socket.emit("get_msgs", { to: recipient, from: username });
      socket.on("messages", handleMessages);
    }

    if (roomName) {
      socket.emit("join_room", roomName);
      socket.emit("get_roomMsgs", { roomName, username });
      socket.on("room_messages", handleRoomMessages);
      socket.on("room_members", setRoomMembers);
    }

    socket.on("pvt_message", handlePrivateMessage);
    socket.on("room_message", handleRoomMessage);

    return () => {
      socket.off("update_users", setUsers);
      socket.off("messages", handleMessages);
      socket.off("room_messages", handleRoomMessages);
      socket.off("pvt_message", handlePrivateMessage);
      socket.off("room_message", handleRoomMessage);
    };
  }, [socket, recipient, roomName, username]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      const message = { content: input, from: username };
      if (recipient) {
        socket.emit("private_message", { ...message, to: recipient });
      } else if (roomName) {
        socket.emit("room_message", { ...message, roomName });
      }
      setMessages((prev) => [...prev, { text: input, type: "sent" }]);
      setInput("");
      setError("");
    }
  };

  const handleAddFriend = (e) => {
    e.preventDefault();
    const friendUsername = friend.trim();
    if (users.some(user => user.username === friendUsername)) {
      socket.emit("add_friend", { roomName, friendUsername });
      socket.emit("get_rooms", username);
      setFriend("");
      setError("");
    } else {
      setError("User not found");
    }
  };

  const handleSelectFriend = (username) => {
    setFriend(username);
    setShowDropdown(false);
  };

  const handleInputFocus = () => setShowDropdown(true);
  const handleInputBlur = () => setTimeout(() => setShowDropdown(false), 100);

  return (
    <div className="ChatArea">
      <h2 className="heading">
        {recipient || roomName}
        {roomName && (
          <button
            className="caretDown"
            onClick={() => setShowMembers(!showMembers)}
          >
            <FontAwesomeIcon icon={faCaretDown} />
          </button>
        )}
      </h2>
      {roomName && showMembers && (
        <div className="roomMembers">
          {roomMembers.map((member, index) => (
            <div key={index} className="roomMember">
              {member}
            </div>
          ))}
        </div>
      )}
      {roomName && (
        <div className="addFriend">
          <h3 className="heading">Add a friend:</h3>
          <form id="addFriendForm" onSubmit={handleAddFriend}>
            <input
              type="text"
              id="friendInput"
              className="dropdown-container"
              placeholder="Enter username here..."
              value={friend}
              onChange={(e) => setFriend(e.target.value)}
              autoComplete="new-password"
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            {showDropdown && (
              <div className="dropdown-content">
                {users
                  .filter(user => !roomMembers.some(member => member === user.username))
                  .map((user, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectFriend(user.username)}
                      className="dropdown-item"
                    >
                      {user.username}
                    </div>
                  ))}
              </div>
            )}
            <button type="submit">Add</button>
          </form>
        </div>
      )}
      {error && <div className="error">{error}</div>}
      <div id="messages">
        {messages.map((msg, index) => (
          <span key={index} className={`message ${msg.type}`}>
            <b>{msg.from ? `${msg.from}: ` : ""}</b>
            {msg.text}
          </span>
        ))}
      </div>
      <form id="messageForm" onSubmit={handleSubmit}>
        <input
          type="text"
          id="messageInput"
          placeholder="Enter your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="sendBtn">Send</button>
      </form>
    </div>
  );
}

export default ChatArea;