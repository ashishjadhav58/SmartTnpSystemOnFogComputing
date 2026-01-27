import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import '../style.css';

export default function ManageRecruiters() {
  const backendUrl = useSelector((state) => state.backend.backendUrl) || localStorage.getItem('fogIp') || 'http://localhost:5000';
  const user = JSON.parse(localStorage.getItem('user'));
  const [recruiters, setRecruiters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Test endpoint first
    const testConnection = async () => {
      try {
        const testResponse = await axios.post(`${backendUrl}/api/admin/recruiters/test`, {});
        console.log(`[ManageRecruiters] Test endpoint response:`, testResponse.data);
      } catch (err) {
        console.error(`[ManageRecruiters] Test endpoint failed:`, err);
      }
    };
    testConnection();
    fetchRecruiters();
  }, []);

  const fetchRecruiters = async () => {
    setLoading(true);
    setError('');
    try {
      console.log(`[ManageRecruiters] Fetching recruiters from: ${backendUrl}/api/admin/recruiters`);
      console.log(`[ManageRecruiters] Backend URL:`, backendUrl);
      
      const response = await axios.post(`${backendUrl}/api/admin/recruiters`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`[ManageRecruiters] Response status:`, response.status);
      console.log(`[ManageRecruiters] Response headers:`, response.headers);
      console.log(`[ManageRecruiters] Response data:`, response.data);
      console.log(`[ManageRecruiters] Response data type:`, typeof response.data);
      console.log(`[ManageRecruiters] Is array:`, Array.isArray(response.data));
      console.log(`[ManageRecruiters] Data length:`, Array.isArray(response.data) ? response.data.length : 'N/A');
      
      // Check response status
      if (response.status !== 200) {
        throw new Error(`Server returned status ${response.status}`);
      }
      
      // Ensure response.data is an array
      let recruitersData = response.data;
      
      // Handle different response formats - prioritize array check
      if (Array.isArray(recruitersData)) {
        console.log(`[ManageRecruiters] Setting ${recruitersData.length} recruiters`);
        setRecruiters(recruitersData);
        return; // Success, exit early
      }
      
      // Try nested formats
      if (recruitersData && typeof recruitersData === 'object') {
        if (Array.isArray(recruitersData.data)) {
          console.log(`[ManageRecruiters] Found nested data array with ${recruitersData.data.length} items`);
          setRecruiters(recruitersData.data);
          return;
        }
        if (Array.isArray(recruitersData.recruiters)) {
          console.log(`[ManageRecruiters] Found nested recruiters array with ${recruitersData.recruiters.length} items`);
          setRecruiters(recruitersData.recruiters);
          return;
        }
      }
      
      // If we get here, data format is unexpected
      // But if it's null/undefined, just use empty array
      if (recruitersData === null || recruitersData === undefined) {
        console.warn('[ManageRecruiters] Response data is null/undefined');
        setRecruiters([]);
        return;
      }
      
      // Last resort: log error and use empty array
      console.warn('Unexpected response format, using empty array:', {
        type: typeof recruitersData,
        data: recruitersData,
        isArray: Array.isArray(recruitersData),
        keys: Object.keys(recruitersData || {})
      });
      setRecruiters([]);
      
    } catch (err) {
      console.error('Error fetching recruiters:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      // More detailed error message
      let errorMsg = 'Failed to load recruiters. ';
      if (err.response) {
        errorMsg += `Server returned ${err.response.status}: ${err.response.statusText}`;
      } else if (err.request) {
        errorMsg += 'No response from server. Please check if the backend server is running.';
      } else {
        errorMsg += err.message || 'Unknown error occurred.';
      }
      
      setError(errorMsg);
      setRecruiters([]); // Always set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Approval functionality removed - recruiters are auto-approved

  const handleReject = async (recruiterId) => {
    if (!window.confirm('Are you sure you want to delete this recruiter account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await axios.delete(`${backendUrl}/api/admin/recruiter/${recruiterId}`);
      
      if (response.data && response.data.message) {
        setSuccess('Recruiter account deleted successfully!');
        fetchRecruiters(); // Refresh list
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error rejecting recruiter:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to remove recruiter';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // All recruiters are approved - no filtering needed
  const allRecruiters = Array.isArray(recruiters) ? recruiters : [];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#1e40af' }}>Manage Recruiters</h3>
        <button 
          onClick={fetchRecruiters} 
          className="btn btn-primary btn-sm"
          disabled={loading}
          title="Refresh list"
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert" style={{ marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert" style={{ marginBottom: '20px' }}>
          {success}
        </div>
      )}

      {loading && (!Array.isArray(recruiters) || recruiters.length === 0) && (
        <div className="text-center" style={{ padding: '40px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {/* All Recruiters Section */}
      <div>
        <h4 style={{ marginBottom: '15px', color: '#1e40af' }}>
          All Recruiters ({allRecruiters.length})
        </h4>
        {allRecruiters.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Created By</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allRecruiters.map((recruiter) => (
                  <tr key={recruiter._id}>
                    <td>{recruiter.username || 'N/A'}</td>
                    <td>{recruiter.email}</td>
                    <td>{recruiter.companyName || 'N/A'}</td>
                    <td>{recruiter.contactNumber || 'N/A'}</td>
                    <td>{recruiter.createdBy || 'N/A'}</td>
                    <td>{recruiter.createdAt ? new Date(recruiter.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleReject(recruiter._id)}
                        disabled={loading}
                        title="Delete recruiter"
                      >
                        ✗ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="alert alert-info">
            No recruiters found. Create recruiters using the "Create Recruiter" option.
          </div>
        )}
      </div>
    </div>
  );
}
