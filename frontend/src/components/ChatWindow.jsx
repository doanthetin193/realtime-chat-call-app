import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import VideoCall from './VideoCall';
import FileUpload, { FileMessage } from './FileUpload';

const ChatWindow = ({ conversation }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState([]);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const { token, user, socket } = useAuth();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      
      // Join conversation room
      if (socket) {
        socket.emit('join_conversation', conversation._id);
      }
    }
  }, [conversation, socket]);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stop_typing', handleStopTyping);
      
      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stop_typing', handleStopTyping);
      };
    }
  }, [socket, conversation]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!conversation || conversation.isTemp) {
      setMessages([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await api.getMessages(token, conversation._id, 50);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    if (message.conversation === conversation?._id) {
      setMessages(prev => [...prev, message]);
    }
  };

  const handleUserTyping = ({ userId, username, conversationId }) => {
    if (conversationId === conversation?._id && userId !== user.id) {
      setTyping(prev => [...prev.filter(u => u.userId !== userId), { userId, username }]);
    }
  };

  const handleStopTyping = ({ userId, conversationId }) => {
    if (conversationId === conversation?._id) {
      setTyping(prev => prev.filter(u => u.userId !== userId));
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || !socket) return;

    try {
      // If it's a temporary conversation, create it first
      if (conversation.isTemp) {
        const newConversation = await api.createConversation(token, {
          memberIds: [conversation.targetUser._id],
          isGroup: false
        });
        
        // Send message to the new conversation
        const messageData = {
          conversationId: newConversation._id,
          content: newMessage.trim(),
          type: 'text'
        };
        
        socket.emit('send_message', messageData);
        setNewMessage('');
        
        // Update parent component with real conversation
        window.location.reload(); // Simple way to refresh conversation list
        return;
      }

      const messageData = {
        conversationId: conversation._id,
        content: newMessage.trim(),
        type: 'text'
      };

      // Send via Socket.IO for real-time delivery
      socket.emit('send_message', messageData);
      setNewMessage('');
      
      // Stop typing indicator
      socket.emit('typing_stop', { conversationId: conversation._id });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const sendFileMessage = async (fileData) => {
    if (!conversation || !socket) return;

    const messageData = {
      conversationId: conversation._id,
      content: fileData.fileName,
      type: 'file',
      fileName: fileData.fileName,
      fileUrl: fileData.fileUrl,
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType
    };

    try {
      socket.emit('send_message', messageData);
      setShowFileUpload(false);
    } catch (error) {
      console.error('Error sending file:', error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (socket && conversation) {
      // Send typing start
      socket.emit('typing_start', { conversationId: conversation._id });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing_stop', { conversationId: conversation._id });
      }, 2000);
    }
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConversationName = () => {
    if (!conversation) return '';
    if (conversation.isGroup) return conversation.name;
    if (conversation.isTemp) return conversation.targetUser.username;
    
    const otherMember = conversation.members?.find(member => member._id !== user.id);
    return otherMember?.username || 'Unknown';
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-medium mb-2">Welcome to Chat App</h3>
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">
              {conversation.isGroup ? '👥' : '👤'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{getConversationName()}</h3>
              <div className="text-sm text-gray-500">
                {conversation.isTemp ? (
                  'Start a conversation...'
                ) : conversation.isGroup ? (
                  `${conversation.members?.length} members`
                ) : (
                  'Active now'
                )}
              </div>
            </div>
          </div>
          
          {/* Video Call Button (only for non-group chats and not temp conversations) */}
          {!conversation.isGroup && !conversation.isTemp && (
            <VideoCall
              socket={socket}
              currentUser={user}
              targetUser={conversation.members?.find(member => member._id !== user.id)}
              onEndCall={() => console.log('Call ended')}
            />
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 chat-messages">
        {loading ? (
          <div className="flex justify-center">
            <div className="text-gray-500">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">👋</div>
            <p>
              {conversation.isTemp 
                ? `Say hello to ${conversation.targetUser.username}!`
                : "Start the conversation by sending a message!"
              }
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender._id === user.id;
            const showAvatar = !isOwn && (
              index === 0 || 
              messages[index - 1].sender._id !== message.sender._id
            );
            const nextMessage = messages[index + 1];
            const isLastInGroup = !nextMessage || nextMessage.sender._id !== message.sender._id;
            
            return (
              <div key={message._id} className={`flex mb-1 message-fade-in ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar cho người khác */}
                  {!isOwn && (
                    <div className="flex items-end mr-2">
                      {showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">
                          {message.sender.avatarUrl || message.sender.username?.charAt(0)?.toUpperCase() || '👤'}
                        </div>
                      ) : (
                        <div className="w-8"></div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-col">
                    {/* Tên người gửi (chỉ hiện cho tin nhắn đầu tiên của người khác) */}
                    {!isOwn && showAvatar && (
                      <div className="text-xs text-gray-500 mb-1 px-3">
                        {message.sender.username}
                      </div>
                    )}
                    
                    {/* Bubble tin nhắn */}
                    <div className={`relative px-3 py-2 rounded-2xl message-bubble ${
                      isOwn 
                        ? 'bg-blue-500 text-white rounded-br-md shadow-md' 
                        : 'bg-gray-200 text-gray-900 rounded-bl-md shadow-sm'
                    } ${!isLastInGroup ? 'mb-1' : 'mb-2'}`}>
                      
                      {/* Render different message types */}
                      {message.type === 'file' ? (
                        <FileMessage message={message} />
                      ) : (
                        <div className="break-words text-sm leading-relaxed">{message.content}</div>
                      )}
                      
                      {/* Thời gian - chỉ hiện cho tin nhắn cuối cùng trong nhóm */}
                      {isLastInGroup && (
                        <div className={`text-xs mt-1 ${
                          isOwn ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatMessageTime(message.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Avatar cho mình (có thể ẩn hoặc hiện nhỏ) */}
                  {isOwn && (
                    <div className="flex items-end ml-2">
                      {showAvatar ? (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
                          {user.username?.charAt(0)?.toUpperCase() || '👤'}
                        </div>
                      ) : (
                        <div className="w-6"></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing Indicator */}
        {typing.length > 0 && (
          <div className="flex justify-start mb-2">
            <div className="flex">
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm mr-2">
                {typing[0]?.username?.charAt(0)?.toUpperCase() || '👤'}
              </div>
              <div className="bg-gray-200 rounded-2xl rounded-bl-md px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={sendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setShowFileUpload(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            title="Attach file"
          >
            📎
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="w-full p-3 pr-12 border border-gray-300 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* File Upload Modal */}
      {showFileUpload && (
        <FileUpload
          onFileSelect={sendFileMessage}
          onCancel={() => setShowFileUpload(false)}
        />
      )}
    </div>
  );
};

export default ChatWindow;
