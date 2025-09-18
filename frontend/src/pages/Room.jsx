// src/pages/Room.jsx
import { useParams } from "react-router-dom";

export default function Room() {
  const { roomId } = useParams();

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Room: {roomId}</h2>
          <p className="text-gray-600">Chat functionality will be implemented on Day 3</p>

          {/* Placeholder for chat interface */}
          <div className="mt-6 space-y-4">
            <div className="border rounded-lg p-4 h-96 bg-gray-50">
              <p className="text-center text-gray-500 mt-40">Chat messages will appear here</p>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type your message..."
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
              />
              <button
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                disabled
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
