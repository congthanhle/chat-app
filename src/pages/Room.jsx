import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { listenMessages, sendMessage } from "../services/firebaseService";
import { formatDateTime } from "../utils/datetime";
import { formatFileSize, getFileIcon } from "../utils/file";
import FileUpload from "../components/FileUpload";
import { auth } from "../fireBaseConfig";
import { signInAnonymously } from "firebase/auth";

export default function ChatRoom() {
  const { roomId } = useParams();
  const location = useLocation();
  const roomName = location.state?.roomName || "Chat Room";
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [username, setUsername] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const savedUsername = localStorage.getItem('chatUsername');
    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      setShowNameInput(true);
    }

    const ensureAuth = async () => {
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Authentication error:", error);
        }
      }
    };
    ensureAuth();
  }, []);

  useEffect(() => {
    if (!roomId) return;
    const unsubscribe = listenMessages(roomId, (msgs) => setMessages(msgs));
    return () => unsubscribe();
  }, [roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    if (!username) {
      setShowNameInput(true);
      return;
    }

    try {
      await sendMessage(roomId, username, newMsg);
      setNewMsg("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleFileUploaded = async (fileName, fileUrl, fileType, fileSize) => {
    try {
      const fileData = {
        fileName,
        fileUrl,
        fileType,
        fileSize
      };

      await sendMessage(roomId, username, `📎 ${fileName}`, false, fileData);
    } catch (error) {
      console.error("Error sending file message:", error);
    }
  };

  const handleSetUsername = () => {
    if (!tempName.trim()) return;

    const finalUsername = tempName.trim();
    setUsername(finalUsername);
    localStorage.setItem('chatUsername', finalUsername);
    setShowNameInput(false);
    setTempName("");

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleNameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSetUsername();
    }
  };

  const handleEditUsername = () => {
    setTempName(username);
    setShowNameInput(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="md:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white md:rounded-lg shadow-sm md:p-6 p-3">
          <div className="flex items-center justify-between mb-4 flex-wrap md:flex-nowrap gap-2">
            <h2 className="text-xl font-semibold">Room: {roomName}</h2>
            <div className="flex items-center justify-between space-x-4 md:w-auto w-full">
              {username && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Logged in as: <span className="font-medium text-cyan-600">{username}</span>
                  </span>
                  <button
                    onClick={handleEditUsername}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex-1 overflow-y-auto border p-2 mb-4 rounded space-y-2 min-h-[calc(100vh-298px)] max-h-[calc(100vh-298px)] md:min-h-[calc(100vh-260px)] md:max-h-[calc(100vh-260px)]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-xl ${msg.isSystem
                    ? "bg-yellow-50 mx-auto text-center max-w-[60%]"
                    : msg.sender === username
                      ? "bg-cyan-100 ml-auto"
                      : "bg-gray-100"
                    } ${msg.isSystem ? "" : "max-w-[60%]"}`}
                >
                  {!msg.isSystem && (
                    <span className="block text-xs text-gray-600">{msg.sender}</span>
                  )}
                  {msg.fileData ? (
                    <div className="space-y-2">
                      {msg.fileData.fileType.startsWith('image/') && (
                        <div className="max-w-xs">
                          <img
                            src={msg.fileData.fileUrl}
                            alt={msg.fileData.fileName}
                            className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(msg.fileData.fileUrl, '_blank')}
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2 bg-white bg-opacity-50 rounded p-2">
                        <i className={`pi ${getFileIcon(msg.fileData.fileType)} text-lg`}></i>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{msg.fileData.fileName}</div>
                          <div className="text-xs text-gray-500">{formatFileSize(msg.fileData.fileSize)}</div>
                        </div>
                        <a
                          href={msg.fileData.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600 transition-colors"
                        >
                          <i className="pi pi-download mr-1"></i>
                          Download
                        </a>
                      </div>
                      {msg.text && msg.text !== `📎 ${msg.fileData.fileName}` && (
                        <span className={msg.isSystem ? "text-sm text-gray-700 italic" : ""}>{msg.text}</span>
                      )}
                    </div>
                  ) : (
                    <span className={msg.isSystem ? "text-sm text-gray-700 italic" : ""}>{msg.text}</span>
                  )}

                  <div className="text-xs text-gray-500 mt-1">
                    {formatDateTime(msg.createdAt)}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex space-x-2">
              <FileUpload
                roomId={roomId}
                username={username}
                onFileUploaded={handleFileUploaded}
                disabled={!username}
              />
              <input
                ref={inputRef}
                type="text"
                value={newMsg}
                placeholder={username ? "Type your message..." : "Please set your username first..."}
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!username}
              />
              <button
                className="bg-cyan-500 text-white px-6 py-2 rounded-lg hover:bg-cyan-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSend}
                disabled={!newMsg.trim() || !username}
              >
                <i className="pi pi-send"></i>
              </button>
            </div>
          </div>
        </div>
        {showNameInput && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4 text-center">
                {username ? "Change Username" : "Enter Your Name"}
              </h3>
              <p className="text-sm text-gray-600 mb-4 text-center">
                {username ? "Enter a new username for this chat room." : "Please enter your name to start chatting."}
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Your name..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  autoFocus
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleSetUsername}
                    disabled={!tempName.trim()}
                    className="flex-1 bg-cyan-500 text-white py-3 px-4 rounded-lg hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {username ? "Update" : "Join Chat"}
                  </button>
                  {username && (
                    <button
                      onClick={() => {
                        setShowNameInput(false);
                        setTempName("");
                      }}
                      className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
