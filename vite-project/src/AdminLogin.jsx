import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAdminSession } from './utils/auth';
import { Lock, User, ShieldAlert, ArrowRight, Home } from 'lucide-react';
import './style.css';

export default function AdminLogin() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [authShake, setAuthShake] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already logged in as admin
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession) {
      try {
        const session = JSON.parse(adminSession);
        if (session.isAdmin && session.expiresAt > Date.now()) {
          navigate('/admin/dashboard', { replace: true });
        }
      } catch (e) {
        // Invalid session, continue to login
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Hardcoded admin credentials
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD = 'admin@123';

    // Validate credentials (frontend-only validation)
    if (formData.username !== ADMIN_USERNAME || formData.password !== ADMIN_PASSWORD) {
      setError('Invalid admin credentials. Please try again.');
      setLoading(false);
      setAuthShake(true);
      setTimeout(() => setAuthShake(false), 500);
      return;
    }

    // Set admin session directly
    setAdminSession({
      username: ADMIN_USERNAME,
      isAdmin: true,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });

    // Navigate to admin dashboard
    navigate('/admin/dashboard', { replace: true });
    setLoading(false);
  };

  return (
    <div 
      className="login-page-wrapper" 
      style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Animated Background Orbs */}
      <div className="login-background-shapes">
        <div 
          className="shape" 
          style={{ 
            width: '400px', 
            height: '400px', 
            background: 'rgba(59, 130, 246, 0.08)', 
            top: '-150px', 
            left: '-150px',
            filter: 'blur(100px)' 
          }}
        />
        <div 
          className="shape" 
          style={{ 
            width: '300px', 
            height: '300px', 
            background: 'rgba(139, 92, 246, 0.08)', 
            bottom: '-100px', 
            right: '-100px',
            filter: 'blur(80px)' 
          }}
        />
      </div>

      <div 
        className={`card glass-card fade-in ${authShake ? 'animate-bounce' : ''}`}
        style={{ 
          maxWidth: '450px', 
          width: '100%', 
          padding: '2.5rem', 
          borderRadius: '24px', 
          border: '1px solid rgba(255, 255, 255, 0.07)', 
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          zIndex: 1
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div 
            style={{ 
              display: 'inline-flex',
              padding: '1rem',
              borderRadius: '20px',
              background: 'rgba(59, 130, 246, 0.1)',
              color: '#3b82f6',
              marginBottom: '1rem'
            }}
          >
            <Lock className="w-8 h-8" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f8fafc', margin: '0 0 0.5rem 0' }}>
            Console Sign In
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0 }}>
            Evolve TNP System Administration
          </p>
        </div>

        {error && (
          <div 
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              animation: 'shake 0.5s ease-in-out'
            }}
          >
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label 
              htmlFor="username"
              style={{ 
                display: 'block', 
                fontSize: '0.75rem', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                color: '#cbd5e1', 
                letterSpacing: '0.05em',
                marginBottom: '0.5rem'
              }}
            >
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="admin"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 2.75rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
              <User 
                className="w-5 h-5" 
                style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label 
              htmlFor="password"
              style={{ 
                display: 'block', 
                fontSize: '0.75rem', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                color: '#cbd5e1', 
                letterSpacing: '0.05em',
                marginBottom: '0.5rem'
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem 0.875rem 2.75rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontSize: '0.95rem',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
              <Lock 
                className="w-5 h-5" 
                style={{
                  position: 'absolute',
                  left: '0.875rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  pointerEvents: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
              transition: 'all 0.2s ease',
              marginTop: '0.5rem'
            }}
            onMouseEnter={(e) => {
              if(!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.35)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.25)';
            }}
          >
            {loading ? 'Authenticating...' : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            <Home className="w-4 h-4" /> Return to main login
          </button>
          
          <div 
            style={{ 
              fontSize: '0.75rem', 
              color: '#64748b', 
              padding: '0.5rem 1rem', 
              borderRadius: '8px', 
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.04)'
            }}
          >
            Credentials helper: <code style={{ color: '#60a5fa' }}>admin</code> / <code style={{ color: '#60a5fa' }}>admin@123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
