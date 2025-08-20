import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import GroupChatModal, { GroupSettingsModal } from './GroupChatModal';

const ConversationList = ({ onSelectConversation, selectedConversationId }) => {
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const { token, user, socket } = useAuth();

  useEffect(() => {
    if (token) {
      fetchConversations();
      fetchAllUsers();
    }
  }, [token]);

  // Listen for new messages to update conversation list
  useEffect(() => {
    if (socket) {
      socket.on('new_message', (message) => {
        setConversations(prev => prev.map(conv => 
          conv._id === message.conversation 
            ? { ...conv, lastMessage: message, updatedAt: new Date() }
            : conv
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
      });

      // Listen for online users updates
      socket.on('onlineUsers', (users) => {
        console.log('Received onlineUsers:', users);
        setOnlineUsers(users);
      });

      socket.on('userOnline', (userData) => {
        console.log('User came online:', userData);
        setOnlineUsers(prev => [...prev.filter(u => u.userId !== userData.userId), userData]);
      });

      socket.on('userOffline', (userData) => {
        console.log('User went offline:', userData);
        setOnlineUsers(prev => prev.filter(u => u.userId !== userData.userId));
      });

      return () => {
        socket.off('new_message');
        socket.off('onlineUsers');
        socket.off('userOnline');
        socket.off('userOffline');
      };
    }
  }, [socket]);

  const fetchConversations = async () => {
    try {
      const data = await api.getConversations(token);
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      // Get all users by searching with empty query
      const users = await api.searchUsers(token, '');
      // Filter out current user
      const otherUsers = users.filter(u => u._id !== user.id);
      setAllUsers(otherUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const results = await api.searchUsers(token, query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const createConversation = async (targetUserId) => {
    try {
      const conversation = await api.createConversation(token, {
        memberIds: [targetUserId],
        isGroup: false
      });
      
      setConversations(prev => [conversation, ...prev]);
      setShowNewChat(false);
      setSearchQuery('');
      setSearchResults([]);
      onSelectConversation(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const formatLastMessage = (message) => {
    if (!message) return 'No messages yet';
    if (message.type === 'image') return '📷 Image';
    return message.content;
  };

  const getConversationName = (conversation) => {
    if (conversation.isGroup) return conversation.name;
    
    const otherMember = conversation.members.find(member => member._id !== user.id);
    return otherMember ? otherMember.username : 'Unknown';
  };

  const getUserOnlineStatus = (userId) => {
    const isOnline = onlineUsers.some(u => u.userId === userId);
    console.log(`Checking online status for user ${userId}:`, isOnline, 'Online users:', onlineUsers);
    return isOnline;
  };

  const deleteConversation = async (conversationId) => {
    if (!window.confirm('Bạn có chắc muốn xóa cuộc trò chuyện này? Tất cả tin nhắn sẽ bị xóa vĩnh viễn.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Xóa conversation khỏi state
        setConversations(conversations.filter(conv => conv._id !== conversationId));
        
        // Nếu đang xem conversation này thì clear selection
        if (selectedConversationId === conversationId) {
          onSelectConversation(null);
        }
        
        alert('Đã xóa cuộc trò chuyện thành công');
      } else {
        const error = await response.json();
        alert(`Không thể xóa cuộc trò chuyện: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Lỗi khi xóa cuộc trò chuyện');
    }
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.isGroup) return '👥';
    
    const otherMember = conversation.members.find(member => member._id !== user.id);
    return otherMember?.avatarUrl || '👤';
  };

  if (loading) {
    return (
      <div className="w-full md:w-1/3 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-gray-500">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowGroupModal(true)}
              className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600"
              title="Create Group"
            >
              👥
            </button>
            <button
              onClick={() => setShowNewChat(!showNewChat)}
              className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
              title="New Chat"
            >
              ✏️
            </button>
          </div>
        </div>

        {/* New chat search */}
        {showNewChat && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {searchResults.length > 0 && (
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                {searchResults.map(user => (
                  <button
                    key={user._id}
                    onClick={() => createConversation(user._id)}
                    className="w-full p-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <span className="text-2xl">{user.avatarUrl || '👤'}</span>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {/* Recent Conversations */}
        {conversations.length > 0 && (
          <div>
            <h3 className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50">Recent Chats</h3>
            {conversations.map(conversation => (
              <div
                key={conversation._id}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex items-center space-x-3 ${
                  selectedConversationId === conversation._id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div 
                  onClick={() => onSelectConversation(conversation)}
                  className="flex items-center space-x-3 flex-1"
                >
                  <div className="relative">
                    <div className="text-3xl">
                      {getConversationAvatar(conversation)}
                    </div>
                    {/* Online status for 1-1 chats */}
                    {!conversation.isGroup && (() => {
                      const otherMember = conversation.members?.find(member => member._id !== user.id);
                      if (!otherMember) return null;
                      const isOnline = getUserOnlineStatus(otherMember._id);
                      return (
                        <div className={isOnline ? 'online-indicator' : 'offline-indicator'}></div>
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-900 truncate">
                        {getConversationName(conversation)}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {conversation.updatedAt && new Date(conversation.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {formatLastMessage(conversation.lastMessage)}
                    </p>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center space-x-1">
                  {/* Group settings button */}
                  {conversation.isGroup && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGroupSettings(conversation);
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1"
                      title="Group Settings"
                    >
                      ⚙️
                    </button>
                  )}
                  
                  {/* Delete conversation button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation._id);
                    }}
                    className="text-gray-400 hover:text-red-600 p-1"
                    title="Delete Conversation"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Available Users */}
        <div>
          <h3 className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50">Available Users</h3>
          {allUsers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <div className="text-4xl mb-2">👋</div>
              <p>No other users found. Invite friends to join!</p>
            </div>
          ) : (
            allUsers.map(availableUser => {
              // Check if already has conversation with this user
              const existingConversation = conversations.find(conv => 
                !conv.isGroup && 
                conv.members?.some(member => member._id === availableUser._id)
              );
              
              const isOnline = getUserOnlineStatus(availableUser._id);
              
              return (
                <div
                  key={availableUser._id}
                  onClick={() => {
                    if (existingConversation) {
                      onSelectConversation(existingConversation);
                    } else {
                      // Instead of creating conversation immediately, pass user info to start chat
                      onSelectConversation({
                        _id: `temp_${availableUser._id}`,
                        isTemp: true,
                        targetUser: availableUser,
                        members: [user, availableUser],
                        isGroup: false
                      });
                    }
                  }}
                  className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex items-center space-x-3"
                >
                  <div className="relative">
                    <div className="text-3xl">{availableUser.avatarUrl || '👤'}</div>
                    {/* Online status indicator */}
                    <div className={isOnline ? 'online-indicator' : 'offline-indicator'}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {availableUser.username}
                    </h3>
                    <p className="text-sm truncate">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></span>
                      {isOnline ? 'Online' : 'Offline'} • {availableUser.email}
                    </p>
                  </div>
                  {existingConversation && (
                    <div className="text-xs text-blue-500">Chat exists</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Group Chat Modal */}
      <GroupChatModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupCreated={(group) => {
          setConversations(prev => [group, ...prev]);
          onSelectConversation(group);
        }}
      />

      {/* Group Settings Modal */}
      <GroupSettingsModal
        isOpen={!!showGroupSettings}
        onClose={() => setShowGroupSettings(null)}
        conversation={showGroupSettings}
        onConversationUpdated={fetchConversations}
      />
    </div>
  );
};

export default ConversationList;
