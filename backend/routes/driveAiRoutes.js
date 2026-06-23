const express = require("express");
const router = express.Router();
const userdata = require("../Models/userdata.js");
const Drive = require("../Models/drivedetail.js");
const axios = require("axios");
const { handleJob } = require("../middleware/handleJob");
const { AI_SERVICES } = require("../config/constants");
const { getAiServiceUrl } = require("../utils/getAiServiceUrl");

// POST: Check student-drive match using AI
router.post("/drive/ai-check", async (req, res) => {
  try {
    handleJob();
    const { studentId, driveId } = req.body;
    
    // Find student - handle multiple ID formats (MongoDB ObjectId, email, or UUID/id)
    console.log("Looking up student with ID:", studentId);
    let student;
    if (studentId && studentId.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid MongoDB ObjectId format
      console.log("Trying MongoDB ObjectId lookup...");
      student = await userdata.findById(studentId);
      if (student) console.log("Student found by MongoDB _id");
    }
    
    // If not found by _id, try to find by email
    if (!student) {
      console.log("Trying email lookup...");
      student = await userdata.findOne({ email: studentId });
      if (student) console.log("Student found by email");
    }
    
    // If still not found, try to find by id field (for AWS DynamoDB compatibility)
    if (!student) {
      console.log("Trying UUID/id field lookup...");
      student = await userdata.findOne({ id: studentId });
      if (student) console.log("Student found by id field");
    }
    
    // Find drive - handle multiple ID formats
    console.log("Looking up drive with ID:", driveId);
    let drive;
    if (driveId && driveId.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid MongoDB ObjectId format
      console.log("Trying MongoDB ObjectId lookup for drive...");
      drive = await Drive.findById(driveId);
      if (drive) console.log("Drive found by MongoDB _id");
    }
    
    // If not found by _id, try to find by other fields if needed
    if (!drive) {
      console.log("Trying alternative drive lookup...");
      // Try as MongoDB ObjectId even if format doesn't match
      try {
        drive = await Drive.findById(driveId);
      } catch (e) {
        // If that fails, try findOne
        drive = await Drive.findOne({ _id: driveId });
      }
      if (drive) console.log("Drive found by alternative method");
    }
    
    if (!student) {
      console.error("Student not found with any lookup method. ID used:", studentId);
      // Try to see what students exist (for debugging)
      const sampleStudents = await userdata.find().limit(3).select('_id email id username');
      console.log("Sample students in DB:", sampleStudents);
      return res.status(404).json({ 
        error: "Student not found",
        details: `Could not find student with identifier: ${studentId}`,
        studentId: studentId,
        suggestion: "Please ensure you are logged in and your account exists in the database"
      });
    }
    
    if (!drive) {
      console.error("Drive not found with any lookup method. ID used:", driveId);
      return res.status(404).json({ 
        error: "Drive not found",
        details: `Could not find drive with identifier: ${driveId}`,
        driveId: driveId,
        suggestion: "Please ensure the drive exists and is accessible"
      });
    }
    
    console.log("Student and drive found successfully. Proceeding with AI check...");
    
    const resumeText = JSON.stringify(student.resume || {});
    
    let matchResponse;
    try {
      // Get AI service URL from request or use default
      const aiServiceBaseUrl = getAiServiceUrl(req);
      const skillMatchUrl = `${aiServiceBaseUrl}/match/skills`;
      console.log("Calling skill match service:", skillMatchUrl);
      matchResponse = await axios.post(skillMatchUrl, {
        studentSkills: student.skills || [],
        driveRequiredSkills: drive.requiredSkills || [],
        driveDescription: drive.description || "",
        studentResume: resumeText
      }, { 
        timeout: 60000, // Increased to 60 seconds for ML/DL processing
        headers: {
          'Content-Type': 'application/json',
          'x-ai-service-url': aiServiceBaseUrl
        }
      });
      console.log("Skill match response:", matchResponse.data);
    } catch (matchErr) {
      console.error("Skill match service error:", matchErr.message);
      console.error("Error details:", {
        url: skillMatchUrl,
        status: matchErr.response?.status,
        data: matchErr.response?.data
      });
      const studentLower = (student.skills || []).map(s => s.toLowerCase().trim());
      const driveLower = (drive.requiredSkills || []).map(s => s.toLowerCase().trim());
      const matched = (drive.requiredSkills || []).filter((skill, idx) => 
        studentLower.some(s => s.includes(driveLower[idx]) || driveLower[idx].includes(s))
      );
      const missing = (drive.requiredSkills || []).filter((skill, idx) => 
        !studentLower.some(s => s.includes(driveLower[idx]) || driveLower[idx].includes(s))
      );
      const matchPercentage = (drive.requiredSkills || []).length > 0 
        ? (matched.length / (drive.requiredSkills || []).length) * 100 
        : 0;
      
      matchResponse = {
        data: {
          matchPercentage: Math.round(matchPercentage * 10) / 10,
          missingSkills: missing,
          matchedSkills: matched,
          recommendations: [`Match: ${Math.round(matchPercentage)}%`, missing.length > 0 ? `Missing: ${missing.slice(0, 3).join(', ')}` : ''].filter(Boolean)
        }
      };
    }
    
    let predictionResponse;
    try {
      // Use same AI service base URL
      const aiServiceBaseUrl = getAiServiceUrl(req);
      const predictionUrl = `${aiServiceBaseUrl}/predict/placement`;
      console.log("Calling placement prediction service:", predictionUrl);
      predictionResponse = await axios.post(predictionUrl, {
        resumeScore: student.resumeScore || 0,
        cgpa: student.cgpa || 0,
        attendancePercent: student.attendancePercent || 0,
        hasInternship: (student.resume?.internships || []).length > 0,
        numProjects: (student.resume?.projects || []).length,
        numSkills: (student.skills || []).length,
        skills: student.skills || []
      }, { 
        timeout: 60000, // Increased to 60 seconds for ML/DL processing
        headers: {
          'Content-Type': 'application/json',
          'x-ai-service-url': aiServiceBaseUrl
        }
      });
      console.log("Placement prediction response:", predictionResponse.data);
    } catch (predErr) {
      console.error("Placement prediction service error:", predErr.message);
      console.error("Error details:", {
        url: predictionUrl,
        status: predErr.response?.status,
        data: predErr.response?.data
      });
      const score = ((student.resumeScore || 0) * 0.3) + ((student.cgpa || 0) * 10 * 0.25) + ((student.attendancePercent || 0) * 0.2);
      const category = score >= 75 ? "High" : score >= 50 ? "Medium" : "Low";
      predictionResponse = {
        data: {
          mostLikelyScore: Math.round(score * 10) / 10,
          prediction: category
        }
      };
    }
    
    res.json({
      matchPercentage: matchResponse.data.matchPercentage || 0,
      missingSkills: matchResponse.data.missingSkills || [],
      placementProbability: predictionResponse.data.mostLikelyScore || 0,
      prediction: predictionResponse.data.prediction || "Medium",
      recommendations: matchResponse.data.recommendations || []
    });
  } catch (err) {
    console.error("Error in AI check:", err);
    console.error("Full error:", {
      message: err.message,
      stack: err.stack,
      response: err.response?.data
    });
    
    // Provide more helpful error message
    let errorMessage = "Failed to perform AI check";
    if (err.response?.status === 503) {
      errorMessage = "AI services are not available. Please ensure the unified AI service is running on port 8000.";
    } else if (err.response?.status === 504) {
      errorMessage = "AI services timed out. They may be overloaded or still starting.";
    } else if (err.code === "ECONNREFUSED") {
      errorMessage = "Cannot connect to AI services. Please start the unified AI service (python ai-services/main.py).";
    }
    
    res.status(err.response?.status || 500).json({ 
      error: errorMessage, 
      details: err.message,
      suggestion: "Start the AI services by running: cd ai-services && python main.py"
    });
  }
});

module.exports = router;
