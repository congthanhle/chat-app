import React, { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { createRoom, joinRoom } from "../services/webrtcService";
import { startCall as startCallState, endCall as endCallState, joinCall as joinCallState, leaveCall as leaveCallState, listenCallState } from "../services/firebaseService";

const VideoCall = ({ roomId, username }) => {
  const localVideo = useRef();
  const remoteVideo = useRef();
  const [isInCall, setIsInCall] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [callState, setCallState] = useState(null);
  const [callEndedMessage, setCallEndedMessage] = useState("");
  const [callFullMessage, setCallFullMessage] = useState("");

  useEffect(() => {
    const unsubscribe = listenCallState(roomId, (state) => {
      setCallState(state);
      if (!state && isInCall) {
        endLocalCall();
        setCallEndedMessage("Call ended by another participant");

        setTimeout(() => {
          setCallEndedMessage("");
        }, 3000);
      }
    });

    return () => unsubscribe();
  }, [roomId, isInCall, callState, username]);

  useEffect(() => {
    return () => {
      if (isInCall) {
        leaveCallState(roomId, username).catch(console.error);
        if (localVideo.current?.srcObject) {
          localVideo.current.srcObject.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, [isInCall, roomId, username]);

  const startCall = async () => {
    try {
      setIsInCall(true);
      await startCallState(roomId, username);

      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      localVideo.current.srcObject = stream;

      const pc = await createRoom(stream, roomId);
      pc.ontrack = (event) => {
        remoteVideo.current.srcObject = event.streams[0];
        setIsConnected(true);
      };
    } catch (error) {
      console.error("Error starting call:", error);
      setIsInCall(false);
      await endCallState(roomId);
    }
  };

  const answerCall = async () => {
    try {
      setIsInCall(true);
      setCallFullMessage("");
      await joinCallState(roomId, username);

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localVideo.current.srcObject = stream;

      const pc = await joinRoom(stream, roomId);
      pc.ontrack = (event) => {
        remoteVideo.current.srcObject = event.streams[0];
        setIsConnected(true);
      };
    } catch (error) {
      console.error("Error answering call:", error);
      setIsInCall(false);

      if (error.message.includes("Call is full")) {
        setCallFullMessage("Call is full. Maximum 2 participants allowed.");
        setTimeout(() => {
          setCallFullMessage("");
        }, 5000);
      }
    }
  };
  const endLocalCall = () => {
    if (localVideo.current?.srcObject) {
      localVideo.current.srcObject.getTracks().forEach(track => track.stop());
      localVideo.current.srcObject = null;
    }
    if (remoteVideo.current?.srcObject) {
      remoteVideo.current.srcObject = null;
    }
    setIsInCall(false);
    setIsConnected(false);
  };

  const leaveCall = async () => {
    endLocalCall();
    await leaveCallState(roomId, username);
  };

  const endCall = async () => {
    endLocalCall();
    await endCallState(roomId);
  };

  return (
    <div className="space-y-4">
      {callEndedMessage && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded text-center">
          <i className="pi pi-exclamation-triangle mr-2"></i>
          {callEndedMessage}
        </div>
      )}

      {callFullMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-center">
          <i className="pi pi-times-circle mr-2"></i>
          {callFullMessage}
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        {!isInCall ? (
          <>
            {!callState ? (
              <button
                onClick={startCall}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <i className="pi pi-video"></i>
                <span>Start Call</span>
              </button>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="text-sm text-gray-600">
                  {callState.participants && callState.participants.includes(username) ? (
                    <span>You were in this call. Click to rejoin.</span>
                  ) : callState.participants && callState.participants.length >= 2 ? (
                    <span className="text-red-600 font-medium">Call is full (2/2 participants)</span>
                  ) : (
                    <span><span className="font-medium">{callState.caller}</span> is calling...</span>
                  )}
                </div>
                {(callState.participants && callState.participants.includes(username)) ||
                  (callState.participants && callState.participants.length < 2) ? (
                  <button
                    onClick={answerCall}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                  >
                    <i className="pi pi-phone"></i>
                    <span>{callState.participants && callState.participants.includes(username) ? 'Rejoin Call' : 'Join Call'}</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="bg-gray-400 text-white px-4 py-2 rounded-lg cursor-not-allowed flex items-center space-x-2"
                  >
                    <i className="pi pi-ban"></i>
                    <span>Call Full</span>
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            {callState && callState.participants && (
              <div className="text-sm text-gray-600">
                {callState.participants.length} participant{callState.participants.length !== 1 ? 's' : ''} in call
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={leaveCall}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors flex items-center space-x-2"
              >
                <i className="pi pi-sign-out"></i>
                <span>Leave Call</span>
              </button>
              <button
                onClick={endCall}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <i className="pi pi-phone-slash"></i>
                <span>End for All</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {isInCall && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <video
              ref={localVideo}
              autoPlay
              playsInline
              muted
              className="w-full h-48 bg-gray-900 rounded-lg object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              You ({username})
            </div>
          </div>
          <div className="relative">
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className="w-full h-48 bg-gray-900 rounded-lg object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {isConnected ? 'Remote User' : 'Waiting for connection...'}
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600 text-center">
        Room ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{roomId}</span>
      </div>
    </div>
  );
};
VideoCall.propTypes = {
  roomId: PropTypes.string.isRequired,
  username: PropTypes.string.isRequired,
};

export default VideoCall;

