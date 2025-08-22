import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';

const ChatApp = () => {
  const { user, token, isAuthenticated, loading, setUser, setLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token && !user) {
        try {
          const userData = await api.getMe(token);
          if (userData.message) {
            // API returned error message
            console.error('Auth check failed:', userData.message);
            localStorage.removeItem('token');
          } else {
            setUser(userData);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token, user, setUser, setLoading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <div className="text-xl font-semibold text-gray-700">Loading Chat App...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return showRegister ? (
      <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
    ) : (
      <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
    );
  }

  return (
    <div className="h-screen flex bg-gray-100">
      <ConversationList 
        onSelectConversation={setSelectedConversation}
        selectedConversationId={selectedConversation?._id}
      />
      <ChatWindow 
        conversation={selectedConversation}
      />
    </div>
  );
};

export default ChatApp;
