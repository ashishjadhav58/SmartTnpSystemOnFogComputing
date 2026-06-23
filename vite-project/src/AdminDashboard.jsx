import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Server, 
  Plus, 
  Trash2, 
  Edit2, 
  LogOut, 
  Database, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import './style.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [fogUrls, setFogUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingStatusId, setCheckingStatusId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states for fog URLs
  const [fogForm, setFogForm] = useState({ id: '', url: '', isEditing: false });

  const awsApiUrl = import.meta.env.VITE_AWS_API_GATEWAY || "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod";

  useEffect(() => {
    // Check admin session
    const adminSession = localStorage.getItem('adminSession');
    if (!adminSession) {
      navigate('/admin/login', { replace: true });
      return;
    }

    try {
      const session = JSON.parse(adminSession);
      if (!session.isAdmin || session.expiresAt <= Date.now()) {
        navigate('/admin/login', { replace: true });
        return;
      }
    } catch (e) {
      navigate('/admin/login', { replace: true });
      return;
    }

    // Load data
    fetchFogUrls();
  }, [navigate]);

  const fetchFogUrls = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${awsApiUrl}/admin/fog-urls`, { timeout: 10000 });
      if (response.data && response.data.success) {
        setFogUrls(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching fog URLs:', err);
      setError('Failed to load fog URLs. Make sure the API Gateway is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/admin/login', { replace: true });
  };

  // Fog URL handlers
  const handleAddFogUrl = async () => {
    if (!fogForm.url.trim()) {
      setError('Fog URL is required');
      return;
    }

    // Basic URL validation
    try {
      new URL(fogForm.url.trim());
    } catch (e) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await axios.post(
        `${awsApiUrl}/admin/fog-urls`,
        { url: fogForm.url.trim() },
        { timeout: 10000 }
      );

      if (response.data && response.data.success) {
        setSuccess('Fog URL added and status validated successfully!');
        setFogForm({ id: '', url: '', isEditing: false });
        fetchFogUrls();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(response.data?.message || 'Failed to add fog URL');
      }
    } catch (err) {
      console.error('Error adding fog URL:', err);
      setError(err.response?.data?.message || 'Failed to add fog URL. Ensure the server is online and responds to /status.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFogUrl = async () => {
    if (!fogForm.id || !fogForm.url.trim()) {
      setError('Fog URL is required');
      return;
    }

    // Basic URL validation
    try {
      new URL(fogForm.url.trim());
    } catch (e) {
      setError('Please enter a valid URL');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await axios.put(
        `${awsApiUrl}/admin/fog-urls/${fogForm.id}`,
        { url: fogForm.url.trim() },
        { timeout: 10000 }
      );

      if (response.data && response.data.success) {
        setSuccess('Fog URL updated and status validated successfully');
        setFogForm({ id: '', url: '', isEditing: false });
        fetchFogUrls();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(response.data?.message || 'Failed to update fog URL');
      }
    } catch (err) {
      console.error('Error updating fog URL:', err);
      setError(err.response?.data?.message || 'Failed to update fog URL. Ensure the server is online and responds to /status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFogUrl = async (id) => {
    if (!window.confirm('Are you sure you want to delete this fog URL?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const response = await axios.delete(
        `${awsApiUrl}/admin/fog-urls/${id}`,
        { timeout: 10000 }
      );

      if (response.data && response.data.success) {
        setSuccess('Fog URL deleted successfully');
        fetchFogUrls();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(response.data?.message || 'Failed to delete fog URL');
      }
    } catch (err) {
      console.error('Error deleting fog URL:', err);
      setError(err.response?.data?.message || 'Failed to delete fog URL');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFogUrl = (fogUrl) => {
    setFogForm({ id: fogUrl.id, url: fogUrl.url, isEditing: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div 
      className="modern-container" 
      style={{ 
        background: '#f8fafc', 
        minHeight: '100vh', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        paddingBottom: '3rem'
      }}
    >
      {/* Premium Gradient Header */}
      <header 
        className="modern-header" 
        style={{ 
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderRadius: '0 0 24px 24px',
          padding: '2rem',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
          marginBottom: '2.5rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f8fafc', margin: 0, background: 'none', webkitTextFillColor: 'unset' }}>
                Admin Portal
              </h1>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.25rem 0 0 0' }}>
                Smart TNP System Manager
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={() => navigate('/admin/fog-server-registry')}
              className="btn btn-primary"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f8fafc',
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: '600',
                padding: '0.625rem 1.25rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            >
              Go to Analytics Registry <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={handleLogout}
              className="btn btn-danger"
              style={{
                borderRadius: '12px',
                fontSize: '0.9rem',
                fontWeight: '600',
                padding: '0.625rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        
        {/* Status Alerts */}
        {error && (
          <div 
            className="fade-in"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.25rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '16px',
              color: '#dc2626',
              fontSize: '0.9rem',
              marginBottom: '2rem'
            }}
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div 
            className="fade-in"
            style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem 1.25rem',
              backgroundColor: '#dcfce7',
              border: '1px solid #bbf7d0',
              borderRadius: '16px',
              color: '#15803d',
              fontSize: '0.9rem',
              marginBottom: '2rem'
            }}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Total Configured Nodes</span>
              <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <Server className="w-5 h-5" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a' }}>{fogUrls.length}</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>active routes</span>
            </div>
          </div>
          
          <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b' }}>Dynamic Routing Mode</span>
              <div style={{ padding: '0.5rem', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>Least Load Gateway</span>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <section 
          className="card" 
          style={{ 
            padding: '2rem', 
            borderRadius: '20px', 
            border: '1px solid #e2e8f0', 
            background: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            marginBottom: '2.5rem'
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {fogForm.isEditing ? <Edit2 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-blue-500" />}
            {fogForm.isEditing ? 'Update Registered Fog Gateway' : 'Register New Fog Gateway'}
          </h2>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <label 
                htmlFor="url"
                style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '0.5rem' }}
              >
                Fog Server base URL
              </label>
              <input
                type="text"
                id="url"
                placeholder="e.g. https://your-fog-server.ngrok-free.app"
                value={fogForm.url}
                onChange={(e) => setFogForm({ ...fogForm, url: e.target.value })}
                className="form-control"
                style={{
                  height: '46px',
                  borderRadius: '12px'
                }}
                disabled={loading}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {fogForm.isEditing ? (
                <>
                  <button 
                    onClick={handleUpdateFogUrl}
                    disabled={loading}
                    className="btn btn-success"
                    style={{ height: '46px', borderRadius: '12px', padding: '0 1.5rem', fontWeight: '600' }}
                  >
                    Update
                  </button>
                  <button 
                    onClick={() => setFogForm({ id: '', url: '', isEditing: false })}
                    disabled={loading}
                    className="btn btn-light"
                    style={{ height: '46px', borderRadius: '12px', padding: '0 1.5rem', fontWeight: '600' }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleAddFogUrl}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ 
                    height: '46px', 
                    borderRadius: '12px', 
                    padding: '0 1.5rem', 
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <Plus className="w-4 h-4" /> Add Server
                </button>
              )}
            </div>
          </div>
          
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#64748b', fontSize: '0.8rem' }}>
            <Info className="w-4 h-4" />
            <span>Adding a server triggers an AWS health check status validation to verify it's reachable.</span>
          </div>
        </section>

        {/* Database List Table */}
        <section 
          className="card" 
          style={{ 
            padding: '2rem', 
            borderRadius: '20px', 
            border: '1px solid #e2e8f0', 
            background: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
              Registered Gateways
            </h2>
            <button 
              onClick={fetchFogUrls}
              disabled={loading}
              className="btn btn-light"
              style={{
                borderRadius: '10px',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem'
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync DB
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover" style={{ margin: 0, verticalAlign: 'middle' }}>
              <thead>
                <tr style={{ color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>ID</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0' }}>Fog Gateway URL</th>
                  <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fogUrls.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      <Server className="w-12 h-12 mx-auto mb-3" style={{ opacity: 0.3 }} />
                      <p style={{ margin: 0, fontWeight: '600' }}>No fog server gateways configured</p>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>Add a gateway URL above to get started.</p>
                    </td>
                  </tr>
                ) : (
                  fogUrls.map((fogUrl) => (
                    <tr key={fogUrl.id} style={{ transition: 'all 0.15s ease' }}>
                      <td style={{ padding: '1rem', color: '#64748b', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {fogUrl.id}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>
                        <a 
                          href={fogUrl.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                        >
                          {fogUrl.url}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => handleEditFogUrl(fogUrl)}
                            disabled={loading}
                            className="btn btn-light"
                            style={{ 
                              padding: '0.5rem 0.75rem', 
                              borderRadius: '8px', 
                              color: '#d97706',
                              backgroundColor: '#fef3c7',
                              border: 'none',
                              fontSize: '0.85rem'
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteFogUrl(fogUrl.id)}
                            disabled={loading}
                            className="btn btn-light"
                            style={{ 
                              padding: '0.5rem 0.75rem', 
                              borderRadius: '8px', 
                              color: '#dc2626',
                              backgroundColor: '#fee2e2',
                              border: 'none',
                              fontSize: '0.85rem'
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
}
