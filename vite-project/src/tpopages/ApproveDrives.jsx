import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import '../style.css';

export default function ApproveDrives() {
  const backendUrl = useSelector((state) => state.backend.backendUrl) || localStorage.getItem('fogIp') || 'http://localhost:5000';
  const user = JSON.parse(localStorage.getItem('user'));
  const [pendingDrives, setPendingDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDrive, setSelectedDrive] = useState(null);

  useEffect(() => {
    // Test endpoint first
    const testConnection = async () => {
      try {
        const testResponse = await axios.post(`${backendUrl}/api/admin/drives/test`, {});
        console.log(`[ApproveDrives] Test endpoint response:`, testResponse.data);
      } catch (err) {
        console.error(`[ApproveDrives] Test endpoint failed:`, err);
      }
    };
    testConnection();
    fetchPendingDrives();
  }, [backendUrl]);

  const fetchPendingDrives = async () => {
    setLoading(true);
    setError('');
    try {
      console.log(`[ApproveDrives] Fetching pending drives from: ${backendUrl}/api/admin/drives/pending`);
      console.log(`[ApproveDrives] Backend URL:`, backendUrl);
      
      const response = await axios.post(`${backendUrl}/api/admin/drives/pending`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`[ApproveDrives] Response status:`, response.status);
      console.log(`[ApproveDrives] Response headers:`, response.headers);
      console.log(`[ApproveDrives] Response data:`, response.data);
      console.log(`[ApproveDrives] Response data type:`, typeof response.data);
      console.log(`[ApproveDrives] Is array:`, Array.isArray(response.data));
      console.log(`[ApproveDrives] Data length:`, Array.isArray(response.data) ? response.data.length : 'N/A');
      
      // Check response status
      if (response.status !== 200) {
        throw new Error(`Server returned status ${response.status}`);
      }
      
      // Ensure response.data is an array
      let drivesData = response.data;
      
      // Handle different response formats - prioritize array check
      if (Array.isArray(drivesData)) {
        setPendingDrives(drivesData);
        return; // Success, exit early
      }
      
      // Try nested formats
      if (drivesData && typeof drivesData === 'object') {
        if (Array.isArray(drivesData.data)) {
          setPendingDrives(drivesData.data);
          return;
        }
        if (Array.isArray(drivesData.drives)) {
          setPendingDrives(drivesData.drives);
          return;
        }
      }
      
      // If we get here, data format is unexpected
      // But if it's null/undefined, just use empty array
      if (drivesData === null || drivesData === undefined) {
        setPendingDrives([]);
        return;
      }
      
      // Last resort: log error and use empty array
      console.warn('Unexpected response format, using empty array:', {
        type: typeof drivesData,
        data: drivesData,
        isArray: Array.isArray(drivesData)
      });
      setPendingDrives([]);
      
    } catch (err) {
      console.error('Error fetching pending drives:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to load pending drives. Please check if the backend server is running.';
      setError(errorMsg);
      setPendingDrives([]); // Always set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (driveId) => {
    if (!window.confirm('Are you sure you want to approve this drive? It will become public and visible to all students.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(`${backendUrl}/api/admin/drive/approve/${driveId}`, {
        approvedBy: user.email
      });
      
      if (response.data && response.data.message) {
        setSuccess('Drive approved successfully! It is now public and visible to students.');
        fetchPendingDrives(); // Refresh list
        setSelectedDrive(null);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error approving drive:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to approve drive';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (driveId) => {
    if (!window.confirm('Are you sure you want to reject this drive? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Update drive status to rejected (you may want to add a reject endpoint)
      const response = await axios.put(`${backendUrl}/api/drivedata/${driveId}`, {
        status: 'Rejected'
      });
      
      if (response.data) {
        setSuccess('Drive rejected successfully!');
        fetchPendingDrives(); // Refresh list
        setSelectedDrive(null);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error rejecting drive:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to reject drive';
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const openDriveDetails = (drive) => {
    setSelectedDrive(drive);
  };

  const closeDriveDetails = () => {
    setSelectedDrive(null);
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#1e40af' }}>Approve Placement Drives</h3>
        <button 
          onClick={fetchPendingDrives} 
          className="btn btn-primary btn-sm"
          disabled={loading}
          title="Refresh list"
        >
          {loading ? '⏳ Loading...' : '🔄 Refresh'}
        </button>
      </div>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
          <strong>Note:</strong> Review and approve drives created by recruiters. Approved drives become public and visible to all students.
        </p>
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

      {loading && (!Array.isArray(pendingDrives) || pendingDrives.length === 0) && (
        <div className="text-center" style={{ padding: '40px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      {Array.isArray(pendingDrives) && pendingDrives.length === 0 && !loading ? (
        <div className="alert alert-info">
          <h5>No Pending Drives</h5>
          <p>All drives have been reviewed. New drives created by recruiters will appear here for approval.</p>
        </div>
      ) : Array.isArray(pendingDrives) && pendingDrives.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Company</th>
                <th>Job Role</th>
                <th>Salary</th>
                <th>Drive Date</th>
                <th>Created By</th>
                <th>Required Skills</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingDrives.map((drive) => (
                <tr key={drive._id}>
                  <td><strong>{drive.companyName}</strong></td>
                  <td>{drive.jobRole}</td>
                  <td>{drive.salaryPackage || 'N/A'}</td>
                  <td>{drive.driveDate ? new Date(drive.driveDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{drive.createdBy || 'N/A'}</td>
                  <td>
                    {drive.requiredSkills && drive.requiredSkills.length > 0 ? (
                      <span className="badge bg-secondary me-1">
                        {drive.requiredSkills.slice(0, 3).join(', ')}
                        {drive.requiredSkills.length > 3 && '...'}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-info btn-sm me-2"
                      onClick={() => openDriveDetails(drive)}
                      title="View details"
                    >
                      👁️ View
                    </button>
                    <button
                      className="btn btn-success btn-sm me-2"
                      onClick={() => handleApprove(drive._id)}
                      disabled={loading}
                      title="Approve drive"
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleReject(drive._id)}
                      disabled={loading}
                      title="Reject drive"
                    >
                      ✗ Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="alert alert-warning">
          <h5>Unable to Load Drives</h5>
          <p>There was an issue loading the pending drives. Please refresh the page.</p>
        </div>
      )}

      {/* Drive Details Modal */}
      {selectedDrive && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Drive Details - {selectedDrive.companyName}</h5>
                <button type="button" className="btn-close" onClick={closeDriveDetails}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Company Name:</strong> {selectedDrive.companyName}
                  </div>
                  <div className="col-md-6">
                    <strong>Job Role:</strong> {selectedDrive.jobRole}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Salary Package:</strong> {selectedDrive.salaryPackage || 'N/A'}
                  </div>
                  <div className="col-md-6">
                    <strong>Drive Date:</strong> {selectedDrive.driveDate ? new Date(selectedDrive.driveDate).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Created By:</strong> {selectedDrive.createdBy || 'N/A'}
                  </div>
                  <div className="col-md-6">
                    <strong>Difficulty Level:</strong> 
                    <span className={`badge ms-2 ${
                      selectedDrive.difficultyLevel === 'Easy' ? 'bg-success' :
                      selectedDrive.difficultyLevel === 'Hard' ? 'bg-danger' : 'bg-warning'
                    }`}>
                      {selectedDrive.difficultyLevel || 'Medium'}
                    </span>
                  </div>
                </div>
                {selectedDrive.requiredSkills && selectedDrive.requiredSkills.length > 0 && (
                  <div className="mb-3">
                    <strong>Required Skills:</strong>
                    <div className="mt-2">
                      {selectedDrive.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="badge bg-primary me-1 mb-1">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedDrive.eligibilityCriteria && (
                  <div className="mb-3">
                    <strong>Eligibility Criteria:</strong>
                    <p className="mt-1">{selectedDrive.eligibilityCriteria}</p>
                  </div>
                )}
                {selectedDrive.description && (
                  <div className="mb-3">
                    <strong>Description:</strong>
                    <p className="mt-1">{selectedDrive.description}</p>
                  </div>
                )}
                {selectedDrive.registrationLink && (
                  <div className="mb-3">
                    <strong>Registration Link:</strong>
                    <a href={selectedDrive.registrationLink} target="_blank" rel="noopener noreferrer" className="ms-2">
                      {selectedDrive.registrationLink}
                    </a>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-success"
                  onClick={() => handleApprove(selectedDrive._id)}
                  disabled={loading}
                >
                  ✓ Approve Drive
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleReject(selectedDrive._id)}
                  disabled={loading}
                >
                  ✗ Reject Drive
                </button>
                <button className="btn btn-secondary" onClick={closeDriveDetails}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
