const express = require("express");
const router = express.Router();
const userdata = require("../Models/userdata.js");
const Resume = require("../Models/Resume.js");
const axios = require("axios");
const { handleJob } = require("../middleware/handleJob");
const { AI_SERVICES } = require("../config/constants");
const { getAiServiceUrl } = require("../utils/getAiServiceUrl");

// POST: Save/Update student resume
router.post("/resume/save/:studentId", async (req, res) => {
  try {
    handleJob();
    const { education, projects, internships, skills, ...resumeData } = req.body;
    
    // Find student to verify they exist
    let student;
    if (req.params.studentId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await userdata.findById(req.params.studentId);
    }
    if (!student) {
      student = await userdata.findOne({ email: req.params.studentId });
    }
    if (!student) {
      student = await userdata.findOne({ id: req.params.studentId });
    }
    
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    // Prepare resume data
    const resumeEducation = education || resumeData.education || [];
    const resumeProjects = projects || resumeData.projects || [];
    const resumeInternships = internships || resumeData.internships || [];
    const resumeSkills = skills || resumeData.skills || [];
    const resumePdfUrl = resumeData.resumePdfUrl || req.body.resumePdfUrl || null;
    
    // Get student ID (use _id if available, otherwise use the provided ID)
    const studentId = student._id?.toString() || req.params.studentId;
    
    // Calculate resume score using AI service
    let resumeScore = 0;
    let atsScore = 0;
    try {
      // Get AI service URL from request or use default
      const aiServiceBaseUrl = getAiServiceUrl(req);
      const resumeScoreUrl = `${aiServiceBaseUrl}/resume/score`;
      
      const aiResponse = await axios.post(resumeScoreUrl, {
        education: resumeEducation,
        skills: resumeSkills,
        projects: resumeProjects,
        internships: resumeInternships
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'x-ai-service-url': aiServiceBaseUrl
        }
      });
      
      if (aiResponse.data) {
        resumeScore = aiResponse.data.resumeScore || 0;
        atsScore = aiResponse.data.atsScore || resumeScore;
      }
    } catch (aiErr) {
      console.error("AI scoring failed, using fallback scoring:", aiErr.message);
      
      // Fallback scoring
      if (resumeEducation && resumeEducation.length > 0) resumeScore += Math.min(resumeEducation.length * 5, 25);
      if (resumeSkills && resumeSkills.length > 0) resumeScore += Math.min(resumeSkills.length * 3, 30);
      if (resumeProjects && resumeProjects.length > 0) resumeScore += Math.min(resumeProjects.length * 5, 25);
      if (resumeInternships && resumeInternships.length > 0) resumeScore += Math.min(resumeInternships.length * 10, 20);
      
      resumeScore = Math.min(resumeScore, 100);
      atsScore = resumeScore;
    }
    
    // Get placement score from student record if available
    const placementScore = student.mostLikelyScore || student.placementScore || 0;
    
    // Extract latest CGPA from education array
    let latestCGPA = 0;
    if (resumeEducation && Array.isArray(resumeEducation) && resumeEducation.length > 0) {
      // Find most recent education with CGPA
      const educationWithCGPA = resumeEducation
        .filter(edu => edu && (edu.cgpa || edu.CGPA))
        .map(edu => ({
          cgpaValue: parseFloat(edu.cgpa || edu.CGPA || 0),
          yearValue: parseInt(edu.year || '0') || 0
        }))
        .sort((a, b) => b.yearValue - a.yearValue); // Most recent first
      
      if (educationWithCGPA.length > 0) {
        latestCGPA = educationWithCGPA[0].cgpaValue;
      } else {
        // Fallback: get any CGPA
        for (const edu of resumeEducation) {
          if (edu && (edu.cgpa || edu.CGPA)) {
            latestCGPA = parseFloat(edu.cgpa || edu.CGPA || 0);
            break;
          }
        }
      }
    }
    
    // Create or update resume in Resume collection
    const resumeDataToSave = {
      education: resumeEducation,
      projects: resumeProjects,
      internships: resumeInternships,
      skills: resumeSkills,
      resumePdfUrl: resumePdfUrl,
      resumeScore: resumeScore,
      atsScore: atsScore,
      placementScore: placementScore, // Store placement score from student record
      latestCGPA: latestCGPA, // Store latest CGPA from education
      lastUpdated: new Date()
    };
    
    const resume = await Resume.createOrUpdate(studentId, resumeDataToSave);
    
    // Also update student record for backward compatibility
    if (resumeSkills && resumeSkills.length > 0) {
      student.skills = resumeSkills;
    }
    student.resumeScore = resumeScore;
    await student.save();
    
    res.json({ 
      message: "Resume saved successfully", 
      resume: resume,
      student: {
        _id: student._id,
        email: student.email,
        resumeScore: student.resumeScore,
        skills: student.skills
      }
    });
  } catch (err) {
    console.error("Error saving resume:", err);
    res.status(500).json({ error: "Failed to save resume", details: err.message });
  }
});

