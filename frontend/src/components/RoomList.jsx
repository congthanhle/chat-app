// src/components/RoomList.jsx
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../fireBaseConfig";

export default function RoomList() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "rooms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRooms(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Danh sách phòng</h2>
      <ul>
        {rooms.map((room) => (
          <li key={room.id} className="p-2 border-b">
            <Link to={`/rooms/${room.id}`}>{room.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
