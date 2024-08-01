import React, { useEffect, useState } from "react";
import { useParams } from "react-router";
import "./ChatArea.css";

function ChatArea({ socket }) {
  const [users, setUsers] = useState([]);
  const { username, recipient, roomName } = useParams();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [friend, setFriend] = useState("");
  const [roomMembers, setRoomMembers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleUpdateUsers = (users) => setUsers(users);
    const handleUpdateRooms = (rooms) => setRooms(rooms);
    const handleMessages = (messages) => {
      setMessages(
        messages.map((msg) => ({
          text: msg.message,
          type: msg.user === username ? "sent" : "received",
          // from: msg.user === username ? null : msg.user
        }))
      );
    };
    const handleRoomMessages = (messages) => {
      setMessages(
        messages.map((msg) => ({
          text: msg.message,
          type: msg.user === username ? "sent" : "received",
          from: msg.user === username ? null : msg.user,
        }))
      );
    };
    const handlePrivateMessage = (data) => {
      if (data.to === username && data.from === recipient) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            text: data.content,
            type: "received",
          },
        ]);
      }
    };
    const handleRoomMessage = (data) => {
      if (data.roomName === roomName) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            text: data.content,
            type: data.from === username ? "sent" : "received",
            from: data.from,
          },
        ]);
      }
    };

    // Fetch users and messages
    socket.emit("get_users");
    socket.emit("get_rooms");
    socket.on("update_users", handleUpdateUsers);
    socket.on("update_rooms", handleUpdateRooms);

    if (recipient) {
      socket.emit("get_msgs", { to: recipient, from: username });
      socket.on("messages", handleMessages);
    }

    if (roomName) {
      socket.emit("join_room", roomName);
      socket.emit("get_roomMsgs", { roomName, username });
      socket.on("room_messages", handleRoomMessages);
      socket.on("room_members", (roomMembers) => setRoomMembers(roomMembers));
    }

    socket.on("pvt_message", handlePrivateMessage);
    socket.on("room_message", handleRoomMessage);

    return () => {
      socket.off("update_users", handleUpdateUsers);
      socket.off("messages", handleMessages);
      socket.off("room_messages", handleRoomMessages);
      socket.off("pvt_message", handlePrivateMessage);
      socket.off("room_message", handleRoomMessage);
    };
  }, [socket, recipient, roomName, username]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      if (recipient) {
        socket.emit("private_message", {
          content: input,
          to: recipient,
          from: username,
        });
      } else if (roomName) {
        socket.emit("room_message", {
          content: input,
          roomName,
          from: username,
        });
      }
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: input, type: "sent" },
      ]);
      setInput("");
    }
  };

  const handleAddFriend = (e) => {
    e.preventDefault();
    if (friendUsername) {
      document.getElementById("friendInput").value = "friendUsername";
    }
    const friendUsername = friend.trim();
    if (friendUsername) {
      socket.emit("add_friend", { roomName, friendUsername });
      setFriend("");
    }
  };
  function handleSelectFriend  (friendUsername) {
    console.log("friendUsername", friendUsername);
    document.getElementById("friendInput").placeholder = friendUsername;
    setFriend(friendUsername);
  };

  return (
    <div className="ChatArea">
      <h2 className="heading"> {recipient || ` ${roomName}`}</h2>

      {roomName && (
        <div className="addFriend">
          <h3 className="heading addFriend">Add a friend:</h3>
          <form id="addFriendForm" onSubmit={handleAddFriend}>
            <input
              type="text"
              id="friendInput"
              placeholder="Enter username here..."
              value={friend}
              onChange={(e) => setFriend(e.target.value)}
              autoComplete="new-password"
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setShowDropdown(false)}
            />
            {showDropdown && (
              <div className="dropdown-content">
                {users
                  .filter(
                    (user) =>
                      !roomMembers.some(
                        (member) => member.username === user.username
                      )
                  )
                  .map((user, index) => (
                    <div
                      key={index}
                      onClick={() => handleSelectFriend(user.username)}
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
        <button type="submit" className="sendBtn">
          Send
        </button>
      </form>
    </div>
  );
}

export default ChatArea;
