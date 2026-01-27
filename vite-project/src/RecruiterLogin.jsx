import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setBackendUrl } from './store/backendSlice';
import { isRecruiterAuthenticated, setRecruiterSession } from './utils/auth';
import './style.css';

export default function RecruiterLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const backendUrl = localStorage.getItem('fogIp') || 'http://localhost:5000';

  // Redirect if already logged in
  useEffect(() => {
    if (isRecruiterAuthenticated()) {
      navigate('/recruiter/dashboard', { replace: true });
    } else {
      // If not logged in, redirect to main login page
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Try cloud login first (same as regular login)
      const awsApiUrl = import.meta.env.VITE_AWS_API_GATEWAY || "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod";
      const cloudResponse = await axios.post(
        `${awsApiUrl}/signin`,
        {
          username: formData.email,
          password: formData.password
        }
      );

      const userData = cloudResponse.data?.data;
      const fogIp = cloudResponse.data?.ip;
      const aiServices = cloudResponse.data?.aiServices || {};

      // Check if user is a recruiter
      if (userData && userData.accesstype === "Recruiter") {
        // Set fog IP
        if (fogIp) {
          dispatch(setBackendUrl(fogIp));
          localStorage.setItem("fogIp", fogIp);
        }
        
        // Store AI service URLs from signin response
        if (aiServices && Object.keys(aiServices).length > 0) {
          localStorage.setItem("aiServices", JSON.stringify(aiServices));
          console.log('[RecruiterLogin] Stored AI services:', aiServices);
        } else {
          // Fallback to default localhost if not provided
          const defaultAiServices = {
            baseUrl: 'http://localhost:8000',
            resume: 'http://localhost:8000/resume',
            predict: 'http://localhost:8000/predict',
            match: 'http://localhost:8000/match',
            chat: 'http://localhost:8000/resume/chat'
          };
          localStorage.setItem("aiServices", JSON.stringify(defaultAiServices));
          console.log('[RecruiterLogin] Using default AI services:', defaultAiServices);
        }

        // Format recruiter data to match expected format
        // Store TPO email (createdBy or tpoemail) for filtering students
        const recruiterData = {
          _id: userData._id || userData.email,
          email: userData.email,
          username: userData.username || userData.email,
          companyName: userData.companyName || '',
          contactNumber: userData.contactNumber || '',
          accesstype: "Recruiter",
          isApproved: userData.isApproved !== false, // Default to true if not specified
          createdBy: userData.createdBy || userData.tpoemail || '', // TPO email who created this recruiter
          tpoemail: userData.tpoemail || userData.createdBy || '', // Alternative field name
          approvedBy: userData.approvedBy || ''
        };
        
        console.log('[RecruiterLogin] Storing recruiter data with TPO email:', {
          email: recruiterData.email,
          createdBy: recruiterData.createdBy,
          tpoemail: recruiterData.tpoemail
        });

        setRecruiterSession(recruiterData);
        navigate('/recruiter/dashboard', { replace: true });
        return;
      }

      // If cloud login succeeded but user is not a recruiter
      if (userData && userData.accesstype !== "Recruiter") {
        setError(`This account is registered as ${userData.accesstype}. Please use the appropriate login page.`);
        setLoading(false);
        return;
      }

      // If cloud login didn't return recruiter, try local backend as fallback
      const localResponse = await axios.post(`${backendUrl}/api/recruiter/login`, formData);
      if (localResponse.data.recruiter) {
        const localRecruiter = localResponse.data.recruiter;
        // Format local recruiter data to include TPO email
        const recruiterData = {
          _id: localRecruiter._id || localRecruiter.email,
          email: localRecruiter.email,
          username: localRecruiter.username || localRecruiter.email,
          companyName: localRecruiter.companyName || '',
          contactNumber: localRecruiter.contactNumber || '',
          accesstype: "Recruiter",
          isApproved: localRecruiter.isApproved !== false,
          createdBy: localRecruiter.createdBy || localRecruiter.tpoemail || '', // TPO email
          tpoemail: localRecruiter.tpoemail || localRecruiter.createdBy || '', // Alternative field
          approvedBy: localRecruiter.approvedBy || ''
        };
        
        console.log('[RecruiterLogin] Storing local recruiter data with TPO email:', {
          email: recruiterData.email,
          createdBy: recruiterData.createdBy,
          tpoemail: recruiterData.tpoemail
        });
        
        setRecruiterSession(recruiterData);
        navigate('/recruiter/dashboard', { replace: true });
      } else {
        setError('Login failed. Please check your credentials.');
      }

    } catch (err) {
      console.error('Recruiter login error:', err);
      
      // If cloud login failed, try local backend as fallback
      if (err.response?.status === 401 || err.response?.status === 404) {
        try {
          const localResponse = await axios.post(`${backendUrl}/api/recruiter/login`, formData);
          if (localResponse.data.recruiter) {
            const localRecruiter = localResponse.data.recruiter;
            // Format local recruiter data to include TPO email
            const recruiterData = {
              _id: localRecruiter._id || localRecruiter.email,
              email: localRecruiter.email,
              username: localRecruiter.username || localRecruiter.email,
              companyName: localRecruiter.companyName || '',
              contactNumber: localRecruiter.contactNumber || '',
              accesstype: "Recruiter",
              isApproved: localRecruiter.isApproved !== false,
              createdBy: localRecruiter.createdBy || localRecruiter.tpoemail || '', // TPO email
              tpoemail: localRecruiter.tpoemail || localRecruiter.createdBy || '', // Alternative field
              approvedBy: localRecruiter.approvedBy || ''
            };
            
            console.log('[RecruiterLogin] Storing local recruiter data (fallback) with TPO email:', {
              email: recruiterData.email,
              createdBy: recruiterData.createdBy,
              tpoemail: recruiterData.tpoemail
            });
            
            setRecruiterSession(recruiterData);
            navigate('/recruiter/dashboard', { replace: true });
            return;
          }
        } catch (localErr) {
          console.error('Local login also failed:', localErr);
        }
      }

      // Show appropriate error message
      if (err.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (err.message === 'Network Error') {
        setError('Network error. Please check your connection.');
      } else {
        setError(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Recruiter Login</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <div className="mb-3">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-control"
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
