import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  Plus, 
  Edit2, 
  Trash2, 
  Lock, 
  Unlock, 
  Moon, 
  Sun, 
  Server, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  X,
  ExternalLink,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  HelpCircle,
  Database
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const awsApiUrl = import.meta.env.VITE_AWS_API_GATEWAY || "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod";

// SWR Fetcher using global axios
const fetcher = url => window.axios.get(url).then(res => res.data);

export default function FogServerRegistry() {
  // Page Authentication lock state
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return sessionStorage.getItem('fogRegistryUnlocked') === 'true';
  });
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authShake, setAuthShake] = useState(false);

  // App Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('fogTheme') || 'dark';
  });

  // Modal Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedServer, setSelectedServer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    serverName: '',
    serverUrl: '',
    description: ''
  });

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  // SWR for data fetching
  const { data: servers, error, mutate, isValidating } = useSWR(
    isUnlocked ? `${awsApiUrl}/fogserver` : null,
    fetcher,
    {
      refreshInterval: 30000, // Auto-refresh every 30 seconds
      revalidateOnFocus: true
    }
  );

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('fogTheme', theme);
  }, [theme]);

  // Toast helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Handle page lock sign-in
  const handleLockSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    
    const HARDCODED_USER = 'ashishjadhav13';
    const HARDCODED_PASS = 'Jadhav@2004';

    if (authForm.username === HARDCODED_USER && authForm.password === HARDCODED_PASS) {
      sessionStorage.setItem('fogRegistryUnlocked', 'true');
      setIsUnlocked(true);
      showToast('Dashboard Unlocked Successfully', 'success');
    } else {
      setAuthError('Invalid credentials. Please try again.');
      setAuthShake(true);
      setTimeout(() => setAuthShake(false), 500);
    }
  };

  // Log out from page lock
  const handleLockOut = () => {
    sessionStorage.removeItem('fogRegistryUnlocked');
    setIsUnlocked(false);
    showToast('Dashboard Locked', 'info');
  };

  // Validations
  const validateForm = () => {
    if (!formData.serverName || formData.serverName.trim().length < 3) {
      setValidationError('Server name must be at least 3 characters.');
      return false;
    }
    
    // HTTPS URL validation
    const httpsRegex = /^https:\/\/[a-zA-Z0-9-\.]+(:\d+)?(\/.*)?$/;
    if (!formData.serverUrl || !httpsRegex.test(formData.serverUrl.trim())) {
      setValidationError('URL must be a valid HTTPS URL (starts with https://).');
      return false;
    }

    // Check duplicate URL (ignore current server when editing)
    const isDuplicate = servers?.some(s => 
      s.serverUrl.toLowerCase().trim() === formData.serverUrl.toLowerCase().trim() && 
      s.serverId !== selectedServer?.serverId
    );

    if (isDuplicate) {
      setValidationError('A server with this URL already exists.');
      return false;
    }

    setValidationError('');
    return true;
  };

  // Add Server Handler
  const handleAddServer = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const tempId = `temp-${Date.now()}`;
    const newServer = {
      serverId: tempId,
      serverName: formData.serverName.trim(),
      serverUrl: formData.serverUrl.trim(),
      description: formData.description.trim(),
      status: 'unknown',
      cpu: 0,
      memory: 0,
      activeJobs: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Optimistic Update
    const previousServers = servers || [];
    mutate([...previousServers, newServer], false);
    setIsAddOpen(false);

    try {
      const response = await window.axios.post(`${awsApiUrl}/fogserver`, {
        serverName: newServer.serverName,
        serverUrl: newServer.serverUrl,
        description: newServer.description
      });

      showToast('Fog Server registered successfully!', 'success');
      mutate(); // Revalidate with fresh database info
    } catch (err) {
      console.error(err);
      showToast('Failed to register fog server', 'error');
      mutate(previousServers, true); // Rollback
    } finally {
      setSubmitting(false);
      setFormData({ serverName: '', serverUrl: '', description: '' });
    }
  };

  // Edit Server Handler
  const handleEditServer = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const updatedServer = {
      ...selectedServer,
      serverName: formData.serverName.trim(),
      serverUrl: formData.serverUrl.trim(),
      description: formData.description.trim(),
      updatedAt: new Date().toISOString()
    };

    // Optimistic Update
    const previousServers = servers || [];
    mutate(
      previousServers.map(s => s.serverId === selectedServer.serverId ? updatedServer : s),
      false
    );
    setIsEditOpen(false);

    try {
      await window.axios.put(`${awsApiUrl}/fogserver/${selectedServer.serverId}`, {
        serverName: updatedServer.serverName,
        serverUrl: updatedServer.serverUrl,
        description: updatedServer.description
      });

      showToast('Fog Server updated successfully!', 'success');
      mutate();
    } catch (err) {
      console.error(err);
      showToast('Failed to update fog server', 'error');
      mutate(previousServers, true); // Rollback
    } finally {
      setSubmitting(false);
      setSelectedServer(null);
      setFormData({ serverName: '', serverUrl: '', description: '' });
    }
  };

  // Delete Server Handler
  const handleDeleteServer = async () => {
    if (!selectedServer) return;

    setSubmitting(true);
    const previousServers = servers || [];
    mutate(
      previousServers.filter(s => s.serverId !== selectedServer.serverId),
      false
    );
    setIsDeleteOpen(false);

    try {
      await window.axios.delete(`${awsApiUrl}/fogserver/${selectedServer.serverId}`);
      showToast('Fog Server removed successfully!', 'success');
      mutate();
    } catch (err) {
      console.error(err);
      showToast('Failed to remove fog server', 'error');
      mutate(previousServers, true); // Rollback
    } finally {
      setSubmitting(false);
      setSelectedServer(null);
    }
  };

  // Refresh Specific Server Status
  const handleRefreshStatus = async (server) => {
    showToast(`Refreshing status for ${server.serverName}...`, 'info');
    try {
      // Re-trigger server healthcheck update via standard fetch
      mutate();
    } catch (err) {
      console.error(err);
      showToast('Status check failed', 'error');
    }
  };

  // Open edit modal helper
  const openEditModal = (server) => {
    setSelectedServer(server);
    setFormData({
      serverName: server.serverName,
      serverUrl: server.serverUrl,
      description: server.description || ''
    });
    setValidationError('');
    setIsEditOpen(true);
  };

  // Open delete modal helper
  const openDeleteModal = (server) => {
    setSelectedServer(server);
    setIsDeleteOpen(true);
  };

  // Open add modal helper
  const openAddModal = () => {
    setFormData({ serverName: '', serverUrl: '', description: '' });
    setValidationError('');
    setIsAddOpen(true);
  };

  // Statistics Computations
  const totalServers = servers?.length || 0;
  const activeServers = servers?.filter(s => s.status === 'up').length || 0;
  const downServers = servers?.filter(s => s.status === 'down').length || 0;
  const avgCpu = totalServers > 0 
    ? Math.round(servers.reduce((acc, s) => acc + (Number(s.cpu) || 0), 0) / totalServers) 
    : 0;

  // Chart Data preparation
  const chartData = servers?.map(s => ({
    name: s.serverName,
    CPU: Number(s.cpu) || 0,
    Memory: Number(s.memory) || 0,
    'Active Jobs': Number(s.activeJobs) || 0
  })) || [];

  // Lock Screen Render
  if (!isUnlocked) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f172a] text-[#f8fafc]' : 'bg-[#f8fafc] text-[#0f172a]'}`}>
        {/* Decorative background gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-600/10" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] dark:bg-emerald-600/10" />
        </div>

        <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl border transition-all duration-300 ${authShake ? 'animate-bounce' : ''} ${
          theme === 'dark' 
            ? 'bg-[#1e293b]/80 border-[#334155]/60 backdrop-blur-md' 
            : 'bg-white/80 border-[#e2e8f0] backdrop-blur-md'
        }`}>
          <div className="flex flex-col items-center mb-6">
            <div className={`p-4 rounded-full mb-4 ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-500/10 text-blue-600'}`}>
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Access Control</h2>
            <p className={`text-sm text-center mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              The Fog Server Registry Dashboard is locked. Enter administrative credentials to proceed.
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 rounded-lg flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/20 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLockSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                Username
              </label>
              <input
                type="text"
                required
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition ${
                  theme === 'dark' 
                    ? 'bg-[#0f172a] border-[#334155] focus:border-blue-500' 
                    : 'bg-slate-50 border-[#cbd5e1] focus:border-blue-500'
                }`}
                placeholder="Enter username"
                value={authForm.username}
                onChange={e => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                Password
              </label>
              <input
                type="password"
                required
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition ${
                  theme === 'dark' 
                    ? 'bg-[#0f172a] border-[#334155] focus:border-blue-500' 
                    : 'bg-slate-50 border-[#cbd5e1] focus:border-blue-500'
                }`}
                placeholder="••••••••"
                value={authForm.password}
                onChange={e => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium text-sm transition-all duration-300 transform hover:-translate-y-0.5 shadow-lg shadow-blue-500/20"
            >
              Unlock Dashboard
            </button>
          </form>

          {/* Theme switcher inside lock screen */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs opacity-75">
            <span>Evolve TNP System</span>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'bg-[#0f172a] hover:bg-[#334155]/30' : 'bg-slate-100 hover:bg-slate-200'}`}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Main Screen
  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0f172a] text-[#f8fafc]' : 'bg-[#f8fafc] text-[#0f172a]'}`}>
      
      {/* Toast Portal */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`p-4 rounded-xl shadow-lg border backdrop-blur-md flex items-start gap-3 transform translate-y-0 transition-all duration-300 animate-slide-in ${
              toast.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                : toast.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
            }`}
          >
            <div className="mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {toast.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
          </div>
        ))}
      </div>

      {/* Top Navbar */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#0f172a]/80 border-[#1e293b]' : 'bg-white/80 border-[#e2e8f0]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-xl text-white">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 m-0 leading-none">
                Evolve Registry
              </h1>
              <p className="text-[10px] uppercase font-semibold tracking-wider opacity-60 mt-0.5">
                Fog Server Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Syncing Indicator */}
            {isValidating && (
              <span className="flex items-center gap-1.5 text-xs text-blue-500 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Syncing...
              </span>
            )}

            {/* Toggle Theme */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`p-2 rounded-xl transition ${
                theme === 'dark' ? 'bg-[#1e293b] hover:bg-[#334155]/60 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Lock Console */}
            <button
              onClick={handleLockOut}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition"
              title="Lock Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock Page</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Page Title & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Fog Server Registry</h2>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Manage registration and health status of local fog servers for distributed computing workloads.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium text-sm transition transform hover:-translate-y-0.5 shadow-lg shadow-blue-500/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Fog Server
          </button>
        </div>

        {/* Dashboard Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card: Total Servers */}
          <div className={`p-6 rounded-2xl border transition-all duration-300 shadow-md ${
            theme === 'dark' ? 'bg-[#1e293b] border-[#334155]/60' : 'bg-white border-[#e2e8f0]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold opacity-70">Total Fog Servers</span>
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
                <Server className="w-5 h-5" />
              </div>
            </div>
            {error ? (
              <p className="text-xl font-bold mt-4 text-red-500">Error</p>
            ) : !servers ? (
              <div className="h-9 w-16 bg-slate-300 dark:bg-slate-700 rounded-lg animate-pulse mt-4" />
            ) : (
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-extrabold">{totalServers}</span>
                <span className="text-xs font-semibold text-slate-400">nodes registered</span>
              </div>
            )}
          </div>

          {/* Card: Active Servers */}
          <div className={`p-6 rounded-2xl border transition-all duration-300 shadow-md ${
            theme === 'dark' ? 'bg-[#1e293b] border-[#334155]/60' : 'bg-white border-[#e2e8f0]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold opacity-70">Active (UP) Servers</span>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-500">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            {error ? (
              <p className="text-xl font-bold mt-4 text-red-500">Error</p>
            ) : !servers ? (
              <div className="h-9 w-16 bg-slate-300 dark:bg-slate-700 rounded-lg animate-pulse mt-4" />
            ) : (
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-extrabold text-emerald-500">{activeServers}</span>
                <span className="text-xs font-semibold text-slate-400">
                  {totalServers > 0 ? `${Math.round((activeServers / totalServers) * 100)}% online` : 'no nodes'}
                </span>
              </div>
            )}
          </div>

          {/* Card: Down Servers */}
          <div className={`p-6 rounded-2xl border transition-all duration-300 shadow-md ${
            theme === 'dark' ? 'bg-[#1e293b] border-[#334155]/60' : 'bg-white border-[#e2e8f0]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold opacity-70">Down Servers</span>
              <div className="p-2.5 bg-red-500/10 rounded-xl text-red-500">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
            {error ? (
              <p className="text-xl font-bold mt-4 text-red-500">Error</p>
            ) : !servers ? (
              <div className="h-9 w-16 bg-slate-300 dark:bg-slate-700 rounded-lg animate-pulse mt-4" />
            ) : (
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-extrabold text-red-500">{downServers}</span>
                <span className="text-xs font-semibold text-slate-400">require attention</span>
              </div>
            )}
          </div>

          {/* Card: Average CPU Usage */}
          <div className={`p-6 rounded-2xl border transition-all duration-300 shadow-md ${
            theme === 'dark' ? 'bg-[#1e293b] border-[#334155]/60' : 'bg-white border-[#e2e8f0]'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold opacity-70">Avg CPU Load</span>
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
            {error ? (
              <p className="text-xl font-bold mt-4 text-red-500">Error</p>
            ) : !servers ? (
              <div className="h-9 w-16 bg-slate-300 dark:bg-slate-700 rounded-lg animate-pulse mt-4" />
            ) : (
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-extrabold text-indigo-500">{avgCpu}%</span>
                <span className="text-xs font-semibold text-slate-400">across active nodes</span>
              </div>
            )}
          </div>

        </div>

        {/* Loading Skeletons */}
        {!servers && !error && (
          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border ${theme === 'dark' ? 'bg-[#1e293b] border-[#334155]' : 'bg-white border-[#e2e8f0]'}`}>
              <div className="h-6 w-48 bg-slate-300 dark:bg-slate-700 rounded animate-pulse mb-6" />
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between py-3 border-b dark:border-slate-800">
                    <div className="h-5 w-1/4 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-5 w-1/6 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-5 w-1/6 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-5 w-12 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-8 text-center rounded-2xl border border-red-500/20 bg-red-500/5 text-red-500 max-w-2xl mx-auto my-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
            <h3 className="text-lg font-bold mb-2">Data Sync Unsuccessful</h3>
            <p className="text-sm opacity-80 mb-6">
              Failed to connect with AWS Lambda backend endpoint. Please double-check your credentials and connection.
            </p>
            <button
              onClick={() => mutate()}
              className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loaded Content */}
        {servers && (
          <div className="space-y-8">
            
            {/* Empty State */}
            {servers.length === 0 ? (
              <div className={`p-12 text-center rounded-2xl border border-dashed shadow-sm ${
                theme === 'dark' ? 'bg-[#1e293b] border-[#334155]/85' : 'bg-white border-slate-300'
              }`}>
                <Server className="w-16 h-16 mx-auto mb-4 text-slate-400 opacity-60 animate-bounce" />
                <h3 className="text-xl font-bold mb-2">No Fog Servers Registered</h3>
                <p className={`text-sm max-w-md mx-auto mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Get started by adding your first local fog server cluster. This will register its URL to sync databases and offload authentication.
                </p>
                <button
                  onClick={openAddModal}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-500/10"
                >
                  Register First Server
                </button>
              </div>
            ) : (
              <>
                {/* Main Table Card */}
                <div className={`rounded-2xl border overflow-hidden shadow-lg ${
                  theme === 'dark' ? 'bg-[#1e293b] border-[#334155]/60' : 'bg-white border-[#e2e8f0]'
                }`}>
                  <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-500/5">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <HardDrive className="w-5 h-5 text-blue-500" />
                      Server Registry Database
                    </h3>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-500/10 dark:text-slate-300 text-slate-600 rounded-full">
                      {servers.length} Registered
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className={`text-xs uppercase font-semibold border-b ${
                        theme === 'dark' ? 'bg-[#1e293b] text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        <tr>
                          <th className="px-6 py-4">Server Name</th>
                          <th className="px-6 py-4">URL</th>
                          <th className="px-6 py-4">Description</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">CPU Usage</th>
                          <th className="px-6 py-4">Memory</th>
                          <th className="px-6 py-4 text-center">Active Jobs</th>
                          <th className="px-6 py-4">Last Updated</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                        {servers.map((server) => {
                          const isUp = server.status === 'up';
                          const isDown = server.status === 'down';
                          const isUnknown = !isUp && !isDown;

                          return (
                            <tr key={server.serverId} className="hover:bg-slate-500/5 transition">
                              
                              {/* Server Name */}
                              <td className="px-6 py-4 font-semibold max-w-[180px] truncate">
                                {server.serverName}
                              </td>

                              {/* URL */}
                              <td className="px-6 py-4 font-mono text-xs max-w-[200px] truncate text-slate-500 dark:text-slate-400">
                                <a 
                                  href={server.serverUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:text-blue-500 flex items-center gap-1"
                                >
                                  {server.serverUrl}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </td>

                              {/* Description */}
                              <td className="px-6 py-4 max-w-[200px] truncate opacity-80">
                                {server.description || <span className="italic opacity-40">No description</span>}
                              </td>

                              {/* Status Badge */}
                              <td className="px-6 py-4">
                                {isUp && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                                    UP
                                  </span>
                                )}
                                {isDown && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    DOWN
                                  </span>
                                )}
                                {isUnknown && (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    UNKNOWN
                                  </span>
                                )}
                              </td>

                              {/* CPU Usage progress bar */}
                              <td className="px-6 py-4 min-w-[120px]">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        server.cpu > 80 ? 'bg-red-500' : server.cpu > 50 ? 'bg-amber-500' : 'bg-blue-500'
                                      }`}
                                      style={{ width: `${server.cpu || 0}%` }}
                                    />
                                  </div>
                                  <span className="font-semibold text-xs min-w-[28px] text-right">
                                    {server.cpu || 0}%
                                  </span>
                                </div>
                              </td>

                              {/* Memory Usage progress bar */}
                              <td className="px-6 py-4 min-w-[120px]">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        server.memory > 80 ? 'bg-red-500' : server.memory > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${server.memory || 0}%` }}
                                    />
                                  </div>
                                  <span className="font-semibold text-xs min-w-[28px] text-right">
                                    {server.memory || 0}%
                                  </span>
                                </div>
                              </td>

                              {/* Active Jobs */}
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center justify-center font-bold text-xs rounded-lg px-2.5 py-1 ${
                                  server.activeJobs > 5 
                                    ? 'bg-red-500/10 text-red-500' 
                                    : server.activeJobs > 0 
                                    ? 'bg-blue-500/10 text-blue-500' 
                                    : 'bg-slate-500/10 text-slate-400'
                                }`}>
                                  {server.activeJobs || 0}
                                </span>
                              </td>

                              {/* Last Updated */}
                              <td className="px-6 py-4 text-xs opacity-75">
                                {server.updatedAt ? new Date(server.updatedAt).toLocaleTimeString() : 'N/A'}
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleRefreshStatus(server)}
                                    className={`p-1.5 rounded-lg border transition ${
                                      theme === 'dark' ? 'bg-[#0f172a] hover:bg-[#334155]/40 border-slate-700/60' : 'bg-white hover:bg-slate-100 border-slate-200'
                                    }`}
                                    title="Check Health"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => openEditModal(server)}
                                    className={`p-1.5 rounded-lg border transition ${
                                      theme === 'dark' ? 'bg-[#0f172a] hover:bg-amber-500/10 border-slate-700/60 hover:border-amber-500/30 text-amber-500' : 'bg-white hover:bg-amber-50 border-slate-200 hover:border-amber-200 text-amber-600'
                                    }`}
                                    title="Edit Server"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => openDeleteModal(server)}
                                    className={`p-1.5 rounded-lg border transition ${
                                      theme === 'dark' ? 'bg-[#0f172a] hover:bg-red-500/10 border-slate-700/60 hover:border-red-500/30 text-red-500' : 'bg-white hover:bg-red-50 border-slate-200 hover:border-red-200 text-red-600'
                                    }`}
                                    title="Delete Server"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recharts Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* CPU & Memory Charts */}
                  <div className={`p-6 rounded-2xl border shadow-lg ${
                    theme === 'dark' ? 'bg-[#1e293b] border-[#334155]/60' : 'bg-white border-[#e2e8f0]'
                  }`}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Cpu className="w-5 h-5 text-indigo-500" />
                      Resource Load Analytics (%)
                    </h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                          <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} />
                          <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                              borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                              color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                              borderRadius: '10px'
                            }} 
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="CPU" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Memory" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Active Jobs Chart */}
                  <div className={`p-6 rounded-2xl border shadow-lg ${
                    theme === 'dark' ? 'bg-[#1e293b] border-[#334155]/60' : 'bg-white border-[#e2e8f0]'
                  }`}>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-emerald-500" />
                      Active Queue Size (Jobs)
                    </h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                          <XAxis dataKey="name" stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} />
                          <YAxis stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                              borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                              color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                              borderRadius: '10px'
                            }} 
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                          <Bar dataKey="Active Jobs" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry['Active Jobs'] > 5 ? '#f43f5e' : entry['Active Jobs'] > 2 ? '#fbbf24' : '#3b82f6'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              </>
            )}

          </div>
        )}

      </main>

      {/* Modal Dialog: Add Server */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all duration-300 ${
            theme === 'dark' ? 'bg-[#1e293b] border-[#334155] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                Register Fog Server
              </h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className={`p-1.5 rounded-lg transition ${theme === 'dark' ? 'hover:bg-[#334155]/60' : 'hover:bg-slate-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationError && (
              <div className="mb-4 p-3 rounded-lg flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleAddServer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                  Server Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mumbai Edge Node 01"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition ${
                    theme === 'dark' 
                      ? 'bg-[#0f172a] border-[#334155] focus:border-blue-500' 
                      : 'bg-slate-50 border-[#cbd5e1] focus:border-blue-500'
                  }`}
                  value={formData.serverName}
                  onChange={e => setFormData(prev => ({ ...prev, serverName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                  Server URL (HTTPS) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. https://mumbai-edge.ngrok-free.app"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition ${
                    theme === 'dark' 
                      ? 'bg-[#0f172a] border-[#334155] focus:border-blue-500' 
                      : 'bg-slate-50 border-[#cbd5e1] focus:border-blue-500'
                  }`}
                  value={formData.serverUrl}
                  onChange={e => setFormData(prev => ({ ...prev, serverUrl: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe location, environment parameters, etc."
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition ${
                    theme === 'dark' 
                      ? 'bg-[#0f172a] border-[#334155] focus:border-blue-500' 
                      : 'bg-slate-50 border-[#cbd5e1] focus:border-blue-500'
                  }`}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                    theme === 'dark' 
                      ? 'border-[#334155] hover:bg-[#334155]/40 text-slate-300' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-500/10"
                >
                  {submitting ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog: Edit Server */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all duration-300 ${
            theme === 'dark' ? 'bg-[#1e293b] border-[#334155] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-500" />
                Update Fog Server Parameters
              </h3>
              <button 
                onClick={() => setIsEditOpen(false)}
                className={`p-1.5 rounded-lg transition ${theme === 'dark' ? 'hover:bg-[#334155]/60' : 'hover:bg-slate-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {validationError && (
              <div className="mb-4 p-3 rounded-lg flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <form onSubmit={handleEditServer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                  Server Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition ${
                    theme === 'dark' 
                      ? 'bg-[#0f172a] border-[#334155] focus:border-blue-500' 
                      : 'bg-slate-50 border-[#cbd5e1] focus:border-blue-500'
                  }`}
                  value={formData.serverName}
                  onChange={e => setFormData(prev => ({ ...prev, serverName: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                  Server URL (HTTPS) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition ${
                    theme === 'dark' 
                      ? 'bg-[#0f172a] border-[#334155] focus:border-blue-500' 
                      : 'bg-slate-50 border-[#cbd5e1] focus:border-blue-500'
                  }`}
                  value={formData.serverUrl}
                  onChange={e => setFormData(prev => ({ ...prev, serverUrl: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-80">
                  Description
                </label>
                <textarea
                  rows={3}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition ${
                    theme === 'dark' 
                      ? 'bg-[#0f172a] border-[#334155] focus:border-blue-500' 
                      : 'bg-slate-50 border-[#cbd5e1] focus:border-blue-500'
                  }`}
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                    theme === 'dark' 
                      ? 'border-[#334155] hover:bg-[#334155]/40 text-slate-300' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-900 font-semibold rounded-xl text-sm transition shadow-lg shadow-amber-500/10"
                >
                  {submitting ? 'Saving changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog: Delete Server Confirmation */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 animate-fade-in">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all duration-300 ${
            theme === 'dark' ? 'bg-[#1e293b] border-[#334155] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex flex-col items-center text-center p-2 mb-4">
              <div className="p-3 rounded-full bg-red-500/10 text-red-500 mb-4 animate-bounce">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Remove Fog Server?</h3>
              <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Are you sure you want to remove <span className="font-semibold text-red-500">"{selectedServer?.serverName}"</span> from the registry?
                This action is permanent and will stop synchronization routes broadcasted to this URL.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition ${
                  theme === 'dark' 
                    ? 'border-[#334155] hover:bg-[#334155]/40 text-slate-300' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteServer}
                disabled={submitting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-red-500/20"
              >
                {submitting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
