import { db } from "../fireBaseConfig";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
} from "firebase/firestore";

const servers = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }
  ]
};

let pc;

export async function createRoom(localStream, roomId) {
  pc = new RTCPeerConnection(servers);

  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  const roomRef = doc(db, "rooms", roomId);
  const offerCandidates = collection(roomRef, "offerCandidates");
  const answerCandidates = collection(roomRef, "answerCandidates");

  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      await addDoc(offerCandidates, event.candidate.toJSON());
    }
  };

  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  await setDoc(roomRef, { offer: { type: offerDescription.type, sdp: offerDescription.sdp } });

  onSnapshot(roomRef, (snapshot) => {
    const data = snapshot.data();
    if (data?.answer && !pc.currentRemoteDescription) {
      pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  });

  onSnapshot(answerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      }
    });
  });

  return pc;
}

export async function joinRoom(localStream, roomId) {
  pc = new RTCPeerConnection(servers);
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

  const roomRef = doc(db, "rooms", roomId);
  const offerCandidates = collection(roomRef, "offerCandidates");
  const answerCandidates = collection(roomRef, "answerCandidates");

  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      await addDoc(answerCandidates, event.candidate.toJSON());
    }
  };

  const roomSnapshot = await getDoc(roomRef);
  const roomData = roomSnapshot.data();

  await pc.setRemoteDescription(new RTCSessionDescription(roomData.offer));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  await updateDoc(roomRef, { answer: { type: answerDescription.type, sdp: answerDescription.sdp } });

  onSnapshot(offerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        pc.addIceCandidate(new RTCIceCandidate(change.doc.data()));
      }
    });
  });

  return pc;
}
