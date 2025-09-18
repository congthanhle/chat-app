import { db } from "../fireBaseConfig";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

export function listenMessages(roomId, callback) {
  const q = query(
    collection(db, "chatRooms", roomId, "messages"),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(msgs);
  });
}

export async function sendMessage(roomId, sender, text) {
  await addDoc(collection(db, "chatRooms", roomId, "messages"), {
    sender,
    text,
    createdAt: serverTimestamp(),
  });
}
