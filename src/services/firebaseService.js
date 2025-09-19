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
  deleteDoc,
  getDoc,
  updateDoc,
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

// Video call related functions
export async function sendVideoCallSignal(roomId, signalData) {
  await setDoc(doc(db, "videoCallSignals", roomId), {
    ...signalData,
    timestamp: serverTimestamp(),
  });
}

export function listenVideoCallSignals(roomId, callback) {
  const signalRef = doc(db, "videoCallSignals", roomId);

  return onSnapshot(signalRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    }
  });
}

export async function createVideoCallSession(roomId, initiator) {
  const sessionRef = doc(db, "videoCallSessions", roomId);
  await setDoc(sessionRef, {
    roomId,
    initiator,
    participants: [initiator],
    status: "waiting",
    createdAt: serverTimestamp(),
  });
}

export async function joinVideoCallSession(roomId, participant) {
  const sessionRef = doc(db, "videoCallSessions", roomId);
  const sessionDoc = await getDoc(sessionRef);

  if (sessionDoc.exists()) {
    const data = sessionDoc.data();
    if (
      data.participants.length < 2 &&
      !data.participants.includes(participant)
    ) {
      await updateDoc(sessionRef, {
        participants: [...data.participants, participant],
        status: "active",
      });
      return true;
    }
  }
  return false;
}

export function listenVideoCallSession(roomId, callback) {
  const sessionRef = doc(db, "videoCallSessions", roomId);

  return onSnapshot(sessionRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback(null);
    }
  });
}

export async function endVideoCallSession(roomId) {
  try {
    await deleteDoc(doc(db, "videoCallSessions", roomId));
    await deleteDoc(doc(db, "videoCallSignals", roomId));
  } catch (error) {
    console.error("Error ending video call session:", error);
  }
}

export async function getVideoCallSession(roomId) {
  const sessionRef = doc(db, "videoCallSessions", roomId);
  const sessionDoc = await getDoc(sessionRef);
  return sessionDoc.exists() ? sessionDoc.data() : null;
}

// Make sendVideoCallSignal available globally for WebRTC service
window.sendVideoCallSignal = sendVideoCallSignal;
