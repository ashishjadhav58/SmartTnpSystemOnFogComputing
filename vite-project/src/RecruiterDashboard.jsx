import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { getCurrentRecruiter, isRecruiterAuthenticated } from './utils/auth';
import './style.css';

// Separate components for each section
// Matching function to determine if student fits role requirements
const checkStudentFit = (student, requirements) => {
  if (!requirements || requirements.trim() === '') {
    return { fit: true, score: 0, reason: 'No requirements specified' };
  }
  
  const reqLower = requirements.toLowerCase();
  const studentSkills = (student.skills || []).map(s => s.toLowerCase());
  const studentEducation = (student.education || []).map(e => 
    `${e.degree || ''} ${e.institution || ''}`.toLowerCase()
  ).join(' ');
  const studentProjects = (student.projects || []).map(p => 
    `${p.title || ''} ${p.description || ''} ${(p.technologies || []).join(' ')}`.toLowerCase()
  ).join(' ');
  const studentInternships = (student.internships || []).map(i => 
    `${i.role || ''} ${i.company || ''} ${i.description || ''}`.toLowerCase()
  ).join(' ');
  
  // Extract keywords from requirements (skills, technologies, qualifications)
  const reqKeywords = reqLower
    .split(/[,\s]+/)
    .filter(k => k.length > 2)
    .map(k => k.trim());
  
  let matchScore = 0;
  let matchedKeywords = [];
  let missingKeywords = [];
  
  // Check skill matches
  reqKeywords.forEach(keyword => {
    const skillMatch = studentSkills.some(skill => skill.includes(keyword) || keyword.includes(skill));
    const projectMatch = studentProjects.includes(keyword);
    const internshipMatch = studentInternships.includes(keyword);
    const educationMatch = studentEducation.includes(keyword);
    
    if (skillMatch || projectMatch || internshipMatch || educationMatch) {
      matchScore += 1;
      matchedKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });
  
  // Calculate fit percentage
  const fitPercentage = reqKeywords.length > 0 ? (matchScore / reqKeywords.length) * 100 : 0;
  
  // Consider fit if:
  // 1. At least 60% of keywords match, OR
  // 2. Student has high resume score (>=70) and at least 40% match, OR
  // 3. Student has high placement score (>=70) and at least 40% match
  const isFit = fitPercentage >= 60 || 
                ((student.resumeScore >= 70 || student.placementScore >= 70) && fitPercentage >= 40);
  
  return {
    fit: isFit,
    score: Math.round(fitPercentage),
    matchedKeywords,
    missingKeywords,
    reason: isFit 
      ? `Matches ${Math.round(fitPercentage)}% of requirements` 
      : `Only matches ${Math.round(fitPercentage)}% of requirements`
  };
};

function ViewStudents({ recruiter, backendUrl, filters, setFilters, fetchStudents, students, loading, exportStudents }) {
  const [requirements, setRequirements] = useState('');
  const [fitFilter, setFitFilter] = useState('all'); // 'all', 'fit', 'notfit'
  
  // Filter students based on fit status
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    
    let filtered = students.map(student => {
      const fitResult = checkStudentFit(student, requirements);
      return { ...student, fitResult };
    });
    
    // Apply fit filter
    if (fitFilter === 'fit') {
      filtered = filtered.filter(s => s.fitResult.fit);
    } else if (fitFilter === 'notfit') {
      filtered = filtered.filter(s => !s.fitResult.fit);
    }
    
    return filtered;
  }, [students, requirements, fitFilter]);
  
  return (
    <div style={{ marginTop: '20px' }}>
      {/* Recruitment Requirements Section */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
        <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
          📋 Recruitment Requirements (Enter skills, technologies, qualifications, etc.)
        </label>
        <textarea
          placeholder="e.g., Python, JavaScript, React, Machine Learning, 2+ years experience, B.Tech in Computer Science..."
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          className="form-control"
          rows="3"
          style={{ marginBottom: '10px' }}
        />
        <small className="text-muted">
          Enter keywords separated by commas. The system will match students based on their skills, projects, internships, and education.
        </small>
      </div>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="number"
          placeholder="Min Score (0-100)"
          value={filters.minScore}
          onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
          className="form-control"
          style={{ width: '150px' }}
          min="0"
          max="100"
          step="0.1"
        />
        <input
          type="number"
          placeholder="Max Score (0-100)"
          value={filters.maxScore}
          onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
          className="form-control"
          style={{ width: '150px' }}
          min="0"
          max="100"
          step="0.1"
        />
        <input
          type="number"
          placeholder="Min CGPA (0-10)"
          value={filters.minCGPA}
          onChange={(e) => setFilters({ ...filters, minCGPA: e.target.value })}
          className="form-control"
          style={{ width: '150px' }}
          min="0"
          max="10"
          step="0.1"
          title="Filter by minimum CGPA (e.g., 8.0)"
        />
        <input
          type="number"
          placeholder="Max CGPA (0-10)"
          value={filters.maxCGPA}
          onChange={(e) => setFilters({ ...filters, maxCGPA: e.target.value })}
          className="form-control"
          style={{ width: '150px' }}
          min="0"
          max="10"
          step="0.1"
          title="Filter by maximum CGPA (e.g., 8.5)"
        />
        <select
          value={filters.sortBy || 'score'}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          className="form-control"
          style={{ width: '150px' }}
        >
          <option value="score">Sort by Score</option>
          <option value="cgpa">Sort by CGPA</option>
        </select>
        <select
          value={fitFilter}
          onChange={(e) => setFitFilter(e.target.value)}
          className="form-control"
          style={{ width: '150px' }}
        >
          <option value="all">All Students</option>
          <option value="fit">Fit for Role</option>
          <option value="notfit">Not Fit</option>
        </select>
        <button onClick={fetchStudents} className="btn btn-primary">Filter</button>
        <button onClick={exportStudents} className="btn btn-success">Export Excel</button>
        <button onClick={() => { 
          setFilters({ minScore: '', maxScore: '', minCGPA: '', maxCGPA: '', sortBy: 'score' }); 
          setRequirements('');
          setFitFilter('all');
          fetchStudents(); 
        }} className="btn btn-secondary">Clear Filters</button>
      </div>
      
      {/* Text Prompt Suggestions for CGPA */}
      {(filters.minCGPA || filters.maxCGPA) && (
        <div style={{ marginBottom: '15px', padding: '10px', background: '#e7f3ff', borderRadius: '6px', border: '1px solid #b3d9ff' }}>
          <small style={{ color: '#0066cc', fontWeight: '500' }}>
            💡 <strong>CGPA Filter Active:</strong> Showing students with CGPA 
            {filters.minCGPA ? ` ≥ ${filters.minCGPA}` : ''} 
            {filters.minCGPA && filters.maxCGPA ? ' and ' : ''}
            {filters.maxCGPA ? ` ≤ ${filters.maxCGPA}` : ''}
            {filters.sortBy === 'cgpa' ? ' (sorted by CGPA)' : ''}
          </small>
        </div>
      )}

      {loading ? (
        <div className="text-center" style={{ padding: '40px' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: '10px' }}>Loading students...</p>
        </div>
      ) : !Array.isArray(filteredStudents) || filteredStudents.length === 0 ? (
        <div className="alert alert-info">
          {requirements && fitFilter !== 'all' 
            ? `No students found that are ${fitFilter === 'fit' ? 'fit' : 'not fit'} for the role. Try adjusting your filters or requirements.`
            : 'No students found. Try adjusting your filters.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>CGPA {filters.sortBy === 'cgpa' && '↓'}</th>
                <th>Resume Score</th>
                <th>Placement Score {filters.sortBy === 'score' && '↓'}</th>
                <th>Skills</th>
                {requirements && <th>Match Status</th>}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student._id} style={{ 
                  backgroundColor: requirements && student.fitResult ? 
                    (student.fitResult.fit ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)') : 'transparent'
                }}>
                  <td>{student.username || 'N/A'}</td>
                  <td>{student.email || 'N/A'}</td>
                  <td>
                    <span className={`badge ${(student.latestCGPA || student.cgpa || 0) >= 8.0 ? 'bg-success' : (student.latestCGPA || student.cgpa || 0) >= 7.0 ? 'bg-warning' : 'bg-secondary'}`}>
                      {(student.latestCGPA || student.cgpa || 0).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${(student.resumeScore || 0) >= 70 ? 'bg-success' : (student.resumeScore || 0) >= 50 ? 'bg-warning' : 'bg-danger'}`}>
                      {student.resumeScore || 0}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${(student.placementScore || student.mostLikelyScore || 0) >= 70 ? 'bg-success' : (student.placementScore || student.mostLikelyScore || 0) >= 50 ? 'bg-warning' : 'bg-danger'}`}>
                      {student.placementScore || student.mostLikelyScore || 0}
                    </span>
                  </td>
                  <td>{(student.skills || []).slice(0, 3).join(', ') || 'No skills listed'}</td>
                  {requirements && (
                    <td>
                      {student.fitResult ? (
                        <div>
                          <span className={`badge ${student.fitResult.fit ? 'bg-success' : 'bg-danger'}`}>
                            {student.fitResult.fit ? '✓ Fit' : '✗ Not Fit'}
                          </span>
                          <br />
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {student.fitResult.score}% match
                          </small>
                        </div>
                      ) : (
                        <span className="badge bg-secondary">N/A</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MyDrives({ drives, loading }) {
  return (
    <div style={{ marginTop: '20px' }}>
      <h4>My Created Drives</h4>
      <div className="d-flex flex-wrap">
        {Array.isArray(drives) && drives.length > 0 ? drives.map(drive => (
          <div key={drive._id} className="card m-2" style={{ width: '300px' }}>
            <div className="card-body">
              <h5>{drive.companyName}</h5>
              <p><strong>Role:</strong> {drive.jobRole}</p>
              <p><strong>Status:</strong> {drive.status}</p>
              <p><strong>Date:</strong> {new Date(drive.driveDate).toDateString()}</p>
            </div>
          </div>
        )) : (
          <div className="alert alert-info">No drives created yet. Create a drive using the "Create Drive" option.</div>
        )}
      </div>
    </div>
  );
}

function CreateDrive({ newDrive, setNewDrive, handleCreateDrive, loading }) {
  return (
    <div style={{ marginTop: '20px', maxWidth: '600px' }}>
      <h4>Create New Drive</h4>
      <div className="mb-3">
        <label>Company Name</label>
        <input
          type="text"
          className="form-control"
          value={newDrive.companyName}
          onChange={(e) => setNewDrive({ ...newDrive, companyName: e.target.value })}
        />
      </div>
      <div className="mb-3">
        <label>Job Role</label>
        <input
          type="text"
          className="form-control"
          value={newDrive.jobRole}
          onChange={(e) => setNewDrive({ ...newDrive, jobRole: e.target.value })}
        />
      </div>
      <div className="mb-3">
        <label>Salary Package</label>
        <input
          type="text"
          className="form-control"
          value={newDrive.salaryPackage}
          onChange={(e) => setNewDrive({ ...newDrive, salaryPackage: e.target.value })}
        />
      </div>
      <div className="mb-3">
        <label>Drive Date</label>
        <input
          type="date"
          className="form-control"
          value={newDrive.driveDate}
          onChange={(e) => setNewDrive({ ...newDrive, driveDate: e.target.value })}
        />
      </div>
      <div className="mb-3">
        <label>Required Skills (comma-separated)</label>
        <input
          type="text"
          className="form-control"
          value={newDrive.requiredSkills}
          onChange={(e) => setNewDrive({ ...newDrive, requiredSkills: e.target.value })}
          placeholder="e.g., Python, JavaScript, React"
        />
      </div>
      <div className="mb-3">
        <label>Eligibility Criteria</label>
        <textarea
          className="form-control"
          value={newDrive.eligibilityCriteria}
          onChange={(e) => setNewDrive({ ...newDrive, eligibilityCriteria: e.target.value })}
        />
      </div>
      <div className="mb-3">
        <label>Description</label>
        <textarea
          className="form-control"
          value={newDrive.description}
          onChange={(e) => setNewDrive({ ...newDrive, description: e.target.value })}
        />
      </div>
      <div className="mb-3">
        <label>Registration Link</label>
        <input
          type="url"
          className="form-control"
          value={newDrive.registrationLink}
          onChange={(e) => setNewDrive({ ...newDrive, registrationLink: e.target.value })}
        />
      </div>
      <button onClick={handleCreateDrive} className="btn btn-primary" disabled={loading}>
        {loading ? 'Creating...' : 'Create Drive (Pending Approval)'}
      </button>
    </div>
  );
}

export default function RecruiterDashboard() {
  const [recruiter, setRecruiter] = useState(null);
  const [students, setStudents] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [choice, setChoice] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filters, setFilters] = useState({ minScore: '', maxScore: '', minCGPA: '', maxCGPA: '', sortBy: 'score' });
  const navigate = useNavigate();
  const backendUrl = localStorage.getItem('fogIp') || 'http://localhost:5000';

  const [newDrive, setNewDrive] = useState({
    companyName: '',
    jobRole: '',
    salaryPackage: '',
    driveDate: '',
    eligibilityCriteria: '',
    description: '',
    registrationLink: '',
    requiredSkills: '',
    difficultyLevel: 'Medium'
  });

  // Define fetchStudents using useCallback to avoid initialization error
  // Uses same API pattern as TPO and Class Teacher modules
  const fetchStudents = useCallback(async () => {
    if (!recruiter) {
      console.warn('Cannot fetch students: recruiter not loaded');
      return;
    }
    
    setLoading(true);
    try {
      // Get TPO email (recruiter can only see students from their TPO)
      const tpoemail = recruiter.createdBy || recruiter.tpoemail;
      if (!tpoemail) {
        console.warn('[RecruiterDashboard] WARNING: No TPO email found in recruiter data. Recruiter:', recruiter);
        setStudents([]);
        setLoading(false);
        return;
      }
      
      console.log(`[RecruiterDashboard] Fetching students for TPO: ${tpoemail}`);
      
      // Fetch directly from local MongoDB backend using POST
      const requestBody = {
        tpoemail: tpoemail,
        minScore: filters.minScore || null,
        maxScore: filters.maxScore || null,
        minCGPA: filters.minCGPA || null,
        maxCGPA: filters.maxCGPA || null,
        sortBy: filters.sortBy || 'score'
      };
      
      const response = await axios.post(`${backendUrl}/api/recruiter/students`, requestBody);
      
      // Ensure response.data is an array
      let studentsData = response.data;
      
      if (Array.isArray(studentsData)) {
        setStudents(studentsData);
      } else if (studentsData && Array.isArray(studentsData.data)) {
        setStudents(studentsData.data);
      } else if (studentsData && Array.isArray(studentsData.students)) {
        setStudents(studentsData.students);
      } else {
        console.warn('Unexpected students response format:', studentsData);
        setStudents([]);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      alert('Failed to fetch students. Please try again.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [filters.minScore, filters.maxScore, filters.minCGPA, filters.maxCGPA, filters.sortBy, backendUrl, recruiter]);

  // Define fetchDrives using useCallback
  const fetchDrives = useCallback(async () => {
    if (!recruiter) return;
    try {
      const response = await axios.post(`${backendUrl}/api/drivedataa`);
      
      // Ensure response.data is an array
      let drivesData = response.data;
      let allDrives = [];
      
      if (Array.isArray(drivesData)) {
        allDrives = drivesData;
      } else if (drivesData && Array.isArray(drivesData.data)) {
        allDrives = drivesData.data;
      } else if (drivesData && Array.isArray(drivesData.drives)) {
        allDrives = drivesData.drives;
      } else {
        allDrives = [];
      }
      
      const myDrives = allDrives.filter(d => d.createdBy === recruiter.email);
      setDrives(myDrives);
    } catch (err) {
      console.error('Error fetching drives:', err);
      setDrives([]);
    }
  }, [recruiter, backendUrl]);

  useEffect(() => {
    // Check recruiter authentication
    if (!isRecruiterAuthenticated()) {
      navigate('/', { replace: true });
      return;
    }

    const storedRecruiter = getCurrentRecruiter();
    if (storedRecruiter) {
      setRecruiter(storedRecruiter);
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Fetch students after recruiter is set
  useEffect(() => {
    if (recruiter) {
      fetchStudents();
    }
  }, [recruiter, fetchStudents]);

  // Fetch drives after recruiter is set
  useEffect(() => {
    if (recruiter) {
      fetchDrives();
    }
  }, [recruiter, fetchDrives]);
  
  // If not authenticated, redirect immediately
  if (!isRecruiterAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  // Show loading state if authenticated but recruiter data not loaded yet
  if (!recruiter) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ marginTop: '10px' }}>Loading recruiter portal...</p>
      </div>
    );
  }

  const handleCreateDrive = async () => {
    // Validation
    if (!newDrive.companyName || !newDrive.jobRole || !newDrive.driveDate) {
      alert('Please fill in all required fields (Company Name, Job Role, Drive Date)');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${backendUrl}/api/recruiter/drive/create`, {
        ...newDrive,
        requiredSkills: newDrive.requiredSkills ? newDrive.requiredSkills.split(',').map(s => s.trim()).filter(s => s) : [],
        createdBy: recruiter.email
      });
      alert('Drive created successfully! Waiting for admin approval.');
      setNewDrive({
        companyName: '',
        jobRole: '',
        salaryPackage: '',
        driveDate: '',
        eligibilityCriteria: '',
        description: '',
        registrationLink: '',
        requiredSkills: '',
        difficultyLevel: 'Medium'
      });
      fetchDrives();
      setChoice(2); // Switch to drives view to see the new drive
    } catch (err) {
      console.error('Error creating drive:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create drive';
      alert(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const exportStudents = async () => {
    if (!recruiter) {
      alert('Recruiter data not loaded. Please refresh the page.');
      return;
    }
    
    try {
      // Get TPO email
      const tpoemail = recruiter.createdBy || recruiter.tpoemail;
      if (!tpoemail) {
        alert('TPO email not found. Cannot export students.');
        return;
      }
      
      console.log(`[RecruiterDashboard] Exporting students for TPO: ${tpoemail}`);
      
      // Export directly from local MongoDB backend
      const params = new URLSearchParams();
      if (filters.minScore) params.append('minScore', filters.minScore);
      params.append('limit', '100');
      params.append('tpoemail', tpoemail);

      const response = await axios.post(`${backendUrl}/api/recruiter/students/export?${params}`, {}, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'shortlisted_students.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting students:', err);
      alert('Failed to export students.');
    }
  };

  const logout = () => {
    // Clear all session data
    localStorage.removeItem('recruiter');
    localStorage.removeItem('user');
    localStorage.removeItem('fogIp');
    localStorage.removeItem('rememberedEmail');
    // Redirect to main login page
    window.location.href = '/';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeMobileNav = () => {
    try {
      const el = document.querySelector('.offcanvas.show');
      if (el && window.bootstrap) {
        const bs = window.bootstrap.Offcanvas.getInstance(el) || new window.bootstrap.Offcanvas(el);
        bs.hide();
      }
    } catch (e) {}
  };

  function actionperform(e) {
    const text = e.target.innerText || e.target.textContent || '';
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
    
    switch(cleanText) {
      case "View Students":
        setChoice(1);
        break;
      case "My Drives":
        setChoice(2);
        break;
      case "Create Drive":
        setChoice(3);
        break;
      default:
        if (text.includes('Students') || cleanText.includes('Students')) {
          setChoice(1);
        } else if (text.includes('Drives') && !text.includes('Create')) {
          setChoice(2);
        } else if (text.includes('Create')) {
          setChoice(3);
        }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #f8f9fa)' }}>
      {/* Modern Header - Matching other modules */}
      <div className="modern-header" style={{ marginBottom: '2rem' }}>
        <div className="container-fluid">
          <div className="row align-items-center">
            {/* Logo and Title Section */}
            <div className="col-12 col-md-6 mb-2 mb-md-0">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2 gap-md-3">
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="d-none d-sm-block"
                    style={{ height: '50px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', position: 'relative', zIndex: 2 }} 
                  />
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="d-block d-sm-none"
                    style={{ height: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))', position: 'relative', zIndex: 2 }} 
                  />
                  <div>
                    <h4 className="d-none d-sm-block" style={{ color: 'white', margin: 0, fontWeight: '600', fontSize: '1.25rem' }}>
                      Recruiter Portal
                    </h4>
                    <h5 className="d-block d-sm-none" style={{ color: 'white', margin: 0, fontWeight: '600', fontSize: '0.95rem', lineHeight: '1.2' }}>
                      Recruiter Portal
                    </h5>
                    <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '0.85rem' }} className="d-none d-sm-block">
                      Welcome, {recruiter?.username || recruiter?.companyName || "Guest"}
                    </p>
                    <p className="d-block d-sm-none" style={{ color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '0.7rem', lineHeight: '1.2' }}>
                      {recruiter?.username || recruiter?.companyName || "Guest"}
                    </p>
                  </div>
                </div>
                {/* Mobile Menu Button */}
                <button 
                  className="btn btn-light d-block d-sm-none" 
                  type="button" 
                  data-bs-toggle="offcanvas" 
                  data-bs-target="#mobileNavRecruiter" 
                  aria-controls="mobileNavRecruiter"
                  style={{ 
                    borderRadius: '8px', 
                    padding: '0.375rem 0.625rem',
                    minWidth: 'auto',
                    fontSize: '1rem',
                    lineHeight: '1',
                    height: '36px',
                    width: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ☰
                </button>
              </div>
            </div>
            {/* Desktop Actions */}
            <div className="col-12 col-md-6 d-none d-sm-flex">
              <div className="d-flex justify-content-end align-items-center gap-3 w-100">
                <button 
                  className='btn btn-light desktop-header-btn' 
                  onClick={toggleSidebar}
                  style={{ 
                    borderRadius: '10px', 
                    fontWeight: '600', 
                    minWidth: '48px', 
                    height: '48px',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease'
                  }}
                  title={sidebarOpen ? "Hide Menu" : "Show Menu"}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                >
                  {sidebarOpen ? '◀' : '▶'}
                </button>
                <button 
                  className='btn btn-light desktop-header-btn' 
                  onClick={logout}
                  style={{ 
                    borderRadius: '10px', 
                    fontWeight: '600',
                    padding: '0.625rem 1.25rem',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    background: 'rgba(255, 255, 255, 0.95)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    e.currentTarget.style.background = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                  }}
                >
                  <span>Logout</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Offcanvas nav for mobile */}
      <div className="offcanvas offcanvas-start" tabIndex="-1" id="mobileNavRecruiter" aria-labelledby="mobileNavRecruiterLabel" style={{ width: '280px' }}>
        <div className="offcanvas-header" style={{ background: 'var(--gradient-primary)', color: 'white', padding: '1.25rem' }}>
          <div className="d-flex align-items-center gap-2">
            <img src="logo.png" alt="Logo" style={{ height: '32px' }} />
            <h5 className="offcanvas-title mb-0" id="mobileNavRecruiterLabel" style={{ fontWeight: '600', fontSize: '1.1rem' }}>
              Menu
            </h5>
          </div>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>
        <div className="offcanvas-body" style={{ padding: '1rem' }}>
          {/* User Info Section */}
          <div className="mb-3 p-3" style={{ 
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            borderRadius: '12px',
            border: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Logged in as</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1rem', color: '#0f172a', fontWeight: '600' }}>
              {recruiter?.username || recruiter?.companyName || "Guest"}
            </p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              {recruiter?.email || ""}
            </p>
          </div>

          <div className="d-grid gap-2">
            <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>👥 View Students</button>
            <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>📋 My Drives</button>
            <button onClick={(event)=>{ actionperform(event); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-light text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem' }}>➕ Create Drive</button>
            
            <hr style={{ margin: '1rem 0', borderColor: 'rgba(15, 23, 42, 0.1)' }} />
            
            <button onClick={()=>{ logout(); closeMobileNav(); }} data-bs-dismiss="offcanvas" className='btn btn-danger text-start' style={{ borderRadius: '12px', justifyContent: 'flex-start', padding: '0.875rem 1rem', fontWeight: '600' }}>🚪 Logout</button>
          </div>
        </div>
      </div>

      <div className="container-fluid" style={{ padding: '0 1rem 2rem' }}>
        <div className="row align-items-start" style={{ margin: 0 }}>
          {/* Modern Sidebar - Toggleable */}
          {sidebarOpen && (
            <div 
              className="col-sm-3 col-lg-2 modern-sidebar d-none d-sm-block sidebar-open"
              style={{ 
                borderRadius: '16px',
                padding: '1.5rem 1rem',
                transition: 'all var(--transition-base)',
                alignSelf: 'flex-start'
              }}
            >
              <div style={{ paddingTop: '1rem' }}>
                <button 
                  onClick={(event)=>actionperform(event)} 
                  className='btn btn-light text-start' 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  👥 View Students
                </button>
                <button 
                  onClick={(event)=>actionperform(event)} 
                  className='btn btn-light text-start' 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  📋 My Drives
                </button>
                <button 
                  onClick={(event)=>actionperform(event)} 
                  className='btn btn-light text-start' 
                  style={{ width: '100%', marginBottom: '0.5rem' }}
                >
                  ➕ Create Drive
                </button>
              </div>
            </div>
          )}
          
          {/* Main Content Area */}
          <div className={sidebarOpen ? 'col-sm-9 col-lg-10' : 'col-12'} style={{ transition: 'all var(--transition-base)', paddingLeft: sidebarOpen ? '1rem' : '0' }}>
            <div className="card fade-in" style={{ minHeight: '500px', padding: '2rem' }}>
              {
                choice === 1 ? <ViewStudents recruiter={recruiter} backendUrl={backendUrl} filters={filters} setFilters={setFilters} fetchStudents={fetchStudents} students={students} loading={loading} exportStudents={exportStudents} /> :
                choice === 2 ? <MyDrives drives={drives} loading={loading} /> :
                choice === 3 ? <CreateDrive newDrive={newDrive} setNewDrive={setNewDrive} handleCreateDrive={handleCreateDrive} loading={loading} /> :
                <ViewStudents recruiter={recruiter} backendUrl={backendUrl} filters={filters} setFilters={setFilters} fetchStudents={fetchStudents} students={students} loading={loading} exportStudents={exportStudents} />
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
