// src/components/LoginModal.jsx
import React, { useState } from 'react';

export default function LoginModal({ onClose, onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!username.trim() || !password.trim()) {
      return setError('Username and password are required.');
    }
    if (username.length < 3) {
      return setError('Username must be at least 3 characters long.');
    }
    if (password.length < 4) {
      return setError('Password must be at least 4 characters long.');
    }
    if (isRegister && password !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const json = await response.json();

      if (json.status === 'success') {
        onLoginSuccess(json.data);
        onClose();
      } else {
        setError(json.message || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Auth request error:', err);
      setError('Connection failed. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '10px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        animation: 'fadeIn 0.25s ease-out'
      }}>
        {/* Header */}
        <div style={{
          background: '#0f2b5c',
          color: '#ffffff',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>
            {isRegister ? 'Register IRCTC Companion Account' : 'Login to IRCTC Companion'}
          </h3>
          <button 
            id="login-modal-close"
            onClick={onClose} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#ffffff', 
              fontSize: '1.5rem', 
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {error && (
            <div style={{
              background: '#fce8e6',
              color: '#c5221f',
              padding: '0.75rem',
              borderRadius: '5px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              border: '1px solid #fad2cf',
              fontWeight: 500
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Username
            </label>
            <input
              id="auth-username"
              type="text"
              placeholder="e.g. rahul123"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '0.9rem',
                outline: 'none'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                fontSize: '0.9rem',
                outline: 'none'
              }}
              required
            />
          </div>

          {isRegister && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                Confirm Password
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
                required
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            id="auth-submit"
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#003399',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '0.65rem',
              fontSize: '0.95rem',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <span className="spinner" style={{
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.4)',
                borderTopColor: '#ffffff',
                borderRadius: '50%',
                display: 'inline-block',
                animation: 'spin 0.8s linear infinite'
              }}></span>
            ) : null}
            {isRegister ? 'Create Account' : 'Login'}
          </button>

          {/* Switch toggle */}
          <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isRegister ? (
              <>
                Already have an account?{' '}
                <button
                  id="auth-toggle-login"
                  type="button"
                  onClick={() => { setIsRegister(false); setError(null); }}
                  style={{ background: 'none', border: 'none', color: '#003399', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                >
                  Login here
                </button>
              </>
            ) : (
              <>
                New to Vacancy Hub?{' '}
                <button
                  id="auth-toggle-register"
                  type="button"
                  onClick={() => { setIsRegister(true); setError(null); }}
                  style={{ background: 'none', border: 'none', color: '#003399', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
                >
                  Register now
                </button>
              </>
            )}
          </div>
        </form>
      </div>
      
      {/* CSS injection for simple loading spinner and fade in animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
