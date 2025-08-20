import { useState, useRef, useEffect } from 'react';

const VideoCall = ({ socket, currentUser, targetUser, onEndCall }) => {
    const [isCallActive, setIsCallActive] = useState(false);
    const [isIncomingCall, setIsIncomingCall] = useState(false);
    const [incomingCallData, setIncomingCallData] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);

    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('incomingCall', handleIncomingCall);
        socket.on('callAccepted', handleCallAccepted);
        socket.on('callRejected', handleCallRejected);
        socket.on('callEnded', handleCallEnded);
        socket.on('iceCandidate', handleIceCandidate);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);

        return () => {
            socket.off('incomingCall');
            socket.off('callAccepted');
            socket.off('callRejected');
            socket.off('callEnded');
            socket.off('iceCandidate');
            socket.off('offer');
            socket.off('answer');
        };
    }, [socket]);

    const handleIncomingCall = (data) => {
        setIsIncomingCall(true);
        setIncomingCallData(data);
    };

    const startCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideoEnabled,
                audio: !isMuted
            });
            
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            const peerConnection = new RTCPeerConnection(iceServers);
            peerConnectionRef.current = peerConnection;

            stream.getTracks().forEach(track => {
                peerConnection.addTrack(track, stream);
            });

            peerConnection.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('iceCandidate', {
                        candidate: event.candidate,
                        targetUserId: targetUser._id
                    });
                }
            };

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            socket.emit('makeCall', {
                targetUserId: targetUser._id,
                offer: offer
            });

            setIsCallActive(true);
        } catch (error) {
            console.error('Error starting call:', error);
            alert('Could not access camera/microphone');
        }
    };

    const acceptCall = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: isVideoEnabled,
                audio: !isMuted
            });
            
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            const peerConnection = new RTCPeerConnection(iceServers);
            peerConnectionRef.current = peerConnection;

            stream.getTracks().forEach(track => {
                peerConnection.addTrack(track, stream);
            });

            peerConnection.ontrack = (event) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                }
            };

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('iceCandidate', {
                        candidate: event.candidate,
                        targetUserId: incomingCallData.from._id
                    });
                }
            };

            await peerConnection.setRemoteDescription(incomingCallData.offer);
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            socket.emit('acceptCall', {
                targetUserId: incomingCallData.from._id,
                answer: answer
            });

            setIsCallActive(true);
            setIsIncomingCall(false);
        } catch (error) {
            console.error('Error accepting call:', error);
            alert('Could not access camera/microphone');
        }
    };

    const rejectCall = () => {
        socket.emit('rejectCall', {
            targetUserId: incomingCallData.from._id
        });
        setIsIncomingCall(false);
        setIncomingCallData(null);
    };

    const endCall = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }
        
        socket.emit('endCall', {
            targetUserId: targetUser?._id || incomingCallData?.from._id
        });

        setIsCallActive(false);
        setIsIncomingCall(false);
        setIncomingCallData(null);
        if (onEndCall) onEndCall();
    };

    const handleCallAccepted = async (data) => {
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(data.answer);
        }
    };

    const handleCallRejected = () => {
        alert('Call was rejected');
        endCall();
    };

    const handleCallEnded = () => {
        endCall();
    };

    const handleIceCandidate = async (data) => {
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(data.candidate);
        }
    };

    const handleOffer = async (data) => {
        // This is handled by incomingCall event
    };

    const handleAnswer = async (data) => {
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(data.answer);
        }
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = isMuted;
                setIsMuted(!isMuted);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !isVideoEnabled;
                setIsVideoEnabled(!isVideoEnabled);
            }
        }
    };

    if (isIncomingCall) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h3 className="text-lg font-semibold mb-4">
                        Incoming call from {incomingCallData?.from?.username}
                    </h3>
                    <div className="flex gap-4">
                        <button
                            onClick={acceptCall}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            Accept
                        </button>
                        <button
                            onClick={rejectCall}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                            Reject
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (isCallActive) {
        return (
            <div className="fixed inset-0 bg-black z-50">
                <div className="relative w-full h-full">
                    {/* Remote video (main) */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Local video (small) */}
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="absolute top-4 right-4 w-48 h-36 object-cover rounded-lg border-2 border-white"
                    />
                    
                    {/* Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
                        <button
                            onClick={toggleMute}
                            className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} text-white hover:bg-opacity-80`}
                        >
                            {isMuted ? '🔇' : '🎤'}
                        </button>
                        <button
                            onClick={toggleVideo}
                            className={`p-3 rounded-full ${!isVideoEnabled ? 'bg-red-500' : 'bg-gray-700'} text-white hover:bg-opacity-80`}
                        >
                            {isVideoEnabled ? '📹' : '📵'}
                        </button>
                        <button
                            onClick={endCall}
                            className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600"
                        >
                            📞
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={startCall}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
            title="Start video call"
        >
            📹
        </button>
    );
};

export default VideoCall;
