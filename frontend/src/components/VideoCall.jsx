import { useState, useRef, useEffect } from 'react';

// Supports 1:1 and group calls. For group, create a peer connection per remote member.
const VideoCall = ({ socket, currentUser, targetUser, conversation, onEndCall }) => {
    const [isCallActive, setIsCallActive] = useState(false);
    const [isIncomingCall, setIsIncomingCall] = useState(false);
    const [incomingCallData, setIncomingCallData] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isPreCall, setIsPreCall] = useState(true);
    const MAX_GROUP_PEERS = 6; // mesh limit for stability
    
    const localVideoRef = useRef(null);
    const remoteVideosRef = useRef({}); // userId -> HTMLVideoElement
    const localStreamRef = useRef(null);
    const peersRef = useRef(new Map()); // userId -> RTCPeerConnection

    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('incoming_call', handleIncomingCall);
        socket.on('call_answered', handleCallAnswered);
        socket.on('call_rejected', handleCallRejected);
        socket.on('call_ended', handleCallEnded);
        socket.on('ice_candidate', handleIceCandidate);

        return () => {
            socket.off('incoming_call');
            socket.off('call_answered');
            socket.off('call_rejected');
            socket.off('call_ended');
            socket.off('ice_candidate');
        };
    }, [socket]);

    const handleIncomingCall = (data) => {
        setIsIncomingCall(true);
        setIncomingCallData(data);
    };

    const startCall = async (opts = { video: true }) => {
        try {
            // Group pre-check for scalability
            if (conversation && conversation.isGroup) {
                const totalOthers = (conversation.members || []).filter(m => m._id !== currentUser.id).length;
                if (totalOthers > MAX_GROUP_PEERS) {
                    alert(`Group calls are limited to ${MAX_GROUP_PEERS} participants for stability. Please create a smaller subgroup.`);
                    return;
                }
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: opts.video,
                audio: !isMuted
            });
            
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Determine targets: single targetUser or all members in group except self
            const targetIds = targetUser
                ? [targetUser._id]
                : (conversation?.members || []).map(m => m._id).filter(id => id !== currentUser.id);

            // Create a peer connection per target
            for (const uid of targetIds) {
                const pc = new RTCPeerConnection(iceServers);
                peersRef.current.set(uid, pc);

                stream.getTracks().forEach(track => {
                    pc.addTrack(track, stream);
                });

                pc.ontrack = (event) => {
                    attachRemoteStream(uid, event.streams[0]);
                };

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        socket.emit('ice_candidate', {
                            candidate: event.candidate,
                            targetUserId: uid
                        });
                    }
                };

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                socket.emit('call_user', {
                    targetUserId: uid,
                    offer,
                    conversationId: conversation?._id
                });
            }

            setIsCallActive(true);
            setIsPreCall(false);
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

            const callerId = incomingCallData.from;
            const pc = new RTCPeerConnection(iceServers);
            peersRef.current.set(callerId, pc);

            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            pc.ontrack = (event) => {
                attachRemoteStream(callerId, event.streams[0]);
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice_candidate', {
                        candidate: event.candidate,
                        targetUserId: callerId
                    });
                }
            };

            await pc.setRemoteDescription(incomingCallData.offer);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit('call_answer', {
                targetUserId: callerId,
                answer
            });

            setIsCallActive(true);
            setIsIncomingCall(false);
            setIsPreCall(false);
        } catch (error) {
            console.error('Error accepting call:', error);
            alert('Could not access camera/microphone');
        }
    };

    const rejectCall = () => {
        socket.emit('call_reject', {
            targetUserId: incomingCallData.from
        });
        setIsIncomingCall(false);
        setIncomingCallData(null);
    };

    const endCall = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        // Close all peer connections
        peersRef.current.forEach(pc => pc.close());
        peersRef.current.clear();
        
        // Notify others (best-effort to last caller/targets not strictly needed in group end)
        // No-op: in a real app you'd broadcast to room
        if (onEndCall) onEndCall();
        setIsCallActive(false);
        setIsIncomingCall(false);
        setIncomingCallData(null);
        setIsPreCall(true);
    };

    const handleCallAnswered = async ({ from, answer }) => {
        const pc = peersRef.current.get(from);
        if (pc) {
            await pc.setRemoteDescription(answer);
        }
    };

    const handleCallRejected = () => {
        alert('Call was rejected');
        endCall();
    };

    const handleCallEnded = () => {
        endCall();
    };

    const handleIceCandidate = async ({ from, candidate }) => {
        const pc = peersRef.current.get(from);
        if (pc) {
            await pc.addIceCandidate(candidate);
        }
    };

    const attachRemoteStream = (userId, stream) => {
        if (!remoteVideosRef.current[userId]) {
            const video = document.createElement('video');
            video.autoplay = true;
            video.playsInline = true;
            video.className = 'w-1/3 h-48 object-cover rounded-lg border-2 border-white';
            remoteVideosRef.current[userId] = video;
            const container = document.getElementById('remote-videos-container');
            if (container) container.appendChild(video);
        }
        remoteVideosRef.current[userId].srcObject = stream;
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

    const toggleScreenShare = async () => {
        try {
            if (!isScreenSharing) {
                const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = displayStream.getVideoTracks()[0];
                // Replace the video sender track in all peer connections
                peersRef.current.forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender) sender.replaceTrack(screenTrack);
                });
                if (localVideoRef.current) localVideoRef.current.srcObject = displayStream;
                setIsScreenSharing(true);
                screenTrack.onended = () => {
                    // revert back to camera
                    if (localStreamRef.current) {
                        const camTrack = localStreamRef.current.getVideoTracks()[0];
                        peersRef.current.forEach(pc => {
                            const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                            if (sender) sender.replaceTrack(camTrack);
                        });
                        if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
                        setIsScreenSharing(false);
                    }
                };
            } else {
                // stop screen and revert
                if (localStreamRef.current) {
                    const camTrack = localStreamRef.current.getVideoTracks()[0];
                    peersRef.current.forEach(pc => {
                        const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                        if (sender) sender.replaceTrack(camTrack);
                    });
                    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
                    setIsScreenSharing(false);
                }
            }
        } catch (e) {
            console.error('Screen share error', e);
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
                    {/* Remote videos grid */}
                    <div id="remote-videos-container" className="absolute inset-0 grid grid-cols-3 gap-2 p-2"></div>
                    
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
                            onClick={toggleScreenShare}
                            className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-600' : 'bg-gray-700'} text-white hover:bg-opacity-80`}
                        >
                            🖥️
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
        <div className="flex items-center gap-2">
            {conversation?.isGroup && (
                <span className="text-xs text-gray-500">Group call limit: {MAX_GROUP_PEERS}</span>
            )}
            <button
                onClick={() => startCall({ video: true })}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                title="Start video call"
            >
                📹
            </button>
            <button
                onClick={() => startCall({ video: false })}
                className="p-2 text-green-600 hover:bg-green-50 rounded"
                title="Start audio-only call"
            >
                🎙️
            </button>
        </div>
    );
};

export default VideoCall;
