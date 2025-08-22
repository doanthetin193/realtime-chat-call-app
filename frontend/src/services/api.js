import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

// HTTP API calls
export const api = {
  // Auth
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return response.json();
  },

  // User
  getMe: async (token) => {
    const response = await fetch(`${API_BASE_URL}/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  searchUsers: async (token, query) => {
    const response = await fetch(`${API_BASE_URL}/user/search?query=${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  // Conversations
  getConversations: async (token) => {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  createConversation: async (token, data) => {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Messages
  getMessages: async (token, conversationId, limit = 20) => {
    const response = await fetch(`${API_BASE_URL}/messages/${conversationId}?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  sendMessage: async (token, messageData) => {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(messageData),
    });
    return response.json();
  },

  // Group management
  addGroupMember: async (token, conversationId, userId) => {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId }),
    });
    return response.json();
  },

  removeGroupMember: async (token, conversationId, userId) => {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/members/${userId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  updateConversation: async (token, conversationId, data) => {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Classrooms
  listClassrooms: async (token, mineOnly = true) => {
    const response = await fetch(`${API_BASE_URL}/classrooms?mine=${mineOnly ? '1' : '0'}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },

  createClassroom: async (token, data) => {
    const response = await fetch(`${API_BASE_URL}/classrooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  joinClassroom: async (token, classroomId) => {
    const response = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
  },
};

// Socket.IO connection
export const createSocketConnection = (token) => {
  return io(SOCKET_URL, {
    auth: { token },
    autoConnect: false,
  });
};
