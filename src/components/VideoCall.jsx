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
  const [hasMicrophone, setHasMicrophone] = useState(true);
  const [isCheckingMedia, setIsCheckingMedia] = useState(true);
  const [connectionTimeout, setConnectionTimeout] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const signalUnsubscribeRef = useRef(null);
  const sessionUnsubscribeRef = useRef(null);
  const processedSignalsRef = useRef(new Set());

  useEffect(() => {
    if (isOpen && roomId && username) {
      checkMediaDevices();
      initializeVideoCall();
    }

    return () => {
      cleanup();
    };
  }, [isOpen, roomId, username]);

  const checkMediaDevices = async () => {
    try {
      setIsCheckingMedia(true);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasMicrophone(false);
        setIsCheckingMedia(false);
        return;
      }

      try {
        // Try with enhanced audio constraints first
        let constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          },
          video: false
        };

        try {
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          setHasMicrophone(true);
          stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.warn('Failed with enhanced audio constraints, trying basic:', error);

          // Fallback to very basic audio
          constraints = { audio: true, video: false };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          setHasMicrophone(true);
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (error) {
        console.error('Microphone not available:', error);
        setHasMicrophone(false);
      }
    } catch (error) {
      console.error('Error checking media devices:', error);
      setHasMicrophone(false);
    } finally {
      setIsCheckingMedia(false);
    }
  };

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('Setting remote stream to video element');
      remoteVideoRef.current.srcObject = remoteStream;
      // Ensure the video is not muted and volume is set
      remoteVideoRef.current.muted = false;
      remoteVideoRef.current.volume = 1.0;
    }
  }, [remoteStream]);

  const initializeVideoCall = async () => {
    try {
      sessionUnsubscribeRef.current = listenVideoCallSession(roomId, handleSessionChange);
      signalUnsubscribeRef.current = listenVideoCallSignals(roomId, handleSignal);

      const existingSession = await getVideoCallSession(roomId);

      if (existingSession) {
        if (existingSession.participants.length >= 2) {
          alert('Video call is already in progress with maximum participants');
          onClose();
          return;
        }

        if (!existingSession.participants.includes(username)) {
          setCallStatus('idle');
          setCallSession(existingSession);
        } else {
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

    console.log('Session participants:', session.participants, 'Username:', username, 'Status:', session.status);

    if (!session.participants.includes(username) && session.participants.length < 2) {
      console.log('User not in session or session not full');
      setCallStatus('idle');
      return;
    }

    if (session.status === 'active' && session.participants.includes(username)) {
      console.log('Session is active and user is participant. isInCall:', isInCall, 'callStatus:', callStatus);
      if (!isInCall && callStatus !== 'connected') {
        setCallStatus('connecting');
      }

      // Only create offer when both participants are connected and we are the initiator
      console.log('Checking offer conditions - isInitiator:', isInitiator, 'participants:', session.participants.length, 'isInCall:', isInCall, 'hasLocalStream:', !!localStream);
      if (isInitiator && session.participants.length === 2 && isInCall && localStream) {
        // Add a longer delay to ensure both peers are ready and listening for signals
        setTimeout(() => {
          console.log('Creating offer as initiator');
          webrtcService.createOffer();
        }, 3000);
      }
    }
  };

  const startCall = async () => {
    try {
      console.log('Starting call as initiator');
      setCallStatus('calling');
      setIsInitiator(true);

      console.log('Creating video call session...');
      await createVideoCallSession(roomId, username);
      await sendMessage(roomId, 'System', `${username} started a video call`, true);

      console.log('Initializing WebRTC call...');
      const stream = await webrtcService.initializeCall(roomId, username, true);
      setLocalStream(stream);
      setIsInCall(true);
      console.log('Call initialized, isInCall set to true');
      webrtcService.onRemoteStream((stream) => {
        console.log('Remote stream received');
        setRemoteStream(stream);
        // Don't set connected here, wait for actual WebRTC connection state
      });

      webrtcService.onConnectionStateChange((state) => {
        console.log('WebRTC connection state changed to:', state);
        if (state === 'connected') {
          setCallStatus('connected');
          // Clear any connection timeout when connected
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            setConnectionTimeout(null);
          }
        } else if (state === 'connecting') {
          setCallStatus('connecting');
          // Set timeout for connecting state (30 seconds)
          const timeout = setTimeout(() => {
            console.log('Connection timeout - forcing retry');
            setCallStatus('error');
          }, 30000);
          setConnectionTimeout(timeout);
        } else if (state === 'disconnected' || state === 'failed') {
          endCall();
        }
      });

    } catch (error) {
      console.error('Error starting call:', error);

      // Provide specific error messages based on error type
      if (error.name === 'NotFoundError') {
        alert('Camera or microphone not found. Please check your devices and permissions.');
      } else if (error.name === 'NotAllowedError') {
        alert('Camera or microphone access denied. Please grant permissions and try again.');
      } else if (error.name === 'NotReadableError') {
        alert('Camera or microphone is being used by another application. Please close other apps and try again.');
      } else {
        alert(`Failed to start call: ${error.message}`);
      }

      setCallStatus('error');
      // Clean up session if it was created
      try {
        await endVideoCallSession(roomId);
      } catch (cleanupError) {
        console.error('Error cleaning up session:', cleanupError);
      }
    }
  };

  const joinCall = async () => {
    try {
      console.log('Joining call as participant');
      setCallStatus('connecting');

      console.log('Joining video call session...');
      const joined = await joinVideoCallSession(roomId, username);

      if (!joined) {
        alert('Unable to join the call');
        onClose();
        return;
      }

      await sendMessage(roomId, 'System', `${username} joined the video call`, true);

      console.log('Initializing WebRTC call...');
      const stream = await webrtcService.initializeCall(roomId, username, false);
      setLocalStream(stream);
      setIsInCall(true);
      console.log('Call initialized, isInCall set to true');

      webrtcService.onRemoteStream((stream) => {
        console.log('Remote stream received');
        setRemoteStream(stream);
        // Don't set connected here, wait for actual WebRTC connection state
      });

      webrtcService.onConnectionStateChange((state) => {
        console.log('WebRTC connection state changed to:', state);
        if (state === 'connected') {
          setCallStatus('connected');
        } else if (state === 'connecting') {
          setCallStatus('connecting');
        } else if (state === 'disconnected' || state === 'failed') {
          endCall();
        }
      });

    } catch (error) {
      console.error('Error joining call:', error);

      // Provide specific error messages based on error type
      if (error.name === 'NotFoundError') {
        alert('Camera or microphone not found. Please check your devices and permissions.');
      } else if (error.name === 'NotAllowedError') {
        alert('Camera or microphone access denied. Please grant permissions and try again.');
      } else if (error.name === 'NotReadableError') {
        alert('Camera or microphone is being used by another application. Please close other apps and try again.');
      } else {
        alert(`Failed to join call: ${error.message}`);
      }

      setCallStatus('error');
      onClose();
    }
  };

  const rejoinCall = async () => {
    try {
      setCallStatus('connecting');

      const stream = await webrtcService.initializeCall(roomId, username, isInitiator);
      setLocalStream(stream);
      setIsInCall(true);

      webrtcService.onRemoteStream((stream) => {
        console.log('Remote stream received');
        setRemoteStream(stream);
        // Don't set connected here, wait for actual WebRTC connection state
      });

      webrtcService.onConnectionStateChange((state) => {
        console.log('WebRTC connection state changed to:', state);
        if (state === 'connected') {
          setCallStatus('connected');
        } else if (state === 'connecting') {
          setCallStatus('connecting');
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

    // Create a unique signal ID for deduplication
    const signalId = `${signalData.from}_${signalData.type}_${signalData.timestamp}`;

    // Check if we've already processed this signal
    if (processedSignalsRef.current.has(signalId)) {
      console.log('Skipping duplicate signal:', signalData.type, 'from:', signalData.from);
      return;
    }

    // Mark this signal as processed
    processedSignalsRef.current.add(signalId);

    console.log('Received signal:', signalData.type, 'from:', signalData.from);

    try {
      switch (signalData.type) {
        case 'offer':
          console.log('Processing offer...');
          await webrtcService.createAnswer(signalData.offer);
          break;
        case 'answer':
          console.log('Processing answer...');
          await webrtcService.handleAnswer(signalData.answer);
          break;
        case 'ice-candidate':
          console.log('Processing ICE candidate...');
          await webrtcService.handleIceCandidate(signalData.candidate);
          break;
        case 'end-call':
          console.log('Received end call signal');
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
      if (callSession) await sendMessage(roomId, 'System', `${username} left the video call`, true);
      webrtcService.endCall();
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
    endCall();
    onClose();
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

    // Clear connection timeout
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      setConnectionTimeout(null);
    }

    // Clear processed signals
    processedSignalsRef.current.clear();

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
          {callStatus === 'idle' && (!callSession || callSession.participants.includes(username)) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="mb-4">
                  <i className="pi pi-video text-6xl text-gray-400"></i>
                </div>
                <h4 className="text-xl font-semibold mb-2">Start Video Call</h4>
                <p className="text-gray-300 mb-4">
                  Only 2 people can join a video call at a time
                </p>
                {isCheckingMedia ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin mr-2">
                      <i className="pi pi-spinner text-2xl"></i>
                    </div>
                    <span>Checking microphone...</span>
                  </div>
                ) : !hasMicrophone ? (
                  <div className="text-center">
                    <div className="mb-2 text-red-400">
                      <i className="pi pi-microphone-slash text-2xl"></i>
                    </div>
                    <p className="text-red-400 mb-4">Microphone not available</p>
                    <p className="text-sm text-gray-400 mb-4">Please check your microphone permissions and try again</p>
                    <button
                      onClick={checkMediaDevices}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      <i className="pi pi-refresh mr-2"></i>
                      Check Again
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startCall}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
                  >
                    <i className="pi pi-phone mr-2"></i>
                    Start Call
                  </button>
                )}
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
                {isCheckingMedia ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin mr-2">
                      <i className="pi pi-spinner text-2xl"></i>
                    </div>
                    <span>Checking microphone...</span>
                  </div>
                ) : !hasMicrophone ? (
                  <div className="text-center">
                    <div className="mb-2 text-red-400">
                      <i className="pi pi-microphone-slash text-2xl"></i>
                    </div>
                    <p className="text-red-400 mb-4">Cannot join - microphone not available</p>
                    <div className="space-x-2">
                      <button
                        onClick={checkMediaDevices}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        <i className="pi pi-refresh mr-2"></i>
                        Check Again
                      </button>
                      <button
                        onClick={onClose}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                      >
                        <i className="pi pi-phone-slash mr-2"></i>
                        Decline
                      </button>
                    </div>
                  </div>
                ) : (
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
                )}
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

          {callStatus === 'error' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white max-w-md mx-4">
                <div className="mb-4">
                  <i className="pi pi-exclamation-triangle text-6xl text-red-400"></i>
                </div>
                <h4 className="text-xl font-semibold mb-2">Call Error</h4>
                <p className="text-gray-300 mb-4">Unable to access camera or microphone</p>
                <div className="text-sm text-gray-400 mb-6">
                  <p className="mb-2">Troubleshooting steps:</p>
                  <ul className="text-left space-y-1">
                    <li>• Grant camera/microphone permissions</li>
                    <li>• Close other apps using your camera</li>
                    <li>• Check if devices are properly connected</li>
                    <li>• Try refreshing the page</li>
                  </ul>
                </div>
                <div className="space-x-4">
                  <button
                    onClick={() => {
                      setCallStatus('idle');
                      checkMediaDevices();
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
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
              <i className={`pi pi-video text-xl`}></i>
            </button>

            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full ${isAudioEnabled ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'} hover:opacity-80 transition-opacity`}
            >
              <i className={`pi pi-volume-up text-xl`}></i>
            </button>

            <button
              onClick={endCall}
              className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <i className="pi pi-phone text-xl"></i>
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