// GET: Get student resume
router.get("/resume/:studentId", async (req, res) => {
  try {
    handleJob();
    
    // Find student to verify they exist and get their ID
    let student;
    if (req.params.studentId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await userdata.findById(req.params.studentId);
    }
    if (!student) {
      student = await userdata.findOne({ email: req.params.studentId });
    }
    if (!student) {
      student = await userdata.findOne({ id: req.params.studentId });
    }
    
    if (!student) {
      console.error("Student not found (GET) with ID:", req.params.studentId);
      return res.status(404).json({ 
        error: "Student not found",
        details: `Could not find student with identifier: ${req.params.studentId}`
      });
    }
    
    // Get student ID (use _id if available, otherwise use the provided ID)
    const studentId = student._id?.toString() || req.params.studentId;
    
    // Try to find resume in Resume collection
    let resume = await Resume.findByStudentId(studentId);
    
    if (resume) {
      // Return resume from Resume collection
      res.json({
        resume: {
          education: resume.education || [],
          projects: resume.projects || [],
          internships: resume.internships || [],
          resumePdfUrl: resume.resumePdfUrl || null,
          lastUpdated: resume.lastUpdated
        },
        skills: resume.skills || [],
        resumeScore: resume.resumeScore || 0,
        atsScore: resume.atsScore || resume.resumeScore || 0,
        placementScore: resume.placementScore || student.mostLikelyScore || 0
      });
    } else {
      // Fallback to student.resume for backward compatibility
      res.json({
        resume: student.resume || {},
        skills: student.skills || [],
        resumeScore: student.resumeScore || 0,
        atsScore: student.resumeScore || 0
      });
    }
  } catch (err) {
    console.error("Error fetching resume:", err);
    res.status(500).json({ error: "Failed to fetch resume", details: err.message });
  }
});

// POST: Update resume PDF URL
router.post("/resume/pdf/:studentId", async (req, res) => {
  try {
    handleJob();
    const { pdfUrl } = req.body;
    
    // Find student to verify they exist
    let student;
    if (req.params.studentId.match(/^[0-9a-fA-F]{24}$/)) {
      student = await userdata.findById(req.params.studentId);
    }
    if (!student) {
      student = await userdata.findOne({ email: req.params.studentId });
    }
    if (!student) {
      student = await userdata.findOne({ id: req.params.studentId });
    }
    
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    
    // Get student ID
    const studentId = student._id?.toString() || req.params.studentId;
    
    // Update resume in Resume collection
    let resume = await Resume.findByStudentId(studentId);
    
    if (resume) {
      resume.resumePdfUrl = pdfUrl;
      resume.lastUpdated = new Date();
      await resume.save();
    } else {
      // Create new resume entry if it doesn't exist
      resume = await Resume.createOrUpdate(studentId, {
        resumePdfUrl: pdfUrl
      });
    }
    
    // Also update student record for backward compatibility
    if (!student.resume) {
      student.resume = {};
    }
    student.resume.resumePdfUrl = pdfUrl;
    await student.save();
    
    res.json({ 
      message: "Resume PDF URL updated", 
      resume: resume,
      student: {
        _id: student._id,
        email: student.email
      }
    });
  } catch (err) {
    console.error("Error updating PDF URL:", err);
    res.status(500).json({ error: "Failed to update PDF URL", details: err.message });
  }
});

// GET: Get all resumes (for admin/TPO to view all student resumes)
router.get("/resumes/all", async (req, res) => {
  try {
    handleJob();
    const resumes = await Resume.find()
      .sort({ lastUpdated: -1 })
      .select('studentId studentObjectId education skills projects internships resumeScore atsScore resumePdfUrl lastUpdated createdAt updatedAt');
    
    res.json({
      count: resumes.length,
      resumes: resumes
    });
  } catch (err) {
    console.error("Error fetching all resumes:", err);
    res.status(500).json({ error: "Failed to fetch resumes", details: err.message });
  }
});

// GET: Get resume by student ID (alternative endpoint)
router.get("/resume/by-student/:studentId", async (req, res) => {
  try {
    handleJob();
    const resume = await Resume.findByStudentId(req.params.studentId);
    
    if (!resume) {
      return res.status(404).json({ 
        error: "Resume not found",
        details: `No resume found for student: ${req.params.studentId}`
      });
    }
    
    res.json({
      resume: {
        education: resume.education || [],
        projects: resume.projects || [],
        internships: resume.internships || [],
        resumePdfUrl: resume.resumePdfUrl || null,
        lastUpdated: resume.lastUpdated
      },
      skills: resume.skills || [],
      resumeScore: resume.resumeScore || 0,
      atsScore: resume.atsScore || resume.resumeScore || 0,
      studentId: resume.studentId,
      version: resume.version
    });
  } catch (err) {
    console.error("Error fetching resume by student ID:", err);
    res.status(500).json({ error: "Failed to fetch resume", details: err.message });
  }
});

// GET: Extract resume data by student ID (structured format for easy extraction)
router.get("/resume/extract/:studentId", async (req, res) => {
  try {
    handleJob();
    const resumeData = await Resume.extractByStudentId(req.params.studentId);
    
    if (!resumeData) {
      return res.status(404).json({ 
        error: "Resume not found",
        details: `No resume data found for student: ${req.params.studentId}`
      });
    }
    
    res.json({
      success: true,
      data: resumeData
    });
  } catch (err) {
    console.error("Error extracting resume data:", err);
    res.status(500).json({ error: "Failed to extract resume data", details: err.message });
  }
});

module.exports = router;
