import React, { useState, useEffect } from 'react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '../firebaseConfig';
import { Mail, Lock, User, Eye, EyeOff, Shield } from 'lucide-react';

export default function AuthPage({ onLogin }) {
  // Check localStorage for saved form state
  const [isLogin, setIsLogin] = useState(() => {
    const saved = localStorage.getItem('authFormIsLogin');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [email, setEmail] = useState(() => {
    const saved = localStorage.getItem('authFormEmail');
    return saved || '';
  });
  const [password, setPassword] = useState('');
  const [name, setName] = useState(() => {
    const saved = localStorage.getItem('authFormName');
    return saved || '';
  });
  const [role, setRole] = useState(() => {
    const saved = localStorage.getItem('authFormRole');
    return saved || 'user';
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Save form state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('authFormIsLogin', JSON.stringify(isLogin));
    localStorage.setItem('authFormEmail', email);
    localStorage.setItem('authFormName', name);
    localStorage.setItem('authFormRole', role);
  }, [isLogin, email, name, role]);

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const userCredential = await signInWithGoogle();
      onLogin({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        role: userCredential.user.email === 'admin@mavericks.com' ? 'admin' : 'user'
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmail(email, password);
        // For login, check if email has admin role
        const isAdmin = email === 'admin@mavericks.com';
        onLogin({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName || email.split('@')[0],
          role: isAdmin ? 'admin' : 'user'
        });
      } else {
        const userCredential = await signUpWithEmail(email, password);
        // For signup, use the selected role
        onLogin({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: name || email.split('@')[0],
          role: role // Use the selected role
        });
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">M</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mavericks Coding Platform</h1>
          <p className="text-gray-600">Learn • Build • Grow</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600">
              {isLogin 
                ? 'Sign in to continue your learning journey' 
                : 'Join our community of developers'
              }
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="form-input pl-10"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <div className="flex space-x-4 mt-2">
                    <div
                      onClick={() => setRole('user')}
                      className={`flex-1 p-3 border rounded-lg flex items-center cursor-pointer transition-all ${role === 'user' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <User className={`mr-2 ${role === 'user' ? 'text-blue-500' : 'text-gray-400'}`} size={20} />
                      <div>
                        <p className={`font-medium ${role === 'user' ? 'text-blue-700' : 'text-gray-700'}`}>User</p>
                        <p className="text-xs text-gray-500">For learners and participants</p>
                      </div>
                    </div>
                    
                    <div
                      onClick={() => setRole('admin')}
                      className={`flex-1 p-3 border rounded-lg flex items-center cursor-pointer transition-all ${role === 'admin' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <Shield className={`mr-2 ${role === 'admin' ? 'text-purple-500' : 'text-gray-400'}`} size={20} />
                      <div>
                        <p className={`font-medium ${role === 'admin' ? 'text-purple-700' : 'text-gray-700'}`}>Admin</p>
                        <p className="text-xs text-gray-500">For platform administrators</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input pl-10"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary btn-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="loading-spinner mr-2"></div>
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Additional login options could go here */}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            By continuing, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}