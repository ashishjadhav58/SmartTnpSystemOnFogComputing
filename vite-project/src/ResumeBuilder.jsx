import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, isAuthenticated, hasAccessType, clearSession } from './utils/auth';
import './style.css';

export default function ResumeBuilder() {
  const backendUrl = useSelector((state) => state.backend.backendUrl) || localStorage.getItem('fogIp') || 'http://localhost:5000';
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resumeScore, setResumeScore] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [aiGenerating, setAiGenerating] = useState({});
  const [cvSummary, setCvSummary] = useState('');
  const [latexCode, setLatexCode] = useState('');
  const [showModifyPrompt, setShowModifyPrompt] = useState(false);
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [modifying, setModifying] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [resumeData, setResumeData] = useState({
    education: [],
    skills: [],
    projects: [],
    internships: []
  });
  const [skillsInput, setSkillsInput] = useState(''); // Raw input for skills textarea

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      navigate('/', { replace: true });
      return;
    }

    // Check if user is a student
    if (!hasAccessType('Student')) {
      alert('Only students can access Resume Builder');
      navigate('/student', { replace: true });
      return;
    }

    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Get student ID - handle both _id, id, or use email as fallback
      const studentId = currentUser._id || currentUser.id || currentUser.email;
      if (studentId) {
        fetchResume(studentId);
      } else {
        console.error('No valid student identifier found');
        // Don't redirect - just show empty form for new resume
      }
    } else {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const fetchResume = async (studentId) => {
    try {
      setLoading(true);
      console.log(`[ResumeBuilder] Fetching resume for student: ${studentId}`);
      
      const response = await axios.get(`${backendUrl}/api/resume/${studentId}`, {
        timeout: 10000
      });
      
      console.log('[ResumeBuilder] Resume data received:', response.data);
      
      if (response.data) {
        // Extract resume data from response
        const resume = response.data.resume || {};
        const skills = response.data.skills || [];
        
        // Ensure arrays exist and have proper structure
        const education = Array.isArray(resume.education) ? resume.education : [];
        const projects = Array.isArray(resume.projects) ? resume.projects : [];
        const internships = Array.isArray(resume.internships) ? resume.internships : [];
        
        // Ensure education entries have all required fields
        const normalizedEducation = education.map(edu => ({
          degree: edu.degree || '',
          institution: edu.institution || '',
          year: edu.year || '',
          cgpa: edu.cgpa || edu.CGPA || ''
        }));
        
        // Ensure projects have all required fields
        const normalizedProjects = projects.map(proj => ({
          title: proj.title || '',
          description: proj.description || '',
          technologies: Array.isArray(proj.technologies) ? proj.technologies : (proj.technologies ? [proj.technologies] : []),
          duration: proj.duration || ''
        }));
        
        // Ensure internships have all required fields
        const normalizedInternships = internships.map(int => ({
          company: int.company || '',
          role: int.role || '',
          duration: int.duration || '',
          description: int.description || ''
        }));
        
        // Update state with normalized data
        setResumeData({
          education: normalizedEducation,
          skills: Array.isArray(skills) ? skills : [],
          projects: normalizedProjects,
          internships: normalizedInternships
        });
        
        // Set skills input to match loaded skills
        setSkillsInput(Array.isArray(skills) ? skills.join(', ') : '');
        
        // Set resume score if available
        if (response.data.resumeScore !== undefined) {
          setResumeScore(response.data.resumeScore);
        }
        
        console.log('[ResumeBuilder] Resume data loaded successfully:', {
          educationCount: normalizedEducation.length,
          skillsCount: skills.length,
          projectsCount: normalizedProjects.length,
          internshipsCount: normalizedInternships.length
        });
        
        // Mark data as loaded
        setDataLoaded(true);
      } else {
        console.log('[ResumeBuilder] No resume data found, starting with empty form');
        // Keep default empty state
        setDataLoaded(true); // Still mark as loaded (even if empty)
      }
    } catch (err) {
      console.error('[ResumeBuilder] Error fetching resume:', err);
      
      // If 404, it means no resume exists yet - that's okay, start with empty form
      if (err.response?.status === 404) {
        console.log('[ResumeBuilder] No existing resume found - starting with empty form');
        // Keep default empty state - user can create new resume
        setDataLoaded(true); // Mark as loaded (no data to load)
      } else {
        // For other errors, show a non-intrusive message
        console.warn('[ResumeBuilder] Could not load existing resume data:', err.message);
        // Don't alert user - they can still create a new resume
        setDataLoaded(true); // Mark as loaded (attempted, but failed)
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddEducation = () => {
    setResumeData({
      ...resumeData,
      education: [...resumeData.education, { degree: '', institution: '', year: '', cgpa: '' }]
    });
  };

  const handleAddProject = () => {
    setResumeData({
      ...resumeData,
      projects: [...resumeData.projects, { title: '', description: '', technologies: [], duration: '' }]
    });
  };

  const handleAddInternship = () => {
    setResumeData({
      ...resumeData,
      internships: [...resumeData.internships, { company: '', role: '', duration: '', description: '' }]
    });
  };

  const handleUpdateEducation = (index, field, value) => {
    const updated = [...resumeData.education];
    updated[index][field] = value;
    setResumeData({ ...resumeData, education: updated });
  };

  const handleUpdateProject = (index, field, value) => {
    const updated = [...resumeData.projects];
    if (field === 'technologies') {
      updated[index].technologies = value.split(',').map(s => s.trim());
    } else {
      updated[index][field] = value;
    }
    setResumeData({ ...resumeData, projects: updated });
  };

  const handleUpdateInternship = (index, field, value) => {
    const updated = [...resumeData.internships];
    updated[index][field] = value;
    setResumeData({ ...resumeData, internships: updated });
  };

  const handleSkillsChange = (e) => {
    // Allow free typing - store raw input
    const rawValue = e.target.value;
    setSkillsInput(rawValue);
    
    // Process skills on blur or when user finishes typing
    // This allows commas to be typed without immediate splitting
  };

  const handleSkillsBlur = () => {
    // Process skills when user leaves the field
    const skills = skillsInput.split(',').map(s => s.trim()).filter(s => s);
    setResumeData({ ...resumeData, skills });
    // Update input to show processed format
    setSkillsInput(skills.join(', '));
  };

  const handleSkillsKeyDown = (e) => {
    // Allow Enter key to add a new skill (treat as comma)
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentValue = skillsInput.trim();
      if (currentValue) {
        // Add current text as a skill and clear input
        const newSkills = [...resumeData.skills, currentValue];
        setResumeData({ ...resumeData, skills: newSkills });
        setSkillsInput('');
      }
    }
  };

  const scoreResume = async () => {
    // Validate resume has some content
    const hasContent = resumeData.education.length > 0 || 
                       resumeData.skills.length > 0 || 
                       resumeData.projects.length > 0 || 
                       resumeData.internships.length > 0;
    
    if (!hasContent) {
      alert('Please add some content to your resume before scoring.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/ai/resume/score`, resumeData);
      if (response.data) {
        const score = response.data.resumeScore || 0;
        const atsScore = response.data.atsScore || score;
        setResumeScore(atsScore); // Use ATS score as primary
        setSuggestions(response.data.suggestions || []);
        setStrengths(response.data.strengths || []);
        setWeaknesses(response.data.weaknesses || []);
        
        // Show ATS-specific message
        if (response.data.note) {
          // Fallback scoring was used
          alert(`⚠️ ${response.data.note}\n\nBasic Score: ${atsScore.toFixed(1)}/100\n\nTo get advanced ATS analysis, please start the AI services.`);
        } else if (response.data.atsTargetMet) {
          // ATS target met (80%+)
          alert(`✅ Excellent! Your resume achieved ${atsScore.toFixed(1)}% ATS compatibility, meeting the industry standard of 80%+!\n\nYour resume is optimized for Applicant Tracking Systems and should perform well in automated screening.`);
        } else if (atsScore < 80) {
          // Below target
          const gap = (80 - atsScore).toFixed(1);
          alert(`⚠️ Current ATS Score: ${atsScore.toFixed(1)}%\n\nTarget: 80%+ (Need ${gap}% more)\n\nCheck recommendations below to improve your ATS compatibility. Focus on:\n• Adding more technical keywords\n• Detailed project descriptions\n• Quantifiable achievements\n• Action verbs`);
        } else {
          // General success
          alert(`✅ Resume scored successfully!\n\nATS Score: ${atsScore.toFixed(1)}%`);
        }
        
        // Auto-save score if user is logged in
        if (user) {
          // Get student ID - handle both _id, id, or use email as fallback
          const studentId = user._id || user.id || user.email;
          if (studentId) {
            try {
              await axios.post(`${backendUrl}/api/resume/save/${studentId}`, resumeData);
            } catch (saveErr) {
              console.error('Error auto-saving score:', saveErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error scoring resume:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to score resume';
      const suggestion = err.response?.data?.suggestion || '';
      alert(`Error: ${errorMsg}${suggestion ? '\n\n' + suggestion : '\n\nTip: The system will use basic scoring if AI services are unavailable.'}`);
    } finally {
      setLoading(false);
    }
  };

  const generatePDFAsBase64 = async () => {
    return new Promise(async (resolve, reject) => {
      try {
        // Generate professional CV summary if not already generated
        if (!cvSummary) {
          try {
            await generateCVSummary();
          } catch (err) {
            console.warn('Could not generate CV summary:', err);
          }
        }

        // Create a temporary container for PDF generation
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.width = '210mm'; // A4 width
        tempDiv.style.padding = '20mm';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        tempDiv.style.fontSize = '11pt';
        tempDiv.style.lineHeight = '1.6';
        tempDiv.style.color = '#333';
        tempDiv.style.backgroundColor = '#ffffff';
        tempDiv.innerHTML = generateResumeHTML();
        document.body.appendChild(tempDiv);

        // Wait a bit for styles to apply
        await new Promise(resolve => setTimeout(resolve, 100));

        // Use html2pdf library (loaded from CDN in index.html)
        if (typeof window.html2pdf !== 'undefined') {
          const opt = {
            margin: [10, 10, 10, 10],
            filename: `${user?.username || 'resume'}_${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
              scale: 2, 
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };

          window.html2pdf().set(opt).from(tempDiv).outputPdf('datauristring').then((pdfDataUri) => {
            const base64 = pdfDataUri.split(',')[1];
            document.body.removeChild(tempDiv);
            resolve(base64);
          }).catch((err) => {
            document.body.removeChild(tempDiv);
            reject(err);
          });
        } else if (typeof window.html2canvas !== 'undefined' && typeof window.jspdf !== 'undefined') {
          // Fallback: use html2canvas and jsPDF
          window.html2canvas(tempDiv, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }

            const pdfBlob = pdf.output('blob');
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(',')[1];
              document.body.removeChild(tempDiv);
              resolve(base64);
            };
            reader.onerror = () => {
              document.body.removeChild(tempDiv);
              reject(new Error('Failed to convert PDF to base64'));
            };
            reader.readAsDataURL(pdfBlob);
          }).catch(err => {
            document.body.removeChild(tempDiv);
            reject(err);
          });
        } else {
          document.body.removeChild(tempDiv);
          reject(new Error('PDF generation libraries not loaded. Please refresh the page and ensure you have internet connection.'));
        }
      } catch (err) {
        reject(err);
      }
    });
  };

  const uploadPDFToAWS = async (base64Content, filename) => {
    try {
      const awsApiUrl = import.meta.env.VITE_AWS_API_GATEWAY || "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod";
      const payload = {
        userId: user?.email || user?._id || user?.id || 'unknown',
        filename: filename || `${user?.username || 'resume'}_${Date.now()}.pdf`,
        fileContent: base64Content
      };

      const response = await axios.post(`${awsApiUrl}/uploadResume`, payload, {
        timeout: 60000 // 60 seconds for file upload
      });

      if (response.data && response.data.resumeUrl) {
        return response.data.resumeUrl;
      } else {
        throw new Error('No resume URL returned from AWS');
      }
    } catch (err) {
      console.error('Error uploading PDF to AWS:', err);
      throw new Error(`Failed to upload PDF to AWS: ${err.response?.data?.message || err.message}`);
    }
  };

  const saveResume = async () => {
    // Double check authentication
    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert('Session expired. Please login again.');
      navigate('/', { replace: true });
      return;
    }

    if (!user) {
      alert('Please login to save resume');
      navigate('/', { replace: true });
      return;
    }
    
    // Get student ID - handle both _id, id, or use email as fallback
    const studentId = user._id || user.id || user.email;
    if (!studentId) {
      alert('Unable to identify student. Please login again.');
      navigate('/', { replace: true });
      return;
    }
    
    setLoading(true);
    let pdfUrl = null;
    
    try {
      // Step 1: Generate PDF and convert to base64
      console.log('Step 1: Generating PDF from resume...');
      const base64PDF = await generatePDFAsBase64();
      console.log('PDF generated successfully, size:', base64PDF.length, 'characters');
      
      // Step 2: Upload PDF to AWS
      console.log('Step 2: Uploading PDF to AWS...');
      const filename = `${currentUser?.username || currentUser?.email || 'student'}_resume_${Date.now()}.pdf`;
      pdfUrl = await uploadPDFToAWS(base64PDF, filename);
      console.log('PDF uploaded to AWS, URL:', pdfUrl);
      
      // Step 3: Save resume data with PDF URL
      console.log('Step 3: Saving resume data with PDF URL...');
      const resumeDataWithPDF = {
        education: resumeData.education,
        skills: resumeData.skills,
        projects: resumeData.projects,
        internships: resumeData.internships,
        resumePdfUrl: pdfUrl
      };
      
      const response = await axios.post(`${backendUrl}/api/resume/save/${studentId}`, resumeDataWithPDF, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });
      console.log('Save response:', response.data);
      
      // Step 4: Also update PDF URL separately (for backward compatibility)
      try {
        await axios.post(`${backendUrl}/api/resume/pdf/${studentId}`, { pdfUrl }, {
          timeout: 10000
        });
        console.log('PDF URL updated in database');
      } catch (pdfErr) {
        console.warn('Could not update PDF URL separately:', pdfErr);
        // Continue anyway, PDF URL is already in resume data
      }
      
      alert(`✅ Resume saved successfully!\n\n📄 PDF generated and uploaded to AWS\n🔗 PDF URL: ${pdfUrl ? pdfUrl.substring(0, 50) + '...' : 'Not available'}`);
      
      // Refresh resume score after saving
      fetchResume(studentId);
    } catch (err) {
      console.error('Error saving resume:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        studentId
      });
      
      if (err.message && err.message.includes('PDF generation libraries')) {
        alert(`Error: ${err.message}\n\nPlease refresh the page and try again.`);
      } else if (err.message && err.message.includes('upload PDF to AWS')) {
        // Try to save without PDF URL if AWS upload fails
        console.log('AWS upload failed, attempting to save resume without PDF URL...');
        try {
          const response = await axios.post(`${backendUrl}/api/resume/save/${studentId}`, resumeData, {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 30000
          });
          alert(`⚠️ Resume saved, but PDF upload failed.\n\nResume data saved successfully.\n\nPDF Upload Error: ${err.message}\n\nYou can try uploading the PDF manually later.`);
          fetchResume(studentId);
        } catch (saveErr) {
          alert(`Failed to save resume: ${saveErr.response?.data?.error || saveErr.message}\n\nPDF Upload also failed: ${err.message}`);
        }
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        alert('Session expired. Please login again.');
        clearSession();
        navigate('/', { replace: true });
      } else if (err.response?.status === 404) {
        const errorDetails = err.response?.data?.details || '';
        const suggestion = err.response?.data?.suggestion || '';
        console.error('Student not found error:', {
          studentId,
          currentUser,
          error: err.response?.data
        });
        alert(`Student not found. Please check your login.\n\nStudent ID used: ${studentId}\n\n${errorDetails}${suggestion ? '\n\n' + suggestion : ''}`);
      } else if (err.response?.data?.error) {
        alert(`Failed to save resume: ${err.response.data.error}\n\nDetails: ${err.response.data.details || ''}`);
      } else if (err.code === 'ECONNABORTED') {
        alert('Request timeout. Please check your connection and try again.');
      } else {
        alert(`Failed to save resume. Please try again.\n\nError: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      // Generate professional CV summary if not already generated
      if (!cvSummary) {
        await generateCVSummary();
      }
      
      // Create a printable version of the resume
      const printWindow = window.open('', '_blank');
      const resumeHTML = generateResumeHTML();
      printWindow.document.write(resumeHTML);
      printWindow.document.close();
      printWindow.print();
      
      alert('Resume ready for printing! Use your browser\'s print dialog to save as PDF.');
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateResumeHTML = () => {
    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };

    return `
      <div style="font-family: 'Arial', sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; background: white;">
        <h1 style="color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; margin-bottom: 10px;">
          ${escapeHtml(user?.username || 'Student Name')}
        </h1>
        <p style="margin: 5px 0; color: #555;">${escapeHtml(user?.email || '')}</p>
        ${cvSummary ? `<div style="font-style: italic; color: #555; margin: 20px 0; padding: 10px; background: #f8f9fa; border-left: 4px solid #3498db;"><strong>Summary:</strong> ${escapeHtml(cvSummary)}</div>` : ''}
        
        <h2 style="color: #34495e; margin-top: 30px; border-bottom: 2px solid #ecf0f1; padding-bottom: 5px;">Education</h2>
        ${resumeData.education.length > 0 ? resumeData.education.map(edu => `
          <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa;">
            <strong>${escapeHtml(edu.degree || 'Degree')}</strong> - ${escapeHtml(edu.institution || 'Institution')}
            ${edu.year ? ` (${escapeHtml(edu.year)})` : ''}
            ${edu.cgpa ? ` | CGPA: ${edu.cgpa}` : ''}
          </div>
        `).join('') : '<p style="color: #999;">No education information provided</p>'}
        
        <h2 style="color: #34495e; margin-top: 30px; border-bottom: 2px solid #ecf0f1; padding-bottom: 5px;">Skills</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          ${resumeData.skills.length > 0 ? resumeData.skills.map(skill => `
            <span style="background: #3498db; color: white; padding: 5px 12px; border-radius: 15px; font-size: 0.9em;">${escapeHtml(skill)}</span>
          `).join('') : '<span style="color: #999;">No skills listed</span>'}
        </div>
        
        <h2 style="color: #34495e; margin-top: 30px; border-bottom: 2px solid #ecf0f1; padding-bottom: 5px;">Projects</h2>
        ${resumeData.projects.length > 0 ? resumeData.projects.map(proj => `
          <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #3498db;">
            <strong style="font-size: 1.1em;">${escapeHtml(proj.title || 'Project Title')}</strong>
            ${proj.technologies?.length > 0 ? ` <span style="color: #555;">(${proj.technologies.map(t => escapeHtml(t)).join(', ')})</span>` : ''}
            ${proj.description ? `<p style="margin: 10px 0; line-height: 1.6;">${escapeHtml(proj.description)}</p>` : ''}
            ${proj.duration ? `<small style="color: #777;">Duration: ${escapeHtml(proj.duration)}</small>` : ''}
          </div>
        `).join('') : '<p style="color: #999;">No projects listed</p>'}
        
        <h2 style="color: #34495e; margin-top: 30px; border-bottom: 2px solid #ecf0f1; padding-bottom: 5px;">Internships</h2>
        ${resumeData.internships.length > 0 ? resumeData.internships.map(intern => `
          <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-left: 4px solid #27ae60;">
            <strong style="font-size: 1.1em;">${escapeHtml(intern.role || 'Role')}</strong> at <strong>${escapeHtml(intern.company || 'Company')}</strong>
            ${intern.duration ? ` <span style="color: #555;">(${escapeHtml(intern.duration)})</span>` : ''}
            ${intern.description ? `<p style="margin: 10px 0; line-height: 1.6;">${escapeHtml(intern.description)}</p>` : ''}
          </div>
        `).join('') : '<p style="color: #999;">No internships listed</p>'}
      </div>
    `;
  };

  const generateCVSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${backendUrl}/api/ai/resume/generate-cv-summary`, resumeData);
      if (response.data && response.data.summary) {
        setCvSummary(response.data.summary);
        return response.data.summary;
      }
    } catch (err) {
      console.error('Error generating CV summary:', err);
    } finally {
      setLoading(false);
    }
    return '';
  };

  const enhanceSection = async (section, index, field, currentValue) => {
    const key = `${section}-${index}-${field}`;
    setAiGenerating(prev => ({ ...prev, [key]: true }));
    
    try {
      const response = await axios.post(`${backendUrl}/api/ai/resume/improve`, {
        section: section,
        content: JSON.stringify(resumeData),
        currentText: currentValue || ''
      });
      
      if (response.data && response.data.improvedText) {
        if (section === 'education') {
          handleUpdateEducation(index, field, response.data.improvedText);
        } else if (section === 'projects') {
          handleUpdateProject(index, field, response.data.improvedText);
        } else if (section === 'internships') {
          handleUpdateInternship(index, field, response.data.improvedText);
        }
      }
    } catch (err) {
      console.error('Error enhancing section:', err);
      alert('Failed to enhance. Please try again.');
    } finally {
      setAiGenerating(prev => ({ ...prev, [key]: false }));
    }
  };

  const generateProjectDescription = async (index) => {
    const project = resumeData.projects[index];
    if (!project.title) {
      alert('Please enter a project title first');
      return;
    }
    
    setAiGenerating(prev => ({ ...prev, [`project-${index}`]: true }));
    
    try {
      const response = await axios.post(`${backendUrl}/api/ai/resume/generate-project`, {
        title: project.title,
        technologies: project.technologies || [],
        userDescription: project.description || ''
      });
      
      if (response.data && response.data.description) {
        handleUpdateProject(index, 'description', response.data.description);
      }
    } catch (err) {
      console.error('Error generating project description:', err);
      alert('Failed to generate description. Please try again.');
    } finally {
      setAiGenerating(prev => ({ ...prev, [`project-${index}`]: false }));
    }
  };

  const generateLatexResume = async () => {
    setLoading(true);
    setAiGenerating(prev => ({ ...prev, latex: true }));
    try {
      const response = await axios.post(`${backendUrl}/api/ai/resume/generate-latex`, {
        education: resumeData.education,
        skills: resumeData.skills,
        projects: resumeData.projects,
        internships: resumeData.internships,
        user: {
          username: user?.username || '',
          email: user?.email || ''
        }
      });
      
      if (response.data.latex) {
        setLatexCode(response.data.latex);
        // Create download link
        const blob = new Blob([response.data.latex], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${user?.username || 'resume'}_ats_optimized.tex`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('✅ LaTeX resume generated and downloaded!\n\nCompile it with pdflatex for ATS-optimized PDF.\n\nFor online compilation, use Overleaf.com');
      }
    } catch (err) {
      console.error('Error generating LaTeX resume:', err);
      alert(`Error generating LaTeX resume: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
      setAiGenerating(prev => ({ ...prev, latex: false }));
    }
  };

  const modifyResumeWithPrompt = async () => {
    if (!modifyPrompt.trim()) {
      alert('Please enter a modification prompt');
      return;
    }
    
    setModifying(true);
    try {
      const response = await axios.post(`${backendUrl}/api/ai/resume/modify`, {
        resume_data: resumeData,
        prompt: modifyPrompt
      });
      
      if (response.data.modified_resume) {
        const modified = response.data.modified_resume;
        // Remove internal note if present
        delete modified._modification_note;
        
        setResumeData({
          education: modified.education || resumeData.education,
          skills: modified.skills || resumeData.skills,
          projects: modified.projects || resumeData.projects,
          internships: modified.internships || resumeData.internships
        });
        
        setShowModifyPrompt(false);
        setModifyPrompt('');
        alert('✅ Resume modified successfully based on your prompt!');
      } else {
        alert('Failed to modify resume. Please try a more specific prompt.');
      }
    } catch (err) {
      console.error('Error modifying resume:', err);
      alert(`Error modifying resume: ${err.response?.data?.error || err.message}`);
    } finally {
      setModifying(false);
    }
  };

  const generateInternshipDescription = async (index) => {
    const internship = resumeData.internships[index];
    if (!internship.company || !internship.role) {
      alert('Please enter company name and role first');
      return;
    }
    
    setAiGenerating(prev => ({ ...prev, [`internship-${index}`]: true }));
    
    try {
      const response = await axios.post(`${backendUrl}/api/ai/resume/generate-internship`, {
        company: internship.company,
        role: internship.role,
        userDescription: internship.description || ''
      });
      
      if (response.data && response.data.description) {
        handleUpdateInternship(index, 'description', response.data.description);
      }
    } catch (err) {
      console.error('Error generating internship description:', err);
      alert('Failed to generate description. Please try again.');
    } finally {
      setAiGenerating(prev => ({ ...prev, [`internship-${index}`]: false }));
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Show loading while checking auth or fetching resume data
  if (!user || loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>{!user ? 'Loading user data...' : 'Loading resume data...'}</p>
      </div>
    );
  }

  return (
    <div className="resume-builder-container" style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Resume Builder</h2>
      
      {/* Show message when data is loaded */}
      {dataLoaded && (resumeData.education.length > 0 || resumeData.skills.length > 0 || 
                      resumeData.projects.length > 0 || resumeData.internships.length > 0) && (
        <div style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: '5px',
          color: '#155724'
        }}>
          ✓ Resume data loaded. Your saved information has been auto-filled below.
        </div>
      )}
      
      {/* Progress Steps */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
        {[1, 2, 3, 4].map(step => (
          <div
            key={step}
            style={{
              flex: 1,
              padding: '10px',
              backgroundColor: currentStep >= step ? '#007bff' : '#e9ecef',
              color: currentStep >= step ? 'white' : '#666',
              textAlign: 'center',
              margin: '0 5px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
            onClick={() => setCurrentStep(step)}
          >
            {step === 1 && 'Education'}
            {step === 2 && 'Skills'}
            {step === 3 && 'Projects'}
            {step === 4 && 'Internships'}
          </div>
        ))}
      </div>

      {/* Step 1: Education */}
      {currentStep === 1 && (
        <div className="resume-step">
          <h3>Education</h3>
          {resumeData.education.map((edu, index) => (
            <div key={index} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
              <input
                type="text"
                placeholder="Degree (e.g., B.Tech Computer Science)"
                value={edu.degree}
                onChange={(e) => handleUpdateEducation(index, 'degree', e.target.value)}
                style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
              />
              <input
                type="text"
                placeholder="Institution"
                value={edu.institution}
                onChange={(e) => handleUpdateEducation(index, 'institution', e.target.value)}
                style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Year (e.g., 2024)"
                  value={edu.year}
                  onChange={(e) => handleUpdateEducation(index, 'year', e.target.value)}
                  style={{ flex: 1, padding: '8px' }}
                />
                <input
                  type="number"
                  placeholder="CGPA"
                  value={edu.cgpa}
                  onChange={(e) => handleUpdateEducation(index, 'cgpa', e.target.value)}
                  style={{ flex: 1, padding: '8px' }}
                />
              </div>
            </div>
          ))}
          <button onClick={handleAddEducation} style={{ padding: '10px 20px', marginTop: '10px' }}>
            + Add Education
          </button>
        </div>
      )}

      {/* Step 2: Skills */}
      {currentStep === 2 && (
        <div className="resume-step">
          <h3>Skills</h3>
          <textarea
            placeholder="Enter skills separated by commas (e.g., Python, JavaScript, React, Node.js). Press Enter to add a skill."
            value={skillsInput}
            onChange={handleSkillsChange}
            onBlur={handleSkillsBlur}
            onKeyDown={handleSkillsKeyDown}
            style={{ width: '100%', minHeight: '150px', padding: '10px' }}
          />
          <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
            <strong>Tip:</strong> Type skills separated by commas, or press Enter after each skill. Skills will be processed when you click outside the field.
          </div>
          <div style={{ marginTop: '10px' }}>
            <strong>Current Skills ({resumeData.skills.length}):</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
              {resumeData.skills.length > 0 ? (
                resumeData.skills.map((skill, idx) => (
                  <span 
                    key={idx} 
                    style={{ 
                      backgroundColor: '#007bff', 
                      color: 'white', 
                      padding: '5px 10px', 
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      // Allow removing skills by clicking
                      const newSkills = resumeData.skills.filter((_, i) => i !== idx);
                      setResumeData({ ...resumeData, skills: newSkills });
                      setSkillsInput(newSkills.join(', '));
                    }}
                    title="Click to remove"
                  >
                    {skill} ×
                  </span>
                ))
              ) : (
                <span style={{ color: '#999', fontStyle: 'italic' }}>No skills added yet</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Projects */}
      {currentStep === 3 && (
        <div className="resume-step">
          <h3>Projects</h3>
          {resumeData.projects.map((project, index) => (
            <div key={index} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
              <input
                type="text"
                placeholder="Project Title"
                value={project.title}
                onChange={(e) => handleUpdateProject(index, 'title', e.target.value)}
                style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
              />
              <div style={{ position: 'relative' }}>
                <textarea
                  placeholder="Description (Click 'AI Generate' to auto-generate professional description)"
                  value={project.description}
                  onChange={(e) => handleUpdateProject(index, 'description', e.target.value)}
                  style={{ width: '100%', marginBottom: '10px', padding: '8px', minHeight: '80px' }}
                />
                <button
                  onClick={() => generateProjectDescription(index)}
                  disabled={aiGenerating[`project-${index}`] || !project.title}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    padding: '5px 10px',
                    fontSize: '0.8em',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  title="AI Generate Professional Description"
                >
                  {aiGenerating[`project-${index}`] ? '⏳' : '✨ AI Generate'}
                </button>
              </div>
              <input
                type="text"
                placeholder="Technologies (comma-separated)"
                value={project.technologies?.join(', ') || ''}
                onChange={(e) => handleUpdateProject(index, 'technologies', e.target.value)}
                style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
              />
              <input
                type="text"
                placeholder="Duration (e.g., 3 months)"
                value={project.duration}
                onChange={(e) => handleUpdateProject(index, 'duration', e.target.value)}
                style={{ width: '100%', padding: '8px' }}
              />
            </div>
          ))}
          <button onClick={handleAddProject} style={{ padding: '10px 20px', marginTop: '10px' }}>
            + Add Project
          </button>
        </div>
      )}

      {/* Step 4: Internships */}
      {currentStep === 4 && (
        <div className="resume-step">
          <h3>Internships</h3>
          {resumeData.internships.map((internship, index) => (
            <div key={index} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '5px' }}>
              <input
                type="text"
                placeholder="Company Name"
                value={internship.company}
                onChange={(e) => handleUpdateInternship(index, 'company', e.target.value)}
                style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
              />
              <input
                type="text"
                placeholder="Role/Position"
                value={internship.role}
                onChange={(e) => handleUpdateInternship(index, 'role', e.target.value)}
                style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
              />
              <input
                type="text"
                placeholder="Duration (e.g., June 2023 - Aug 2023)"
                value={internship.duration}
                onChange={(e) => handleUpdateInternship(index, 'duration', e.target.value)}
                style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
              />
              <div style={{ position: 'relative' }}>
                <textarea
                  placeholder="Description of work (Click 'AI Generate' to auto-generate professional description)"
                  value={internship.description}
                  onChange={(e) => handleUpdateInternship(index, 'description', e.target.value)}
                  style={{ width: '100%', padding: '8px', minHeight: '80px' }}
                />
                <button
                  onClick={() => generateInternshipDescription(index)}
                  disabled={aiGenerating[`internship-${index}`] || !internship.company || !internship.role}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    padding: '5px 10px',
                    fontSize: '0.8em',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                  title="AI Generate Professional Description"
                >
                  {aiGenerating[`internship-${index}`] ? '⏳' : '✨ AI Generate'}
                </button>
              </div>
            </div>
          ))}
          <button onClick={handleAddInternship} style={{ padding: '10px 20px', marginTop: '10px' }}>
            + Add Internship
          </button>
        </div>
      )}

      {/* CV Summary Section */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e7f3ff', borderRadius: '5px', border: '1px solid #b3d9ff' }}>
        <h4>📄 Professional CV Summary</h4>
        {cvSummary ? (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '3px' }}>
            <p style={{ margin: 0, fontStyle: 'italic', color: '#555' }}>{cvSummary}</p>
          </div>
        ) : (
          <p style={{ color: '#666', fontSize: '0.9em' }}>Generate a professional summary for your CV</p>
        )}
        <button
          onClick={generateCVSummary}
          disabled={loading}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#17a2b8',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {loading ? '⏳ Generating...' : '✨ Generate CV Summary'}
        </button>
      </div>

      {/* AI Score Display */}
      {resumeScore > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <h4>Resume Score: {resumeScore}/100</h4>
          {suggestions.length > 0 && suggestions[0]?.includes('ATS') && (
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: resumeScore >= 80 ? '#d4edda' : '#fff3cd', 
              borderRadius: '5px',
              border: `2px solid ${resumeScore >= 80 ? '#28a745' : '#ffc107'}`
            }}>
              <strong style={{ color: resumeScore >= 80 ? '#155724' : '#856404' }}>
                {resumeScore >= 80 ? '✅ ATS Target Met!' : '⚠️ ATS Score Below Target'}
              </strong>
              <p style={{ margin: '5px 0', fontSize: '0.9em', color: resumeScore >= 80 ? '#155724' : '#856404' }}>
                {resumeScore >= 80 
                  ? `Your resume has achieved ${resumeScore.toFixed(1)}% ATS compatibility, meeting the industry standard of 80%+.`
                  : `Current ATS Score: ${resumeScore.toFixed(1)}%. Target: 80%+. Follow the recommendations below to improve.`
                }
              </p>
            </div>
          )}
          {strengths.length > 0 && (
            <div>
              <strong>Strengths:</strong>
              <ul>
                {strengths.map((s, idx) => <li key={idx}>{s}</li>)}
              </ul>
            </div>
          )}
          {weaknesses.length > 0 && (
            <div>
              <strong>Areas for Improvement:</strong>
              <ul>
                {weaknesses.map((w, idx) => <li key={idx}>{w}</li>)}
              </ul>
            </div>
          )}
          {suggestions.length > 0 && (
            <div>
              <strong>Suggestions:</strong>
              <ul>
                {suggestions.map((s, idx) => <li key={idx}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
        <button onClick={prevStep} disabled={currentStep === 1} style={{ padding: '10px 20px' }}>
          Previous
        </button>
        <div>
          <button onClick={scoreResume} disabled={loading} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#28a745', color: 'white' }}>
            {loading ? 'Scoring...' : 'AI Score Resume'}
          </button>
          <button onClick={saveResume} disabled={loading} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#007bff', color: 'white' }}>
            Save Resume
          </button>
          <button onClick={generatePDF} disabled={loading} style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#6f42c1', color: 'white' }}>
            📄 Generate PDF/CV
          </button>
          <button 
            onClick={generateLatexResume} 
            disabled={loading || aiGenerating.latex} 
            style={{ padding: '10px 20px', marginRight: '10px', backgroundColor: '#28a745', color: 'white' }}
            title="Generate LaTeX resume for better ATS scoring"
          >
            {aiGenerating.latex ? '⏳ Generating...' : '📝 Generate LaTeX (ATS Optimized)'}
          </button>
          <button 
            onClick={() => setShowModifyPrompt(true)} 
            disabled={loading} 
            style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: 'white' }}
            title="Modify resume using AI prompt"
          >
            ✏️ AI Modify Resume
          </button>
        </div>
        <button onClick={nextStep} disabled={currentStep === 4} style={{ padding: '10px 20px' }}>
          Next
        </button>
      </div>

      {/* Modify Resume Prompt Modal */}
      {showModifyPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0 }}>✏️ AI Modify Resume</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Describe how you want to modify your resume. For example:
              <br />• "Make all project descriptions more technical and add metrics"
              <br />• "Add more action verbs to internship descriptions"
              <br />• "Reorganize skills section by category"
            </p>
            <textarea
              value={modifyPrompt}
              onChange={(e) => setModifyPrompt(e.target.value)}
              placeholder="Enter your modification request..."
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                fontFamily: 'inherit',
                marginBottom: '20px'
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowModifyPrompt(false);
                  setModifyPrompt('');
                }}
                disabled={modifying}
                style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={modifyResumeWithPrompt}
                disabled={modifying || !modifyPrompt.trim()}
                style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px', cursor: modifying ? 'not-allowed' : 'pointer' }}
              >
                {modifying ? '⏳ Modifying...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
