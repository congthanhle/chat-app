import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../fireBaseConfig";
import CreateRoom from "./CreateRoom";

export default function RoomList() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CreateRoom />
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow duration-300 border border-gray-200 h-40 flex flex-col justify-between"
            onClick={() => navigate(`/rooms/${room.id}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 truncate flex-1 mr-2">
                {room.name}
              </h3>
              <svg className="w-5 h-5 text-cyan-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            <div className="flex items-center justify-between mt-auto">
              <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded-full">
                Chat Room
              </span>
              <div className="text-xs text-gray-500">
                {room.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="text-center py-8 mt-4">
          <p className="text-gray-500">No chat rooms yet. Create your first room above!</p>
        </div>
      )}
    </div>
  );
}
