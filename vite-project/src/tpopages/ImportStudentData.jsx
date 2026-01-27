import React, { useState, useEffect } from 'react';
import '../style.css';
// axios is loaded via CDN in index.html

export default function ImportStudentData({ onClose, onSuccess }) {
  const [tpoEmail, setTpoEmail] = useState('');
  const [classTeacherEmail, setClassTeacherEmail] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const backendUrl = localStorage.getItem('fogIp') || 'http://localhost:5000';

  useEffect(() => {
    // Get logged-in TPO email
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.email) {
      setTpoEmail(user.email);
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
        return;
      }
      
      setSelectedFile(file);
      setError('');
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredHeaders = ['username', 'email', 'password'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const students = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < 3 || !values[0] || !values[1] || !values[2]) continue;

      const student = {
        username: values[headers.indexOf('username')] || values[0],
        email: values[headers.indexOf('email')] || values[1],
        password: values[headers.indexOf('password')] || values[2]
        // accesstype, tpoemail, and classemail will be added client-side
      };

      students.push(student);
    }

    return students;
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (!classTeacherEmail || !classTeacherEmail.trim()) {
      setError('Please enter class teacher email');
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(classTeacherEmail.trim())) {
      setError('Please enter a valid class teacher email address');
      return;
    }

    if (!tpoEmail) {
      setError('TPO email is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let students = [];

      // Read file
      const fileText = await readFileAsText(selectedFile);
      
      // Parse based on file type
      if (selectedFile.name.endsWith('.csv')) {
        students = parseCSV(fileText);
      } else {
        // For Excel files, we'll use a simple CSV parser (in production, use a library like xlsx)
        setError('Excel files (.xlsx, .xls) are not fully supported. Please convert to CSV format.');
        setLoading(false);
        return;
      }

      if (students.length === 0) {
        setError('No valid student data found in the file');
        setLoading(false);
        return;
      }

      // Format students for AWS Lambda bulk-signup endpoint
      // Add accesstype (always "student"), tpoemail, and classemail from client-side
      // Note: AWS expects accesstype to be lowercase "student" based on the Lambda code
      const users = students.map(student => ({
        username: student.username,
        email: student.email,
        password: student.password,
        accesstype: "student", // Always set to "student" from client-side
        tpoemail: tpoEmail, // From logged-in TPO user
        classemail: classTeacherEmail.trim() // From form input
      }));

      // Import students via AWS Lambda bulk-signup endpoint
      const awsApiUrl = import.meta.env.VITE_AWS_API_GATEWAY || "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod";
      const response = await axios.post(`${awsApiUrl}/bulk-signup`, {
        users: users
      });

      if (response.data && response.data.message) {
        const insertedCount = response.data.insertedCount || 0;
        const skippedCount = response.data.skippedCount || 0;
        const skippedEmails = response.data.skipped || [];
        let message = `Successfully imported ${insertedCount} students.`;
        if (skippedCount > 0) {
          message += ` ${skippedCount} skipped (already exist).`;
          if (skippedEmails.length > 0 && skippedEmails.length <= 5) {
            message += ` Skipped: ${skippedEmails.join(', ')}`;
          }
        }
        setSuccess(message);
        setTimeout(() => {
          if (onSuccess) onSuccess();
          if (onClose) onClose();
        }, 2000);
      } else {
        setError(response.data?.message || 'Failed to import students');
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to import students');
    } finally {
      setLoading(false);
    }
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  return (
    <div 
      className="modal show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Import Student Data</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success" role="alert">
                {success}
              </div>
            )}

            <div className="mb-3">
              <label className="form-label">TPO Email</label>
              <input
                type="email"
                className="form-control"
                value={tpoEmail}
                readOnly
                disabled
              />
              <small className="form-text text-muted">This is automatically set from your login</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Class Teacher Email <span className="text-danger">*</span></label>
              <input
                type="email"
                className="form-control"
                value={classTeacherEmail}
                onChange={(e) => setClassTeacherEmail(e.target.value)}
                placeholder="teacher@example.com"
                disabled={loading}
                required
              />
              <small className="form-text text-muted">Enter the email address of the class teacher</small>
            </div>

            <div className="mb-3">
              <label className="form-label">Student Data File (CSV) <span className="text-danger">*</span></label>
              <input
                type="file"
                className="form-control"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={loading}
                required
              />
              <small className="form-text text-muted">
                File must contain columns: username, email, password (accesstype, tpoemail, and classemail will be added automatically)
              </small>
            </div>

            {selectedFile && (
              <div className="alert alert-info">
                <strong>Selected file:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </div>
            )}

            <div className="alert alert-secondary">
              <strong>CSV Format:</strong>
              <pre style={{ margin: '0.5rem 0', fontSize: '0.875rem' }}>
{`username,email,password
John Doe,john@example.com,password123
Jane Smith,jane@example.com,password456`}
              </pre>
              <small className="text-muted">
                <strong>Note:</strong> The system will automatically add accesstype="student", tpoemail (from your login), and classemail (from the field above) to each student record.
              </small>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleImport}
              disabled={loading || !selectedFile || !classTeacherEmail.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Importing...
                </>
              ) : (
                'Import Students'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
