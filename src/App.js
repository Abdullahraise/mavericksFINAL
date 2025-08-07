import { useState, useEffect } from "react";
import { onAuthStateChange } from "./firebaseConfig";
import AuthPage from './pages/AuthPage';
import UserDashboard from "./user/components/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import LoadingSpinner from "./components/LoadingSpinner";
import "./styles.css";
import "./analytics/components/chat-styles.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          role: user.email === 'admin@mavericks.com' ? 'admin' : 'user'
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Loading Mavericks Coding Platform..." />
      </div>
    );
  }

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  // Render admin or user dashboard based on role
  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return <UserDashboard user={user} onLogout={handleLogout} />;
}
