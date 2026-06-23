import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setBackendUrl } from './store/backendSlice';
import { isRecruiterAuthenticated, setRecruiterSession } from './utils/auth';
import { isVercelDomain, isIPAddress, getBackendUrl, getAIServiceUrl } from './utils/networkUtils';
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
      const awsApiUrl = import.meta.env.VITE_AWS_API_GATEWAY || "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod";
      
      let cloudResponse;
      let userData;
      let fogIp;
      let aiServices = {};
      
      // If Vercel domain, only use AWS
      if (isVercelDomain()) {
        console.log('[RecruiterLogin] Vercel domain - using AWS only');
        cloudResponse = await axios.post(
          `${awsApiUrl}/signin`,
          {
            username: formData.email,
            password: formData.password
          },
          { timeout: 10000 }
        );
        userData = cloudResponse.data?.data;
        fogIp = cloudResponse.data?.ip;
        aiServices = cloudResponse.data?.aiServices || {};
      }
      // If IP address, try AWS first, then fallback to local
      else if (isIPAddress()) {
        const localBackendUrl = getBackendUrl();
        const localAIServiceUrl = getAIServiceUrl();
        
        console.log('[RecruiterLogin] IP address detected - trying AWS first, then local fallback');
        
        try {
          // Try AWS first with timeout
          cloudResponse = await Promise.race([
            axios.post(
              `${awsApiUrl}/signin`,
              {
                username: formData.email,
                password: formData.password
              },
              { timeout: 5000 }
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('AWS timeout')), 5000)
            )
          ]);
          
          console.log('[RecruiterLogin] AWS signin successful');
          userData = cloudResponse.data?.data;
          fogIp = cloudResponse.data?.ip;
          // Use AI service URLs from AWS response (when online)
          aiServices = cloudResponse.data?.aiServices || {};
          console.log('[RecruiterLogin] AI Services from AWS:', aiServices);
        } catch (awsError) {
          console.warn('[RecruiterLogin] AWS signin failed, trying local server:', awsError.message);
          
          // AWS failed, try local recruiter login
          try {
            cloudResponse = await axios.post(
              `${localBackendUrl}/api/recruiter/login`,
              {
                email: formData.email,
                password: formData.password
              },
              { timeout: 10000 }
            );
            
            console.log('[RecruiterLogin] Local signin successful');
            // Format local response to match AWS format
            userData = {
              _id: cloudResponse.data?.recruiter?._id || cloudResponse.data?.recruiter?.email,
              id: cloudResponse.data?.recruiter?._id || cloudResponse.data?.recruiter?.email,
              email: cloudResponse.data?.recruiter?.email || formData.email,
              username: cloudResponse.data?.recruiter?.username || formData.email,
              companyName: cloudResponse.data?.recruiter?.companyName || '',
              contactNumber: cloudResponse.data?.recruiter?.contactNumber || '',
              accesstype: "Recruiter",
              isApproved: cloudResponse.data?.recruiter?.isApproved !== false,
              createdBy: cloudResponse.data?.recruiter?.createdBy || '',
              tpoemail: cloudResponse.data?.recruiter?.createdBy || ''
            };
            fogIp = localBackendUrl;
            aiServices = {
              baseUrl: localAIServiceUrl,
              resume: `${localAIServiceUrl}/resume`,
              predict: `${localAIServiceUrl}/predict`,
              match: `${localAIServiceUrl}/match`,
              chat: `${localAIServiceUrl}/resume/chat`
            };
          } catch (localError) {
            console.error('[RecruiterLogin] Local signin also failed:', localError);
            throw new Error('Both AWS and local server are unavailable. Please check your network connection.');
          }
        }
      }
      // Default: use AWS only
      else {
        console.log('[RecruiterLogin] Using AWS (default)');
        cloudResponse = await axios.post(
          `${awsApiUrl}/signin`,
          {
            username: formData.email,
            password: formData.password
          },
          { timeout: 10000 }
        );
        userData = cloudResponse.data?.data;
        fogIp = cloudResponse.data?.ip;
        // Use AI service URLs from AWS response (when online)
        aiServices = cloudResponse.data?.aiServices || {};
        console.log('[RecruiterLogin] AI Services from AWS (default):', aiServices);
      }

      // Check if user is a recruiter (from AWS or local)
      if (userData && (userData.accesstype === "Recruiter" || userData.accesstype === undefined)) {
        // Set fog IP
        if (fogIp) {
          dispatch(setBackendUrl(fogIp));
          localStorage.setItem("fogIp", fogIp);
        }
        
        // Store AI service URLs from signin response
        // When online (AWS): Use AI service URLs from AWS response
        // When offline (local): Use local IP:8000 (already set in local fallback)
        if (aiServices && Object.keys(aiServices).length > 0) {
          localStorage.setItem("aiServices", JSON.stringify(aiServices));
          console.log('[RecruiterLogin] ✅ Stored AI services from response (online mode):', aiServices);
        } else {
          // Fallback: If no AI services in response, determine based on network mode
          const fallbackAiServices = isIPAddress() ? {
            baseUrl: getAIServiceUrl(),
            resume: `${getAIServiceUrl()}/resume`,
            predict: `${getAIServiceUrl()}/predict`,
            match: `${getAIServiceUrl()}/match`,
            chat: `${getAIServiceUrl()}/resume/chat`
          } : {
            baseUrl: 'http://localhost:8000',
            resume: 'http://localhost:8000/resume',
            predict: 'http://localhost:8000/predict',
            match: 'http://localhost:8000/match',
            chat: 'http://localhost:8000/resume/chat'
          };
          localStorage.setItem("aiServices", JSON.stringify(fallbackAiServices));
          console.log('[RecruiterLogin] ⚠️ Using fallback AI services:', fallbackAiServices);
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
