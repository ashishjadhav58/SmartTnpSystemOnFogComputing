import React, { useEffect, useState } from 'react';
export default function ResumePage() {
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'replace'
  const [inputMode, setInputMode] = useState('url'); // 'url' or 'file'

  const backendUrl = localStorage.getItem('fogIp') || 'http://localhost:5000';

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
      fetchResume(storedUser.email);
    }
  }, []);

  // Fetch existing resume by email
  const fetchResume = async (email) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${backendUrl}/api/emailurls/get`, { email });
      setResume(response.data);
      setResumeUrl(response.data.url);
    } catch (err) {
      // Resume not found or error
      setResume(null);
      setResumeUrl('');
      if (err.response?.status !== 404) {
        setError('Error fetching resume');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) {
      setError('Please select a file');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
          
          const payload = {
            userId: user.email || user._id,
            filename: file.name,
            fileContent: base64Content
          };
          
          const response = await axios.post(
            'https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod/uploadResume',
            payload
          );
          
          setResumeUrl(response.data.resumeUrl);
          setSuccess('File uploaded successfully!');
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to upload file to AWS');
        } finally {
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error processing file');
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        return;
      }
      
      if (file.size > maxSize) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setResumeFile(file);
      await handleFileUpload(file);
    }
  };

  // Add new resume
  const handleAddResume = async () => {
    if (inputMode === 'url' && !resumeUrl.trim()) {
      setError('Please enter a resume URL or upload a file');
      return;
    }
    if (inputMode === 'file' && !resumeUrl.trim()) {
      setError('Please upload a file');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        email: user.email,
        url: resumeUrl,
      };

      const response = await axios.post(`${backendUrl}/api/emailurls`, payload);
      setResume(response.data);
      setSuccess('Resume added successfully!');
      setShowForm(false);
      setResumeUrl('');
      setResumeFile(null);
      setInputMode('url');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to add resume';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Replace existing resume
  const handleReplaceResume = async () => {
    if (inputMode === 'url' && !resumeUrl.trim()) {
      setError('Please enter a resume URL or upload a file');
      return;
    }
    if (inputMode === 'file' && !resumeUrl.trim()) {
      setError('Please upload a file');
      return;
    }

    if (!resume?._id) {
      setError('No existing resume to replace');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        email: user.email,
        url: resumeUrl,
      };

      const response = await axios.put(`${backendUrl}/api/emailurls/${resume._id}`, payload);
      setResume(response.data);
      setSuccess('Resume replaced successfully!');
      setShowForm(false);
      setResumeUrl('');
      setResumeFile(null);
      setInputMode('url');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to replace resume';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (formMode === 'add') {
      handleAddResume();
    } else {
      handleReplaceResume();
    }
  };

  const openAddForm = () => {
    setFormMode('add');
    setResumeUrl('');
    setResumeFile(null);
    setInputMode('url');
    setShowForm(true);
    setError('');
  };

  const openReplaceForm = () => {
    if (!resume) {
      setError('No resume to replace. Please add one first.');
      return;
    }
    setFormMode('replace');
    setResumeUrl(resume.url);
    setResumeFile(null);
    setInputMode('url');
    setShowForm(true);
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setResumeUrl('');
    setError('');
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">📄 Resume Management</h2>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError('')}
          ></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess('')}
          ></button>
        </div>
      )}

      {loading && <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>}

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Your Resume</h5>
        </div>
        <div className="card-body">
          {resume ? (
            <div>
              <p className="mb-2">
                <strong>Email:</strong> {resume.email}
              </p>
              <p className="mb-3">
                <strong>Resume:</strong>{' '}
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary ms-2 btn-responsive clickable"
                  onClick={() => window.open(resume.url, '_blank', 'noopener')}
                  aria-label="Open resume in new tab"
                >
                  Show
                </button>
              </p>
              <p className="text-muted small">
                <strong>Last Updated:</strong> {new Date(resume.updatedAt).toLocaleString()}
              </p>
              <button
                className="btn btn-warning me-2 btn-responsive"
                onClick={openReplaceForm}
                disabled={loading}
              >
                Replace Resume
              </button>
            </div>
          ) : (
            <div className="alert alert-info">
              No resume found. Please add one to get started.
            </div>
          )}

          {!resume && (
            <button
              className="btn btn-success btn-responsive"
              onClick={openAddForm}
              disabled={loading}
            >
              Add Resume
            </button>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {formMode === 'add' ? 'Add Resume' : 'Replace Resume'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeForm}
                  disabled={loading}
                ></button>
              </div>
              <div className="modal-body">
                {/* Toggle between URL and File upload */}
                <div className="mb-3">
                  <div className="btn-group" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      name="inputMode"
                      id="urlMode"
                      checked={inputMode === 'url'}
                      onChange={() => {
                        setInputMode('url');
                        setResumeFile(null);
                        setError('');
                        setSuccess('');
                      }}
                      disabled={loading}
                    />
                    <label className="btn btn-outline-primary" htmlFor="urlMode">
                      URL
                    </label>

                    <input
                      type="radio"
                      className="btn-check"
                      name="inputMode"
                      id="fileMode"
                      checked={inputMode === 'file'}
                      onChange={() => {
                        setInputMode('file');
                        setResumeUrl('');
                        setError('');
                        setSuccess('');
                      }}
                      disabled={loading}
                    />
                    <label className="btn btn-outline-primary" htmlFor="fileMode">
                      File Upload
                    </label>
                  </div>
                </div>

                {/* URL Input */}
                {inputMode === 'url' && (
                  <div className="mb-3">
                    <label htmlFor="resumeUrl" className="form-label">
                      Resume URL
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      id="resumeUrl"
                      placeholder="https://example.com/resume.pdf"
                      value={resumeUrl}
                      onChange={(e) => setResumeUrl(e.target.value)}
                      disabled={loading}
                    />
                    <small className="text-muted">
                      Enter the URL to your resume (Google Drive, Dropbox, etc.)
                    </small>
                  </div>
                )}

                {/* File Upload */}
                {inputMode === 'file' && (
                  <div className="mb-3">
                    <label htmlFor="resumeFile" className="form-label">
                      Upload Resume
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      id="resumeFile"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      disabled={loading}
                    />
                    <small className="text-muted">
                      Supported formats: PDF, DOC, DOCX (Max 5MB)
                    </small>
                    {resumeFile && (
                      <div className="mt-2">
                        <strong>Selected:</strong> {resumeFile.name}
                      </div>
                    )}
                    {resumeUrl && inputMode === 'file' && (
                      <div className="mt-2 alert alert-success">
                        File uploaded successfully!
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeForm}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${formMode === 'add' ? 'btn-success' : 'btn-warning'} btn-responsive`}
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : formMode === 'add' ? 'Add Resume' : 'Replace Resume'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
