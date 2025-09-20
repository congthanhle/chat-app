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
      // Try to get user media with fallback constraints
      let constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      };

      try {
        // Try with ideal constraints first
        this.localStream =
          await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        console.warn(
          "Failed with ideal constraints, trying basic constraints:",
          error
        );

        // Fallback to basic constraints
        constraints = {
          video: true,
          audio: true,
        };

        try {
          this.localStream =
            await navigator.mediaDevices.getUserMedia(constraints);
        } catch (fallbackError) {
          console.warn(
            "Failed with basic constraints, trying audio only:",
            fallbackError
          );

          // Last fallback - audio only
          constraints = {
            video: false,
            audio: true,
          };

          this.localStream =
            await navigator.mediaDevices.getUserMedia(constraints);
        }
      }

      // Create peer connection
      this.peerConnection = new RTCPeerConnection(this.configuration);

      // Add local stream to peer connection
      this.localStream.getTracks().forEach((track) => {
        console.log("Adding local track to peer connection:", track.kind);
        this.peerConnection.addTrack(track, this.localStream);
      });

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        console.log("Received remote track:", event.track.kind);
        this.remoteStream = event.streams[0];
        console.log(
          "Remote stream received with tracks:",
          this.remoteStream.getTracks().length
        );
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
    if (!this.peerConnection) {
      console.error("Cannot create offer: peer connection not established");
      return;
    }

    try {
      console.log("Creating offer...");
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await this.peerConnection.setLocalDescription(offer);
      console.log("Offer created and set as local description");

      this.sendSignalingMessage({
        type: "offer",
        offer: offer,
      });
      console.log("Offer sent via signaling");
    } catch (error) {
      console.error("Error creating offer:", error);
      throw error;
    }
  }

  async createAnswer(offer) {
    if (!this.peerConnection) {
      console.error("Cannot create answer: peer connection not established");
      return;
    }

    try {
      console.log("Received offer, creating answer...");
      await this.peerConnection.setRemoteDescription(offer);
      const answer = await this.peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await this.peerConnection.setLocalDescription(answer);
      console.log("Answer created and set as local description");

      this.sendSignalingMessage({
        type: "answer",
        answer: answer,
      });
      console.log("Answer sent via signaling");
    } catch (error) {
      console.error("Error creating answer:", error);
      throw error;
    }
  }

  async handleAnswer(answer) {
    if (!this.peerConnection) {
      console.error("Cannot handle answer: peer connection not established");
      return;
    }

    try {
      console.log("Received answer, setting as remote description...");
      await this.peerConnection.setRemoteDescription(answer);
      console.log("Answer set as remote description successfully");
    } catch (error) {
      console.error("Error handling answer:", error);
      throw error;
    }
  }

  async handleIceCandidate(candidate) {
    if (!this.peerConnection) {
      console.error(
        "Cannot handle ICE candidate: peer connection not established"
      );
      return;
    }

    try {
      console.log("Adding ICE candidate...");
      await this.peerConnection.addIceCandidate(candidate);
      console.log("ICE candidate added successfully");
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
      // Don't throw here as ICE candidates can fail normally
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
