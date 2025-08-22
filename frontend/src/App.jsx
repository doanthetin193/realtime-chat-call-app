import { AuthProvider } from './context/AuthContext';
import ChatApp from './components/ChatApp';

function App() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  );
}

export default App;
