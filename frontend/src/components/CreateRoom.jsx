import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../fireBaseConfig";

export default function CreateRoom() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setIsCreating(true);
    try {
      await addDoc(collection(db, "rooms"), {
        name: roomName.trim(),
        createdAt: serverTimestamp(),
      });
      setRoomName("");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating room:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-dashed border-cyan-300 hover:border-cyan-400 h-40 flex flex-col">
      {!showCreateForm ? (
        <div
          className="flex flex-col items-center justify-center h-full"
          onClick={() => setShowCreateForm(true)}
        >
          <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-cyan-700 mb-1">Create New Room</h3>
          <p className="text-sm text-cyan-600 text-center">Click to add a new chat room</p>
        </div>
      ) : (
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              autoFocus
              disabled={isCreating}
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={!roomName.trim() || isCreating}
              className="flex-1 bg-cyan-500 text-white py-2 px-4 rounded-md hover:bg-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </div>
              ) : (
                'Create'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setRoomName("");
              }}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
