const express = require("express");
const router = express.Router();
const axios = require("axios");
const { handleJob } = require("../middleware/handleJob");
const { AI_SERVICES } = require("../config/constants");
const { getAiServiceUrl } = require("../utils/getAiServiceUrl");

// POST: Score resume using AI
router.post("/ai/resume/score", async (req, res) => {
  try {
    handleJob();
    
    try {
      const requestData = {
        education: req.body.education || [],
        skills: req.body.skills || [],
        projects: req.body.projects || [],
        internships: req.body.internships || [],
        rawText: req.body.rawText || null
      };
      
      // Get AI service URL from request or use default
      const aiServiceBaseUrl = getAiServiceUrl(req);
      const resumeAiUrl = aiServiceBaseUrl.includes('/api/ai-proxy') 
        ? `${aiServiceBaseUrl}/resume/score`
        : `${aiServiceBaseUrl}/resume/score`;
      
      const response = await axios.post(resumeAiUrl, requestData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'x-ai-service-url': aiServiceBaseUrl // Pass to proxy if needed
        }
      });
      res.json(response.data);
    } catch (aiErr) {
      console.error("AI service error:", aiErr.message);
      console.error("Error details:", aiErr.response?.data || aiErr.message);
      
      if (aiErr.response?.status === 422 || aiErr.code === 'ECONNREFUSED' || aiErr.code === 'ETIMEDOUT' || aiErr.message.includes('connect')) {
        console.log("AI service unavailable, using fallback scoring");
        
        const { education, skills, projects, internships } = req.body;
        let score = 0;
        
        if (education && education.length > 0) {
          score += Math.min(education.length * 5, 25);
        }
        if (skills && skills.length > 0) {
          score += Math.min(skills.length * 3, 30);
        }
        if (projects && projects.length > 0) {
          score += Math.min(projects.length * 5, 25);
        }
        if (internships && internships.length > 0) {
          score += Math.min(internships.length * 10, 20);
        }
        
        score = Math.min(score, 100);
        
        const suggestions = [];
        if (skills && skills.length < 5) {
          suggestions.push("Add more technical skills to improve your resume");
        }
        if (!projects || projects.length === 0) {
          suggestions.push("Include projects to demonstrate practical experience");
        }
        if (!internships || internships.length === 0) {
          suggestions.push("Add internships to show real-world experience");
        }
        
        res.json({
          resumeScore: score,
          suggestions: suggestions.length > 0 ? suggestions : ["Your resume looks good! Keep adding more details."],
          strengths: [],
          weaknesses: [],
          note: "AI service unavailable - using basic scoring. Please start AI services for advanced analysis."
        });
      } else {
        throw aiErr;
      }
    }
  } catch (err) {
    console.error("Error scoring resume:", err.message);
    res.status(500).json({ 
      error: "Failed to score resume", 
      details: err.message,
      suggestion: "Please ensure AI services are running on port 8000 (unified service)"
    });
  }
});

// POST: Improve resume section using AI
router.post("/ai/resume/improve", async (req, res) => {
  try {
    handleJob();
    try {
      // Get AI service URL from request or use default
      const aiServiceBaseUrl = getAiServiceUrl(req);
      const resumeAiUrl = aiServiceBaseUrl.includes('/api/ai-proxy') 
        ? `${aiServiceBaseUrl}/resume/improve`
        : `${aiServiceBaseUrl}/resume/improve`;
      
      const response = await axios.post(resumeAiUrl, req.body, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'x-ai-service-url': aiServiceBaseUrl
        }
      });
      res.json(response.data);
    } catch (aiErr) {
      console.error("AI service error:", aiErr.message);
      const { currentText, section } = req.body;
      res.json({
        improvedText: currentText + " (enhanced)",
        explanation: "AI service unavailable - basic improvement applied"
      });
    }
  } catch (err) {
    console.error("Error improving resume:", err.message);
    res.status(500).json({ error: "Failed to improve resume", details: err.message });
  }
});

// POST: Predict placement probability
router.post("/ai/predict/placement", async (req, res) => {
  try {
    handleJob();
    try {
      // Get AI service URL from request or use default
      const aiServiceBaseUrl = getAiServiceUrl(req);
      const predictUrl = aiServiceBaseUrl.includes('/api/ai-proxy') 
        ? `${aiServiceBaseUrl}/predict/placement`
        : `${aiServiceBaseUrl}/predict/placement`;
      
      const response = await axios.post(predictUrl, req.body, {
        timeout: 60000, // Increased to 60 seconds for ML/DL processing
        headers: {
          'Content-Type': 'application/json',
          'x-ai-service-url': aiServiceBaseUrl
        }
      });
      res.json(response.data);
    } catch (aiErr) {
      console.error("AI service error:", aiErr.message);
      const { resumeScore = 0, cgpa = 0, attendancePercent = 0, hasInternship = false, numProjects = 0, numSkills = 0 } = req.body;
      
      let score = (resumeScore * 0.3) + (cgpa * 10 * 0.25) + (attendancePercent * 0.2);
      if (hasInternship) score += 15;
      score += Math.min(numProjects * 3, 15) + Math.min(numSkills * 2, 10);
      score = Math.min(score, 100);
      
      const category = score >= 75 ? "High" : score >= 50 ? "Medium" : "Low";
      
      res.json({
        mostLikelyScore: Math.round(score * 10) / 10,
        prediction: category,
        confidence: Math.abs(score - 50) * 2,
        factors: {
          resumeScore: { value: resumeScore, impact: "Medium", contribution: resumeScore * 0.3 },
          cgpa: { value: cgpa, impact: "Medium", contribution: cgpa * 2.5 },
          attendance: { value: attendancePercent, impact: "Medium", contribution: attendancePercent * 0.2 }
        },
        note: "AI service unavailable - using fallback prediction"
      });
    }
  } catch (err) {
    console.error("Error predicting placement:", err.message);
    res.status(500).json({ error: "Failed to predict placement", details: err.message });
  }
});

