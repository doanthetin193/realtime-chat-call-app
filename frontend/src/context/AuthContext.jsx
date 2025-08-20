import { createContext, useContext, useReducer, useEffect } from 'react';
import { createSocketConnection } from '../services/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  socket: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      if (state.socket) {
        state.socket.disconnect();
      }
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        socket: null,
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_SOCKET':
      return { ...state, socket: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true, loading: false };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = (token, user) => {
    dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
    
    // Create socket connection after login
    const socket = createSocketConnection(token);
    socket.connect();
    dispatch({ type: 'SET_SOCKET', payload: socket });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const setUser = (user) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  // Initialize socket if token exists
  useEffect(() => {
    if (state.token && !state.socket && state.user) {
      const socket = createSocketConnection(state.token);
      socket.connect();
      dispatch({ type: 'SET_SOCKET', payload: socket });
    }
  }, [state.token, state.user, state.socket]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        setUser,
        setLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
