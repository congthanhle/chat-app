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
  getDocs,
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

export async function sendMessage(roomId, sender, text, isSystem = false) {
  await addDoc(collection(db, "chatRooms", roomId, "messages"), {
    sender,
    text,
    isSystem,
    createdAt: serverTimestamp(),
  });
}

// Video call related functions
export async function sendVideoCallSignal(roomId, signalData) {
  // Use addDoc to create separate documents for each signal
  await addDoc(collection(db, "videoCallSignals", roomId, "signals"), {
    ...signalData,
    timestamp: serverTimestamp(),
  });
}

export function listenVideoCallSignals(roomId, callback) {
  const q = query(
    collection(db, "videoCallSignals", roomId, "signals"),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        callback(change.doc.data());
      }
    });
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
    // Delete the entire signals collection
    const signalsRef = collection(db, "videoCallSignals", roomId, "signals");
    const signalsSnapshot = await getDocs(signalsRef);
    const deletePromises = signalsSnapshot.docs.map((doc) =>
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);
    // Also delete the main signals document
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
