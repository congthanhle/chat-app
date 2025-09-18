// src/components/CreateRoom.jsx
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../fireBaseConfig";

export default function CreateRoom() {
  const [roomName, setRoomName] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    await addDoc(collection(db, "rooms"), {
      name: roomName,
      createdAt: serverTimestamp(),
      createdBy: "anonymous",
    });

    setRoomName("");
  };

  return (
    <form onSubmit={handleCreate} className="mb-4">
      <input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Tên phòng mới..."
        className="border p-2 mr-2"
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2">
        Tạo phòng
      </button>
    </form>
  );
}
