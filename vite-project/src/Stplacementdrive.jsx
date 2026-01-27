import React, { useEffect, useState } from 'react';
import { useSelector } from "react-redux";
import { getCurrentUser } from './utils/auth';

export default function Stplacementdrive() {
  const [data, setData] = useState([]);
  const [modalData, setModalData] = useState(null);
  const [aiCheckResult, setAiCheckResult] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [matchPercentages, setMatchPercentages] = useState({}); // Store match percentages for each drive
  const [loadingMatches, setLoadingMatches] = useState({}); // Track loading state for each drive
  const backendUrl = useSelector((state) => state.backend.backendUrl);
  useEffect(() => {
    const fetchDrives = async () => {
      try {
        const response = await axios.post(`${backendUrl}/api/drivedataa`);
        const allDrives = Array.isArray(response.data) ? response.data : [];
        // Only show public drives (approved by admin) or drives without approval system
        const publicDrives = allDrives.filter(d => d.isPublic !== false && d.status !== 'Pending Approval');
        setData(publicDrives);
      } catch (err) {
        console.error('Error fetching drives:', err);
        setData([]);
      }
    };
    if (backendUrl) {
      fetchDrives();
    }
  }, [backendUrl]);

  const upcoming = data.filter(d => new Date(d.driveDate) >= new Date());
  const happened = data.filter(d => new Date(d.driveDate) < new Date());

  const openModal = (drive) => {
    setModalData(drive);
  };

  const closeModal = () => {
    setModalData(null);
    setAiCheckResult(null);
  };

  const calculateMatchPercentage = async (driveId, e) => {
    // Prevent modal from opening when clicking the match button
    if (e) {
      e.stopPropagation();
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert('Please login to check match percentage');
      return;
    }

    const studentId = currentUser._id || currentUser.id || currentUser.email;
    if (!studentId) {
      alert('Unable to identify student. Please login again.');
      return;
    }

    // Set loading state for this specific drive
    setLoadingMatches(prev => ({ ...prev, [driveId]: true }));

    try {
      if (!backendUrl) {
        alert('Backend connection not available. Please refresh the page.');
        return;
      }

      const response = await axios.post(`${backendUrl}/api/drive/ai-check`, {
        studentId: studentId,
        driveId: driveId
      }, {
        timeout: 60000 // Increased to 60 seconds for ML/DL processing
      });

      if (response.data) {
        // Store the match percentage for this drive
        const matchPercentage = response.data.placementProbability || response.data.matchPercentage || 0;
        setMatchPercentages(prev => ({ ...prev, [driveId]: matchPercentage }));
      } else {
        alert('No data received from match calculation. Please try again.');
      }
    } catch (err) {
      console.error('Match calculation error:', err);
      console.error('Error details:', {
        studentId,
        driveId,
        response: err.response?.data,
        status: err.response?.status
      });
      
      let errorMsg = err.response?.data?.error || err.message || 'Failed to calculate match';
      const details = err.response?.data?.details || '';
      const suggestion = err.response?.data?.suggestion || '';
      
      // Build a more informative error message
      let fullErrorMsg = `Match Calculation Error: ${errorMsg}`;
      if (details) {
        fullErrorMsg += `\n\n${details}`;
      }
      if (suggestion) {
        fullErrorMsg += `\n\n${suggestion}`;
      }
      
      // If it's a 404 error, it's likely a student/drive not found issue, not AI services
      if (err.response?.status === 404) {
        fullErrorMsg += '\n\nNote: This is not an AI service issue. Please check your login and ensure the drive exists.';
      } else if (err.response?.status === 503 || err.response?.status === 504) {
        fullErrorMsg += '\n\nPlease ensure AI services are running: cd ai-services && python main.py';
      }
      
      alert(fullErrorMsg);
    } finally {
      setLoadingMatches(prev => ({ ...prev, [driveId]: false }));
    }
  };

  const handleAICheck = async () => {
    setLoadingAI(true);
    try {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        alert('Please login to use AI Check');
        setLoadingAI(false);
        return;
      }

      const studentId = currentUser._id || currentUser.id || currentUser.email;
      if (!studentId) {
        alert('Please login to use AI Check');
        setLoadingAI(false);
        return;
      }

      if (!backendUrl) {
        alert('Backend connection not available. Please refresh the page.');
        setLoadingAI(false);
        return;
      }

      const response = await axios.post(`${backendUrl}/api/drive/ai-check`, {
        studentId: studentId,
        driveId: modalData._id
      });

      if (response.data) {
        setAiCheckResult(response.data);
      } else {
        alert('No data received from AI check. Please try again.');
      }
    } catch (err) {
      console.error('AI Check error:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to perform AI check';
      alert(`AI Check Error: ${errorMsg}. Please ensure AI services are running.`);
    } finally {
      setLoadingAI(false);
    }
  };

  const DriveCard = ({ drive, m }) => {
    const matchPercentage = matchPercentages[drive._id];
    const isLoading = loadingMatches[drive._id];
    const isUpcoming = m === 1;

    // Determine color based on match percentage
    const getMatchColor = (percentage) => {
      if (!percentage) return '#6c757d'; // Gray if not calculated
      if (percentage >= 75) return '#28a745'; // Green for high match
      if (percentage >= 50) return '#ffc107'; // Yellow for medium match
      return '#dc3545'; // Red for low match
    };

    const getMatchLabel = (percentage) => {
      if (!percentage) return 'Not Calculated';
      if (percentage >= 75) return 'High Match';
      if (percentage >= 50) return 'Medium Match';
      return 'Low Match';
    };

    return (
      <div
        className="card m-2 p-3 shadow"
        style={{ width: "280px", cursor: "pointer", position: 'relative' }}
        onClick={() => openModal(drive)}
      >
        <h5>{drive.companyName}</h5>
        <p><strong>Role:</strong> {drive.jobRole}</p>
        <p><strong>Date:</strong> {new Date(drive.driveDate).toDateString()}</p>
        {m === 1 ? (
          <p><strong>Status:</strong> {drive.status}</p>
        ) : (
          <p><strong>Status:</strong> Happened</p>
        )}

        {/* Match Percentage Display */}
        {matchPercentage !== undefined && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px',
              backgroundColor: getMatchColor(matchPercentage),
              color: 'white',
              borderRadius: '5px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}
          >
            <div style={{ fontSize: '1.2em' }}>{matchPercentage.toFixed(1)}%</div>
            <div style={{ fontSize: '0.8em', opacity: 0.9 }}>{getMatchLabel(matchPercentage)}</div>
            <div style={{ fontSize: '0.7em', opacity: 0.8, marginTop: '2px' }}>
              Likely to Get Selected
            </div>
          </div>
        )}

        {/* Match Button - Only for upcoming drives */}
        {isUpcoming && (
          <button
            className="btn btn-sm btn-primary mt-2"
            style={{ width: '100%' }}
            onClick={(e) => calculateMatchPercentage(drive._id, e)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Calculating...
              </>
            ) : matchPercentage !== undefined ? (
              '🔄 Recalculate Match'
            ) : (
              '🎯 Check Match %'
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <h4 className="text-center mt-4">Placement Drives</h4>

      <h5 className="mt-4">Upcoming Drives</h5>
      <div className="d-flex flex-wrap">
        {upcoming.length > 0 ? (
          upcoming.map(d => <DriveCard key={d._id} drive={d} m={1}/>)
        ) : (
          <p>No upcoming drives.</p>
        )}
      </div>

      <h5 className="mt-4">Happened Drives</h5>
      <div className="d-flex flex-wrap">
        {happened.length > 0 ? (
          happened.map(d => <DriveCard key={d._id} drive={d} m={0} />)
        ) : (
          <p>No past drives.</p>
        )}
      </div>

      {modalData && (
        <div className="modal show fade d-block" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content p-3">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalData.companyName} - {modalData.jobRole}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <p><strong>Salary:</strong> {modalData.salaryPackage}</p>
                <p><strong>Eligibility:</strong> {modalData.eligibilityCriteria}</p>
                <p><strong>Date:</strong> {new Date(modalData.driveDate).toDateString()}</p>
                <p><strong>Description:</strong> {modalData.description}</p>
                {modalData.requiredSkills && modalData.requiredSkills.length > 0 && (
                  <p><strong>Required Skills:</strong> {modalData.requiredSkills.join(', ')}</p>
                )}

                {/* AI Check Results */}
                {aiCheckResult && (
                  <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                    <h6>AI Match Analysis</h6>
                    <p><strong>Match Percentage:</strong> {aiCheckResult.matchPercentage}%</p>
                    <p><strong>Placement Probability:</strong> {aiCheckResult.placementProbability}%</p>
                    <p><strong>Prediction:</strong> {aiCheckResult.prediction}</p>
                    {aiCheckResult.missingSkills && aiCheckResult.missingSkills.length > 0 && (
                      <div>
                        <strong>Missing Skills:</strong>
                        <ul>
                          {aiCheckResult.missingSkills.map((skill, idx) => (
                            <li key={idx}>{skill}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiCheckResult.recommendations && aiCheckResult.recommendations.length > 0 && (
                      <div>
                        <strong>Recommendations:</strong>
                        <ul>
                          {aiCheckResult.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {new Date(modalData.driveDate) >= new Date() && (
                  <button
                    className="btn btn-info"
                    onClick={handleAICheck}
                    disabled={loadingAI}
                    style={{ marginRight: '10px' }}
                  >
                    {loadingAI ? 'Analyzing...' : '🤖 AI Check'}
                  </button>
                )}
                {new Date(modalData.driveDate) >= new Date() ? (
                  <a
                    href={modalData.registrationLink}
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Apply Now
                  </a>
                ) : (
                  <button className="btn btn-secondary" disabled>
                    Drive Closed
                  </button>
                )}
                <button className="btn btn-outline-secondary" onClick={closeModal}>
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
