import React, { useState } from 'react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      onLogin({
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photo: user.photoURL
      });
    } catch (error) {
      console.error('Google login error:', error);
      alert('Google login failed: ' + error.message);
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let result;
      if (isSignUp) {
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      
      const user = result.user;
      onLogin({
        uid: user.uid,
        name: user.displayName || email.split('@')[0],
        email: user.email,
        photo: user.photoURL
      });
    } catch (error) {
      console.error('Email auth error:', error);
      alert(`${isSignUp ? 'Sign up' : 'Login'} failed: ` + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>🚀 AI Revenue Dashboard</h1>
        <p>Sign in to access your personalized analytics</p>
        
        {/* Google Login */}
        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="google-login-btn"
        >
          <img 
            src="https://developers.google.com/identity/images/g-logo.png" 
            alt="Google" 
            className="google-logo"
          />
          {loading ? 'Signing in...' : 'Continue with Google'}
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        {/* Email Login */}
        <form onSubmit={handleEmailAuth} className="email-form">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="email-input"
            required
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="password-input"
            required
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="email-auth-btn"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <p className="auth-toggle">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="toggle-btn"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
        
        <div className="features-preview">
          <h3>✨ What you'll get:</h3>
          <ul>
            <li>🤖 AI-powered revenue analysis</li>
            <li>📊 Auto-generated charts</li>
            <li>💬 Natural language queries</li>
            <li>📈 Business insights & forecasts</li>
            <li>📄 Export reports</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;
