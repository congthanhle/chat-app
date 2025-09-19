class WebRTCService {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.isInitiator = false;
    this.roomId = null;
    this.username = null;
    this.onRemoteStreamCallback = null;
    this.onConnectionStateChangeCallback = null;
    this.firebaseUnsubscribe = null;

    this.configuration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };
  }

  async initializeCall(roomId, username, isInitiator = false) {
    this.roomId = roomId;
    this.username = username;
    this.isInitiator = isInitiator;

    try {
      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.configuration);

      // Add local stream to peer connection
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(this.remoteStream);
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback(
            this.peerConnection.connectionState
          );
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.sendSignalingMessage({
            type: "ice-candidate",
            candidate: event.candidate,
          });
        }
      };

      return this.localStream;
    } catch (error) {
      console.error("Error initializing call:", error);
      throw error;
    }
  }

  async createOffer() {
    if (!this.peerConnection) return;

    try {
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      this.sendSignalingMessage({
        type: "offer",
        offer: offer,
      });
    } catch (error) {
      console.error("Error creating offer:", error);
      throw error;
    }
  }

  async createAnswer(offer) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.sendSignalingMessage({
        type: "answer",
        answer: answer,
      });
    } catch (error) {
      console.error("Error creating answer:", error);
      throw error;
    }
  }

  async handleAnswer(answer) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error("Error handling answer:", error);
      throw error;
    }
  }

  async handleIceCandidate(candidate) {
    if (!this.peerConnection) return;

    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  }

  sendSignalingMessage(message) {
    // This will be implemented with Firebase
    if (window.sendVideoCallSignal) {
      window.sendVideoCallSignal(this.roomId, {
        ...message,
        from: this.username,
        timestamp: Date.now(),
      });
    }
  }

  onRemoteStream(callback) {
    this.onRemoteStreamCallback = callback;
  }

  onConnectionStateChange(callback) {
    this.onConnectionStateChangeCallback = callback;
  }

  toggleVideo() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  toggleAudio() {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  endCall() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Clear remote stream
    this.remoteStream = null;

    // Unsubscribe from Firebase listeners
    if (this.firebaseUnsubscribe) {
      this.firebaseUnsubscribe();
      this.firebaseUnsubscribe = null;
    }

    // Send end call signal
    this.sendSignalingMessage({
      type: "end-call",
    });
  }

  setFirebaseUnsubscribe(unsubscribe) {
    this.firebaseUnsubscribe = unsubscribe;
  }
}

export default new WebRTCService();
