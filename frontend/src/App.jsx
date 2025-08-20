import { AuthProvider } from './context/AuthContext';
import ChatApp from './components/ChatApp';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
}

export default App;
