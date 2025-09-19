import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import webrtcService from '../services/webrtcService';
import {
  listenVideoCallSignals,
  createVideoCallSession,
  joinVideoCallSession,
  endVideoCallSession,
  listenVideoCallSession,
  getVideoCallSession,
  sendMessage
} from '../services/firebaseService';

function VideoCall({ roomId, username, isOpen, onClose }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isInCall, setIsInCall] = useState(false);
  const [callStatus, setCallStatus] = useState('idle');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callSession, setCallSession] = useState(null);
  const [isInitiator, setIsInitiator] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const signalUnsubscribeRef = useRef(null);
  const sessionUnsubscribeRef = useRef(null);

  useEffect(() => {
    if (isOpen && roomId && username) {
      initializeVideoCall();
    }

    return () => {
      cleanup();
    };
  }, [isOpen, roomId, username]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const initializeVideoCall = async () => {
    try {
      // Listen for session changes first
      sessionUnsubscribeRef.current = listenVideoCallSession(roomId, handleSessionChange);

      // Listen for WebRTC signals
      signalUnsubscribeRef.current = listenVideoCallSignals(roomId, handleSignal);

      // Check if there's already an active call
      const existingSession = await getVideoCallSession(roomId);

      if (existingSession) {
        if (existingSession.participants.length >= 2) {
          alert('Video call is already in progress with maximum participants');
          onClose();
          return;
        }

        if (!existingSession.participants.includes(username)) {
          // Set initial status for joining
          setCallStatus('idle');
          setCallSession(existingSession);
        } else {
          // Rejoin existing call
          setIsInitiator(existingSession.initiator === username);
          await rejoinCall();
        }
      }

    } catch (error) {
      console.error('Error initializing video call:', error);
      setCallStatus('error');
    }
  };

  const handleSessionChange = async (session) => {
    console.log('Session changed:', session);
    setCallSession(session);

    if (!session) {
      if (isInCall) {
        setCallStatus('ended');
      }
      return;
    }

    if (!session.participants.includes(username) && session.participants.length < 2) {
      setCallStatus('idle');
      return;
    }

    if (session.status === 'active' && session.participants.includes(username)) {
      if (!isInCall && callStatus !== 'connected') {
        setCallStatus('connecting');
      }

      // If we're the initiator and someone just joined, create offer
      if (isInitiator && session.participants.length === 2 && isInCall) {
        setTimeout(() => {
          console.log('Creating offer as initiator...');
          webrtcService.createOffer();
        }, 1000);
      }
    }
  };

  const startCall = async () => {
    try {
      setCallStatus('calling');
      setIsInitiator(true);

      // Create call session
      await createVideoCallSession(roomId, username);

      // Send notification message
      await sendMessage(roomId, 'System', `${username} started a video call`);

      // Initialize WebRTC
      const stream = await webrtcService.initializeCall(roomId, username, true);
      setLocalStream(stream);
      setIsInCall(true);

      // Setup WebRTC callbacks
      webrtcService.onRemoteStream((stream) => {
        setRemoteStream(stream);
        setCallStatus('connected');
      });

      webrtcService.onConnectionStateChange((state) => {
        console.log('Connection state:', state);
        if (state === 'connected') {
          setCallStatus('connected');
        } else if (state === 'disconnected' || state === 'failed') {
          endCall();
        }
      });

      // Create offer when someone joins (handled in handleSessionChange)

    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('error');
    }
  };

  const joinCall = async () => {
    try {
      setCallStatus('connecting');

      // Join call session
      const joined = await joinVideoCallSession(roomId, username);

      if (!joined) {
        alert('Unable to join the call');
        onClose();
        return;
      }

      // Send notification message
      await sendMessage(roomId, 'System', `${username} joined the video call`);

      // Initialize WebRTC
      const stream = await webrtcService.initializeCall(roomId, username, false);
      setLocalStream(stream);
      setIsInCall(true);

      // Setup WebRTC callbacks
      webrtcService.onRemoteStream((stream) => {
        setRemoteStream(stream);
        setCallStatus('connected');
      });

      webrtcService.onConnectionStateChange((state) => {
        console.log('Connection state:', state);
        if (state === 'connected') {
          setCallStatus('connected');
        } else if (state === 'disconnected' || state === 'failed') {
          endCall();
        }
      });

      // Don't create offer here - wait for the initiator to create it
      // The initiator should create the offer when they see someone joined

    } catch (error) {
      console.error('Error joining call:', error);
      setCallStatus('error');
    }
  };

  const rejoinCall = async () => {
    // Similar to joinCall but without joining session again
    try {
      setCallStatus('connecting');

      const stream = await webrtcService.initializeCall(roomId, username, isInitiator);
      setLocalStream(stream);
      setIsInCall(true);

      webrtcService.onRemoteStream((stream) => {
        setRemoteStream(stream);
        setCallStatus('connected');
      });

      webrtcService.onConnectionStateChange((state) => {
        if (state === 'connected') {
          setCallStatus('connected');
        } else if (state === 'disconnected' || state === 'failed') {
          endCall();
        }
      });

    } catch (error) {
      console.error('Error rejoining call:', error);
      setCallStatus('error');
    }
  };

  const handleSignal = async (signalData) => {
    if (!signalData || signalData.from === username) return;

    try {
      switch (signalData.type) {
        case 'offer':
          await webrtcService.createAnswer(signalData.offer);
          break;
        case 'answer':
          await webrtcService.handleAnswer(signalData.answer);
          break;
        case 'ice-candidate':
          await webrtcService.handleIceCandidate(signalData.candidate);
          break;
        case 'end-call':
          endCall();
          break;
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  };

  const endCall = async () => {
    try {
      setCallStatus('ended');

      // Send notification message
      await sendMessage(roomId, 'System', `${username} left the video call`);

      // End WebRTC call
      webrtcService.endCall();

      // End Firebase session
      await endVideoCallSession(roomId);

      cleanup();

      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Error ending call:', error);
      cleanup();
      onClose();
    }
  };

  const handleClose = () => {
    if (isInCall) {
      if (window.confirm('You are in a call. Are you sure you want to leave?')) {
        endCall();
      }
    }
  }

  const toggleVideo = () => {
    const enabled = webrtcService.toggleVideo();
    setIsVideoEnabled(enabled);
  };

  const toggleAudio = () => {
    const enabled = webrtcService.toggleAudio();
    setIsAudioEnabled(enabled);
  };

  const cleanup = () => {
    setLocalStream(null);
    setRemoteStream(null);
    setIsInCall(false);
    setCallStatus('idle');

    if (signalUnsubscribeRef.current) {
      signalUnsubscribeRef.current();
      signalUnsubscribeRef.current = null;
    }

    if (sessionUnsubscribeRef.current) {
      sessionUnsubscribeRef.current();
      sessionUnsubscribeRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-3/4 max-h-screen mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Video Call</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 capitalize">{callStatus}</span>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="pi pi-times text-xl"></i>
            </button>
          </div>
        </div>
        <div className="flex-1 bg-gray-900 relative">
          {callStatus === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="mb-4">
                  <i className="pi pi-video text-6xl text-gray-400"></i>
                </div>
                <h4 className="text-xl font-semibold mb-2">Start Video Call</h4>
                <p className="text-gray-300 mb-4">
                  Only 2 people can join a video call at a time
                </p>
                <button
                  onClick={startCall}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <i className="pi pi-phone mr-2"></i>
                  Start Call
                </button>
              </div>
            </div>
          )}

          {callStatus === 'calling' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="animate-pulse mb-4">
                  <i className="pi pi-phone text-6xl text-blue-400"></i>
                </div>
                <h4 className="text-xl font-semibold mb-2">Waiting for someone to join...</h4>
                <button
                  onClick={endCall}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Cancel Call
                </button>
              </div>
            </div>
          )}

          {callSession && !callSession.participants.includes(username) && callStatus === 'idle' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="mb-4">
                  <i className="pi pi-phone text-6xl text-green-400"></i>
                </div>
                <h4 className="text-xl font-semibold mb-2">Incoming Call</h4>
                <p className="text-gray-300 mb-4">
                  {callSession.initiator} is calling
                </p>
                <div className="space-x-4">
                  <button
                    onClick={joinCall}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    <i className="pi pi-phone mr-2"></i>
                    Join Call
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    <i className="pi pi-phone-slash mr-2"></i>
                    Decline
                  </button>
                </div>
              </div>
            </div>
          )}

          {(callStatus === 'connecting' || callStatus === 'connected') && (
            <>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>

              {!remoteStream && callStatus === 'connecting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="text-center text-white">
                    <div className="animate-spin mb-4">
                      <i className="pi pi-spinner text-4xl"></i>
                    </div>
                    <p>Connecting...</p>
                  </div>
                </div>
              )}
            </>
          )}

          {callStatus === 'ended' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="mb-4">
                  <i className="pi pi-phone-slash text-6xl text-red-400"></i>
                </div>
                <h4 className="text-xl font-semibold mb-2">Call Ended</h4>
                <p className="text-gray-300">The video call has ended</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        {(callStatus === 'connecting' || callStatus === 'connected') && (
          <div className="p-4 bg-gray-100 flex justify-center space-x-4">
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full ${isVideoEnabled ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'} hover:opacity-80 transition-opacity`}
            >
              <i className={`pi ${isVideoEnabled ? 'pi-video' : 'pi-video-slash'} text-xl`}></i>
            </button>

            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full ${isAudioEnabled ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'} hover:opacity-80 transition-opacity`}
            >
              <i className={`pi ${isAudioEnabled ? 'pi-volume-up' : 'pi-volume-off'} text-xl`}></i>
            </button>

            <button
              onClick={endCall}
              className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <i className="pi pi-phone-slash text-xl"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

VideoCall.propTypes = {
  roomId: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default VideoCall;