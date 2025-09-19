import { db } from "../fireBaseConfig";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
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

export async function sendSystemMessage(roomId, text) {
  await addDoc(collection(db, "chatRooms", roomId, "messages"), {
    sender: "System",
    text,
    createdAt: serverTimestamp(),
    isSystemMessage: true,
  });
}

export async function startCall(roomId, username) {
  const callRef = doc(db, "calls", roomId);
  await setDoc(callRef, {
    caller: username,
    participants: [username],
    startedAt: serverTimestamp(),
    isActive: true,
  });

  await sendSystemMessage(roomId, `${username} started a video call`);
}

export async function joinCall(roomId, username) {
  const callRef = doc(db, "calls", roomId);
  const callSnap = await getDoc(callRef);

  if (callSnap.exists()) {
    const callData = callSnap.data();
    const participants = callData.participants || [];

    if (participants.length >= 2) {
      throw new Error("Call is full. Maximum 2 participants allowed.");
    }

    if (!participants.includes(username)) {
      await setDoc(
        callRef,
        {
          ...callData,
          participants: [...participants, username],
        },
        { merge: true }
      );
      await sendSystemMessage(roomId, `${username} joined the video call`);
    }
  }
}

export async function leaveCall(roomId, username) {
  const callRef = doc(db, "calls", roomId);
  const callSnap = await getDoc(callRef);

  if (callSnap.exists()) {
    const callData = callSnap.data();
    const participants = callData.participants || [];
    const updatedParticipants = participants.filter((p) => p !== username);

    if (updatedParticipants.length === 0) {
      await setDoc(
        callRef,
        {
          ...callData,
          participants: [],
        },
        { merge: true }
      );
      await sendSystemMessage(roomId, `${username} left the video call`);
    } else {
      const newCaller = updatedParticipants[0];
      await setDoc(
        callRef,
        {
          ...callData,
          participants: updatedParticipants,
          caller: callData.caller === username ? newCaller : callData.caller,
        },
        { merge: true }
      );
      await sendSystemMessage(roomId, `${username} left the video call`);
    }
  }
}

export async function endCall(roomId) {
  const callRef = doc(db, "calls", roomId);
  await deleteDoc(callRef);

  await sendSystemMessage(roomId, "Video call ended by a participant");
}

export async function getCallState(roomId) {
  const callRef = doc(db, "calls", roomId);
  const callSnap = await getDoc(callRef);
  return callSnap.exists() ? callSnap.data() : null;
}

export function listenCallState(roomId, callback) {
  const callRef = doc(db, "calls", roomId);
  return onSnapshot(callRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data());
    } else {
      callback(null);
    }
  });
}