// POST: Match skills between student and drive
router.post("/ai/match/skills", async (req, res) => {
  try {
    handleJob();
    try {
      // Get AI service URL from request or use default
      const aiServiceBaseUrl = getAiServiceUrl(req);
      const matchUrl = aiServiceBaseUrl.includes('/api/ai-proxy') 
        ? `${aiServiceBaseUrl}/match/skills`
        : `${aiServiceBaseUrl}/match/skills`;
      
      const response = await axios.post(matchUrl, req.body, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'x-ai-service-url': aiServiceBaseUrl
        }
      });
      res.json(response.data);
    } catch (aiErr) {
      console.error("AI service error:", aiErr.message);
      const { studentSkills = [], driveRequiredSkills = [] } = req.body;
      
      const studentLower = studentSkills.map(s => s.toLowerCase().trim());
      const driveLower = driveRequiredSkills.map(s => s.toLowerCase().trim());
      
      const matched = driveRequiredSkills.filter((skill, idx) => 
        studentLower.some(s => s.includes(driveLower[idx]) || driveLower[idx].includes(s))
      );
      const missing = driveRequiredSkills.filter((skill, idx) => 
        !studentLower.some(s => s.includes(driveLower[idx]) || driveLower[idx].includes(s))
      );
      
      const matchPercentage = driveRequiredSkills.length > 0 
        ? (matched.length / driveRequiredSkills.length) * 100 
        : 0;
      
      const recommendations = [];
      if (matchPercentage >= 80) {
        recommendations.push("Excellent match! You have most required skills.");
      } else if (matchPercentage >= 60) {
        recommendations.push("Good match. Consider learning the missing skills.");
      } else {
        recommendations.push("Moderate match. Focus on acquiring the missing skills.");
      }
      
      res.json({
        matchPercentage: Math.round(matchPercentage * 10) / 10,
        matchedSkills: matched,
        missingSkills: missing,
        recommendations,
        note: "AI service unavailable - using basic matching"
      });
    }
  } catch (err) {
    console.error("Error matching skills:", err.message);
    res.status(500).json({ error: "Failed to match skills", details: err.message });
  }
});

// POST: Generate project description using LLM
router.post("/ai/resume/generate-project", async (req, res) => {
  try {
    handleJob();
    try {
      const response = await axios.post(`${AI_SERVICES.RESUME_AI}/generate-project`, req.body, {
        timeout: 30000  // LLM calls may take longer
      });
      res.json(response.data);
    } catch (aiErr) {
      console.error("AI service error:", aiErr.message);
      const { title, technologies = [] } = req.body;
      res.json({
        description: `Developed ${title} using ${technologies.join(', ') || 'modern technologies'}. Implemented best practices and achieved measurable results.`
      });
    }
  } catch (err) {
    console.error("Error generating project description:", err.message);
    res.status(500).json({ error: "Failed to generate project description", details: err.message });
  }
});

// POST: Generate internship description using LLM
router.post("/ai/resume/generate-internship", async (req, res) => {
  try {
    handleJob();
    try {
      const response = await axios.post(`${AI_SERVICES.RESUME_AI}/generate-internship`, req.body, {
        timeout: 30000
      });
      res.json(response.data);
    } catch (aiErr) {
      console.error("AI service error:", aiErr.message);
      const { company, role } = req.body;
      res.json({
        description: `Worked as ${role} at ${company}. Gained valuable industry experience and applied technical skills in real-world projects.`
      });
    }
  } catch (err) {
    console.error("Error generating internship description:", err.message);
    res.status(500).json({ error: "Failed to generate internship description", details: err.message });
  }
});

// POST: Generate CV summary using LLM
router.post("/ai/resume/generate-cv-summary", async (req, res) => {
  try {
    handleJob();
    try {
      const response = await axios.post(`${AI_SERVICES.RESUME_AI}/generate-cv-summary`, req.body, {
        timeout: 30000
      });
      res.json(response.data);
    } catch (aiErr) {
      console.error("AI service error:", aiErr.message);
      const { education = [], skills = [], projects = [], internships = [] } = req.body;
      res.json({
        summary: `Motivated student with strong foundation in ${skills.slice(0, 3).join(', ') || 'technology'}. Completed ${projects.length} project(s) and ${internships.length} internship(s). Seeking opportunities to apply technical skills and contribute to innovative projects.`
      });
    }
  } catch (err) {
    console.error("Error generating CV summary:", err.message);
    res.status(500).json({ error: "Failed to generate CV summary", details: err.message });
  }
});

