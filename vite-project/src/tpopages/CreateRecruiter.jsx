import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import '../style.css';

export default function CreateRecruiter() {
  const backendUrl = useSelector((state) => state.backend.backendUrl) || localStorage.getItem('fogIp') || 'http://localhost:5000';
  const user = JSON.parse(localStorage.getItem('user'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    companyName: '',
    contactNumber: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user types
    if (error) setError('');
    if (success) setSuccess('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.contactNumber.trim()) {
      setError('Contact number is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create recruiter in cloud (AWS DynamoDB) using signup API
      const cloudSignupData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        accesstype: "Recruiter",
        classemail: "", // Not applicable for recruiters
        tpoemail: user.email // TPO email who is creating this recruiter
      };

      console.log('Creating recruiter in cloud...', cloudSignupData);
      const awsApiUrl = import.meta.env.VITE_AWS_API_GATEWAY || "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod";
      const cloudResponse = await axios.post(
        `${awsApiUrl}/signup`,
        cloudSignupData
      );

      if (!cloudResponse.data || cloudResponse.data.message !== "User successfully registered") {
        throw new Error('Cloud signup failed: ' + (cloudResponse.data?.message || 'Unknown error'));
      }

      console.log('Cloud signup successful:', cloudResponse.data);

      // Step 2: Save recruiter locally in MongoDB (for Manage Recruiters page)
      const localResponse = await axios.post(`${backendUrl}/api/recruiter/create`, {
        username: formData.username,
        email: formData.email,
        password: formData.password, // Backend will hash it
        companyName: formData.companyName,
        contactNumber: formData.contactNumber,
        createdBy: user.email // TPO email who is creating this recruiter
      });

      if (localResponse.data && localResponse.data.message) {
        setSuccess('Recruiter account created successfully in cloud and local database! The recruiter can now login immediately.');
        // Reset form
        setFormData({
          username: '',
          email: '',
          password: '',
          companyName: '',
          contactNumber: ''
        });
      }
    } catch (err) {
      console.error('Error creating recruiter:', err);
      
      // Handle specific error cases
      if (err.response?.status === 409) {
        setError('Recruiter with this email already exists in cloud. Please use a different email.');
      } else if (err.response?.data?.message?.includes('already exists')) {
        setError('Recruiter with this email already exists. Please use a different email.');
      } else {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to create recruiter account';
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h3 style={{ marginBottom: '20px', color: '#1e40af' }}>Create Recruiter Account</h3>
      
      <div style={{ 
        background: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
          <strong>Note:</strong> Recruiter accounts created by TPO require admin approval before they can login. 
          The recruiter will be notified once their account is approved.
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

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="username" className="form-label">
              Username <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter recruiter username"
              required
              disabled={loading}
            />
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="email" className="form-label">
              Email <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="recruiter@company.com"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="password" className="form-label">
              Password <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              disabled={loading}
            />
            <small className="form-text text-muted">Password must be at least 8 characters long</small>
          </div>

          <div className="col-md-6 mb-3">
            <label htmlFor="companyName" className="form-label">
              Company Name <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              className="form-control"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Company Name"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label htmlFor="contactNumber" className="form-label">
              Contact Number <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="tel"
              className="form-control"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder="+91 1234567890"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="mb-3">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              padding: '10px 30px',
              fontSize: '1rem',
              fontWeight: '600',
              minWidth: '150px'
            }}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating...
              </>
            ) : (
              'Create Recruiter Account'
            )}
          </button>
        </div>
      </form>

      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#e7f3ff', 
        borderRadius: '8px',
        border: '1px solid #b3d9ff'
      }}>
        <h5 style={{ marginBottom: '10px', color: '#0056b3' }}>Workflow:</h5>
        <ol style={{ margin: 0, paddingLeft: '20px' }}>
          <li>TPO creates recruiter account (this page)</li>
          <li>Recruiter account is created and ready to use</li>
          <li>Recruiter can login immediately and access the system</li>
        </ol>
      </div>
    </div>
  );
}
