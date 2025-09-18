// src/pages/Home.jsx
import CreateRoom from "../components/CreateRoom";
import RoomList from "../components/RoomList";

export default function Home() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <CreateRoom />
        </div>
        <RoomList />
      </div>
    </div>
  );
}