// POST: Generate suggestions for resume section
router.post("/ai/resume/generate-suggestions", async (req, res) => {
  try {
    handleJob();
    try {
      const response = await axios.post(`${AI_SERVICES.RESUME_AI}/generate-suggestions`, req.body, {
        timeout: 30000
      });
      res.json(response.data);
    } catch (aiErr) {
      console.error("AI service error:", aiErr.message);
      res.json({
        suggestions: [
          "Use action verbs to start bullet points",
          "Include quantifiable achievements where possible",
          "Highlight technical skills and tools used",
          "Keep descriptions concise and impactful"
        ]
      });
    }
  } catch (err) {
    console.error("Error generating suggestions:", err.message);
    res.status(500).json({ error: "Failed to generate suggestions", details: err.message });
  }
});

// POST: Generate LaTeX resume for better ATS scoring
router.post("/ai/resume/generate-latex", async (req, res) => {
  try {
    handleJob();
    try {
      const response = await axios.post(`${AI_SERVICES.RESUME_AI}/generate-latex`, req.body, {
        timeout: 45000  // LaTeX generation may take longer
      });
      res.json(response.data);
    } catch (aiErr) {
      console.error("AI service error:", aiErr.message);
      res.status(500).json({ 
        error: "Failed to generate LaTeX resume", 
        details: aiErr.message,
        suggestion: "Please ensure AI services are running and try again."
      });
    }
  } catch (err) {
    console.error("Error generating LaTeX resume:", err.message);
    res.status(500).json({ error: "Failed to generate LaTeX resume", details: err.message });
  }
});

// POST: Modify resume based on user prompt
router.post("/ai/resume/modify", async (req, res) => {
  try {
    handleJob();
    try {
      const response = await axios.post(`${AI_SERVICES.RESUME_AI}/modify`, req.body, {
        timeout: 45000  // LLM modification may take longer
      });
      res.json(response.data);
    } catch (aiErr) {
      console.error("AI service error:", aiErr.message);
      res.status(500).json({ 
        error: "Failed to modify resume", 
        details: aiErr.message,
        suggestion: "Please ensure AI services are running and try again."
      });
    }
  } catch (err) {
    console.error("Error modifying resume:", err.message);
    res.status(500).json({ error: "Failed to modify resume", details: err.message });
  }
});

// POST: AI Chat Assistant - Uses LLaMA (Groq) for code explanation and general assistance
router.post("/ai/chat", async (req, res) => {
  try {
    handleJob();
    const { message, userRole, history } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    try {
      // Call the AI service chat endpoint
      // Get AI service URL from request or use default
      const aiServiceBaseUrl = getAiServiceUrl(req);
      const chatUrl = aiServiceBaseUrl.includes('/api/ai-proxy') 
        ? `${aiServiceBaseUrl}/resume/chat`
        : `${aiServiceBaseUrl}/resume/chat`;
      
      const response = await axios.post(chatUrl, {
        message: message.trim(),
        userRole: userRole || "Student",
        history: history || []
      }, {
        timeout: 30000,  // LLM calls may take longer
        headers: {
          'Content-Type': 'application/json',
          'x-ai-service-url': aiServiceBaseUrl
        }
      });
      
      res.json(response.data);
    } catch (aiErr) {
      console.error("AI chat service error:", aiErr.message);
      console.error("Error details:", aiErr.response?.data || aiErr.message);
      
      // Fallback response
      const lowerMessage = message.toLowerCase();
      let fallbackResponse = "I understand your question. ";
      
      if (lowerMessage.includes('code') || lowerMessage.includes('function') || lowerMessage.includes('explain')) {
        fallbackResponse += "For code explanations, please provide the specific code snippet you'd like me to explain. I can help break down functions, explain logic, and suggest improvements.";
      } else if (lowerMessage.includes('resume') || lowerMessage.includes('cv')) {
        fallbackResponse += "Use the Resume Builder to create and improve your resume. The AI will score your resume and provide suggestions.";
      } else if (lowerMessage.includes('drive') || lowerMessage.includes('placement')) {
        fallbackResponse += "You can view all placement drives in the Placement Drive section. Use the AI Check button to see your match percentage.";
      } else {
        fallbackResponse += "I'm here to help with questions about the Training & Placement system, code explanations, resume building, and more. Please try again or rephrase your question.";
      }
      
      res.json({
        response: fallbackResponse,
        model: "fallback",
        note: "AI service unavailable - using fallback response"
      });
    }
  } catch (err) {
    console.error("Error in AI chat:", err.message);
    res.status(500).json({ 
      error: "Failed to process chat request", 
      details: err.message,
      response: "I encountered an error. Please try again."
    });
  }
});

module.exports = router;
