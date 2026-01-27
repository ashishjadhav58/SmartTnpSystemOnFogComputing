const express = require("express");
const router = express.Router();
const Recruiter = require("../Models/Recruiter.js");
const Drive = require("../Models/drivedetail.js");
const userdata = require("../Models/userdata.js");
const Resume = require("../Models/Resume.js");
const bcrypt = require("bcrypt");
const { handleJob } = require("../middleware/handleJob");

// POST: Create recruiter (by TPO) - saves locally after cloud signup
router.post("/recruiter/create", async (req, res) => {
  try {
    handleJob();
    const { username, email, password, companyName, contactNumber, createdBy } = req.body;
    
    // Validate password length (minimum 8 characters)
    if (!password || password.length < 8) {
      return res.status(400).json({ 
        error: "Password must be at least 8 characters long" 
      });
    }
    
    const existing = await Recruiter.findOne({ email });
    if (existing) {
      if (companyName || contactNumber) {
        existing.companyName = companyName || existing.companyName;
        existing.contactNumber = contactNumber || existing.contactNumber;
        await existing.save();
        console.log(`[POST /api/recruiter/create] Updated existing recruiter:`, email);
        return res.status(200).json({ message: "Recruiter updated successfully", recruiter: existing });
      }
      return res.status(400).json({ error: "Recruiter with this email already exists in local database" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newRecruiter = new Recruiter({
      username,
      email,
      password: hashedPassword,
      companyName,
      contactNumber,
      createdBy,
      isApproved: true,
      accesstype: "Recruiter"
    });
    
    await newRecruiter.save();
    console.log(`[POST /api/recruiter/create] Recruiter saved locally:`, {
      email: newRecruiter.email,
      username: newRecruiter.username,
      isApproved: newRecruiter.isApproved,
      _id: newRecruiter._id,
      createdBy: newRecruiter.createdBy
    });
    
    const savedRecruiter = await Recruiter.findOne({ email });
    console.log(`[POST /api/recruiter/create] Verified saved recruiter exists:`, savedRecruiter ? 'YES' : 'NO');
    
    res.status(201).json({ message: "Recruiter created successfully in local database", recruiter: newRecruiter });
  } catch (err) {
    console.error("Error creating recruiter locally:", err);
    res.status(500).json({ error: "Failed to create recruiter in local database", details: err.message });
  }
});

// POST: Test endpoint - Check if recruiters exist
router.post("/admin/recruiters/test", async (req, res) => {
  try {
    const count = await Recruiter.countDocuments({});
    const sample = await Recruiter.find({}).limit(3);
    res.json({ 
      total: count, 
      sample: sample.map(r => ({ email: r.email, username: r.username })),
      message: "Test endpoint working"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Get all recruiters (for admin management)
router.post("/admin/recruiters", async (req, res) => {
  try {
    handleJob();
    console.log(`[POST /api/admin/recruiters] Request received`);
    
    const totalCount = await Recruiter.countDocuments({});
    console.log(`[POST /api/admin/recruiters] Total recruiters in DB: ${totalCount}`);
    
    const recruiters = await Recruiter.find({}).sort({ createdAt: -1 });
    const recruitersArray = Array.isArray(recruiters) ? recruiters : [];
    console.log(`[POST /api/admin/recruiters] Found ${recruitersArray.length} recruiters`);
    
    if (recruitersArray.length > 0) {
      console.log(`[POST /api/admin/recruiters] Sample recruiter:`, {
        _id: recruitersArray[0]._id,
        email: recruitersArray[0].email,
        username: recruitersArray[0].username,
        isApproved: recruitersArray[0].isApproved,
        createdBy: recruitersArray[0].createdBy
      });
    } else {
      console.log(`[POST /api/admin/recruiters] WARNING: No recruiters found in database`);
    }
    
    const plainRecruiters = recruitersArray.map(r => r.toObject ? r.toObject() : r);
    console.log(`[POST /api/admin/recruiters] Returning ${plainRecruiters.length} recruiters as JSON`);
    res.status(200).json(plainRecruiters);
  } catch (err) {
    console.error("Error fetching recruiters:", err);
    console.error("Error details:", err.message, err.stack);
    res.status(200).json([]);
  }
});

// POST: Approve recruiter (by Admin) - Not used anymore but kept for compatibility
router.post("/recruiter/approve/:id", async (req, res) => {
  try {
    handleJob();
    const { approvedBy } = req.body;
    const recruiter = await Recruiter.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, approvedBy },
      { new: true }
    );
    
    if (!recruiter) {
      return res.status(404).json({ error: "Recruiter not found" });
    }
    
    res.json({ message: "Recruiter approved", recruiter });
  } catch (err) {
    console.error("Error approving recruiter:", err);
    res.status(500).json({ error: "Failed to approve recruiter", details: err.message });
  }
});

// DELETE: Delete/Reject recruiter (by Admin)
router.delete("/admin/recruiter/:id", async (req, res) => {
  try {
    handleJob();
    const recruiter = await Recruiter.findByIdAndDelete(req.params.id);
    
    if (!recruiter) {
      return res.status(404).json({ error: "Recruiter not found" });
    }
    
    res.json({ message: "Recruiter deleted successfully" });
  } catch (err) {
    console.error("Error deleting recruiter:", err);
    res.status(500).json({ error: "Failed to delete recruiter", details: err.message });
  }
});

// POST: Recruiter login
router.post("/recruiter/login", async (req, res) => {
  try {
    handleJob();
    const { email, password } = req.body;
    
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) {
      return res.status(404).json({ error: "Recruiter not found" });
    }
    
    const isMatch = await bcrypt.compare(password, recruiter.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }
    
    res.json({ message: "Login successful", recruiter });
  } catch (err) {
    console.error("Error in recruiter login:", err);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

// POST: Get all students with AI scores (for recruiter) - filtered by TPO email
router.post("/recruiter/students", async (req, res) => {
  try {
    handleJob();
    const { minScore, maxScore, sortBy, tpoemail, minCGPA, maxCGPA } = req.body;
    
    console.log(`[POST /api/recruiter/students] Request received with filters:`, {
      minScore,
      maxScore,
      sortBy,
      tpoemail,
      minCGPA,
      maxCGPA
    });
    
    // Build query - filter by TPO email if provided
    let query = { accesstype: "Student" };
    
    // Filter by TPO email (recruiter can only see students from their TPO)
    if (tpoemail) {
      query.tpoemail = tpoemail;
      console.log(`[POST /api/recruiter/students] Filtering students by TPO email: ${tpoemail}`);
    } else {
      console.log(`[POST /api/recruiter/students] WARNING: No TPO email provided - returning all students`);
    }
    
    // Score filtering
    if (minScore || maxScore) {
      query.$or = [
        { mostLikelyScore: { $exists: true, $ne: null } },
        { mostLikelyScore: { $exists: false } }
      ];
      
      if (minScore || maxScore) {
        const scoreQuery = {};
        if (minScore) scoreQuery.$gte = parseFloat(minScore);
        if (maxScore) scoreQuery.$lte = parseFloat(maxScore);
        query.mostLikelyScore = { ...query.mostLikelyScore, ...scoreQuery };
      }
    }
    
    let students = await userdata.find(query);
    
    if (!Array.isArray(students)) {
      console.error("[POST /api/recruiter/students] Query result is not an array:", typeof students);
      students = [];
    }
    
    // Enrich students with resume data (skills, scores from Resume table)
    const enrichedStudents = await Promise.all(students.map(async (student) => {
      try {
        // Get student ID (handle multiple formats)
        const studentId = student._id?.toString() || student.id || student.email;
        
        // Fetch resume data from Resume table
        const resume = await Resume.findByStudentId(studentId);
        
        if (resume) {
          // Extract latest CGPA from education array
          let latestCGPA = resume.latestCGPA || 0;
          if (!latestCGPA && resume.education && Array.isArray(resume.education) && resume.education.length > 0) {
            // Find most recent education with CGPA
            const educationWithCGPA = resume.education
              .filter(edu => edu && (edu.cgpa || edu.CGPA))
              .map(edu => ({
                cgpaValue: parseFloat(edu.cgpa || edu.CGPA || 0),
                yearValue: parseInt(edu.year || '0') || 0
              }))
              .sort((a, b) => b.yearValue - a.yearValue);
            
            if (educationWithCGPA.length > 0) {
              latestCGPA = educationWithCGPA[0].cgpaValue;
            } else {
              // Fallback: get any CGPA
              for (const edu of resume.education) {
                if (edu && (edu.cgpa || edu.CGPA)) {
                  latestCGPA = parseFloat(edu.cgpa || edu.CGPA || 0);
                  break;
                }
              }
            }
          }
          
          // Merge resume data with student data
          return {
            ...student.toObject ? student.toObject() : student,
            skills: resume.skills || student.skills || [],
            resumeScore: resume.resumeScore || student.resumeScore || 0,
            placementScore: resume.placementScore || student.mostLikelyScore || 0,
            education: resume.education || [],
            projects: resume.projects || [],
            internships: resume.internships || [],
            latestCGPA: latestCGPA || student.cgpa || 0  // Use latest CGPA from resume or fallback to student.cgpa
          };
        } else {
          // No resume found, use student data only
          return {
            ...student.toObject ? student.toObject() : student,
            skills: student.skills || [],
            resumeScore: student.resumeScore || 0,
            placementScore: student.mostLikelyScore || 0,
            education: [],
            projects: [],
            internships: [],
            latestCGPA: student.cgpa || 0
          };
        }
      } catch (resumeErr) {
        console.error(`[GET /api/recruiter/students] Error fetching resume for student ${student.email}:`, resumeErr);
        // Return student data without resume enrichment
        return {
          ...student.toObject ? student.toObject() : student,
          skills: student.skills || [],
          resumeScore: student.resumeScore || 0,
          placementScore: student.mostLikelyScore || 0,
          education: [],
          projects: [],
          internships: []
        };
      }
    }));
    
    // Additional client-side filtering for scores and CGPA
    let filteredStudents = enrichedStudents;
    if (minScore || maxScore) {
      filteredStudents = filteredStudents.filter(s => {
        const score = s.placementScore || s.mostLikelyScore || 0;
        if (minScore && score < parseFloat(minScore)) return false;
        if (maxScore && score > parseFloat(maxScore)) return false;
        return true;
      });
    }
    
    // Filter by CGPA range
    if (minCGPA || maxCGPA) {
      filteredStudents = filteredStudents.filter(s => {
        const cgpa = s.latestCGPA || s.cgpa || 0;
        if (minCGPA && cgpa < parseFloat(minCGPA)) return false;
        if (maxCGPA && cgpa > parseFloat(maxCGPA)) return false;
        return true;
      });
    }
    
    // Sort by score or CGPA
    if (sortBy === "score") {
      filteredStudents.sort((a, b) => (b.placementScore || b.mostLikelyScore || 0) - (a.placementScore || a.mostLikelyScore || 0));
    } else if (sortBy === "cgpa") {
      filteredStudents.sort((a, b) => (b.latestCGPA || b.cgpa || 0) - (a.latestCGPA || a.cgpa || 0));
    }
    
    console.log(`[POST /api/recruiter/students] Returning ${filteredStudents.length} students${tpoemail ? ` for TPO: ${tpoemail}` : ''}`);
    res.status(200).json(filteredStudents);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(200).json([]);
  }
});

// POST: Create drive (by recruiter, pending approval)
router.post("/recruiter/drive/create", async (req, res) => {
  try {
    handleJob();
    const {
      companyName,
      jobRole,
      salaryPackage,
      driveDate,
      eligibilityCriteria,
      description,
      registrationLink,
      requiredSkills,
      difficultyLevel,
      createdBy
    } = req.body;
    
    const newDrive = new Drive({
      companyName,
      jobRole,
      salaryPackage,
      driveDate,
      eligibilityCriteria,
      description,
      registrationLink,
      requiredSkills: requiredSkills || [],
      difficultyLevel: difficultyLevel || "Medium",
      createdBy,
      status: "Pending Approval",
      isPublic: false
    });
    
    await newDrive.save();
    console.log(`[POST /api/recruiter/drive/create] Drive saved:`, {
      _id: newDrive._id,
      companyName: newDrive.companyName,
      status: newDrive.status,
      createdBy: newDrive.createdBy,
      isPublic: newDrive.isPublic
    });
    
    const savedDrive = await Drive.findOne({ _id: newDrive._id });
    console.log(`[POST /api/recruiter/drive/create] Verified saved drive exists:`, savedDrive ? 'YES' : 'NO');
    if (savedDrive) {
      console.log(`[POST /api/recruiter/drive/create] Drive status:`, savedDrive.status);
    }
    
    res.status(201).json({ message: "Drive created successfully (pending approval)", drive: newDrive });
  } catch (err) {
    console.error("Error creating drive:", err);
    res.status(500).json({ error: "Failed to create drive", details: err.message });
  }
});

// POST: Approve drive (by Admin) - makes it public
router.post("/admin/drive/approve/:id", async (req, res) => {
  try {
    handleJob();
    const { approvedBy } = req.body;
    const drive = await Drive.findByIdAndUpdate(
      req.params.id,
      {
        status: "Upcoming",
        isPublic: true,
        approvedBy
      },
      { new: true }
    );
    
    if (!drive) {
      return res.status(404).json({ error: "Drive not found" });
    }
    
    res.json({ message: "Drive approved and made public", drive });
  } catch (err) {
    console.error("Error approving drive:", err);
    res.status(500).json({ error: "Failed to approve drive", details: err.message });
  }
});

// POST: Test endpoint - Check if drives exist
router.post("/admin/drives/test", async (req, res) => {
  try {
    const total = await Drive.countDocuments({});
    const pending = await Drive.countDocuments({ status: "Pending Approval" });
    const nonPublic = await Drive.countDocuments({ isPublic: false, status: { $ne: "Rejected" } });
    const sample = await Drive.find({}).limit(3);
    res.json({ 
      total, 
      pending,
      nonPublic,
      sample: sample.map(d => ({ 
        company: d.companyName, 
        status: d.status, 
        isPublic: d.isPublic 
      })),
      message: "Test endpoint working"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Get pending drives for approval
router.post("/admin/drives/pending", async (req, res) => {
  try {
    handleJob();
    console.log(`[POST /api/admin/drives/pending] Request received`);
    
    const totalDrives = await Drive.countDocuments({});
    const pendingCount = await Drive.countDocuments({ status: "Pending Approval" });
    const nonPublicCount = await Drive.countDocuments({ isPublic: false, status: { $ne: "Rejected" } });
    console.log(`[POST /api/admin/drives/pending] Total drives in DB: ${totalDrives}`);
    console.log(`[POST /api/admin/drives/pending] Drives with status "Pending Approval": ${pendingCount}`);
    console.log(`[POST /api/admin/drives/pending] Non-public drives (not rejected): ${nonPublicCount}`);
    
    const allPendingDrives = await Drive.find({ 
      status: "Pending Approval"
    }).sort({ createdAt: -1 });
    
    console.log(`[POST /api/admin/drives/pending] Query result: ${allPendingDrives.length} drives with status "Pending Approval"`);
    
    const nonPublicDrives = await Drive.find({ 
      isPublic: false, 
      status: { $nin: ["Rejected", "Upcoming", "Ongoing", "Closed"] }
    }).sort({ createdAt: -1 });
    
    console.log(`[POST /api/admin/drives/pending] Non-public drives (not rejected/upcoming/ongoing/closed): ${nonPublicDrives.length}`);
    
    const allDrivesMap = new Map();
    allPendingDrives.forEach(d => allDrivesMap.set(d._id.toString(), d));
    nonPublicDrives.forEach(d => {
      if (!allDrivesMap.has(d._id.toString())) {
        allDrivesMap.set(d._id.toString(), d);
      }
    });
    
    const drivesArray = Array.from(allDrivesMap.values());
    console.log(`[POST /api/admin/drives/pending] Final combined result: ${drivesArray.length} pending drives`);
    
    if (drivesArray.length > 0) {
      console.log(`[POST /api/admin/drives/pending] All pending drives:`, drivesArray.map(d => ({
        _id: d._id?.toString(),
        company: d.companyName,
        status: d.status,
        isPublic: d.isPublic,
        createdBy: d.createdBy,
        createdAt: d.createdAt
      })));
    } else {
      console.log(`[POST /api/admin/drives/pending] WARNING: No pending drives found`);
      const allDrives = await Drive.find({}).sort({ createdAt: -1 }).limit(10);
      console.log(`[POST /api/admin/drives/pending] Sample of ALL drives in DB (last 10):`, allDrives.map(d => ({
        _id: d._id?.toString(),
        company: d.companyName,
        status: d.status,
        isPublic: d.isPublic,
        createdBy: d.createdBy,
        createdAt: d.createdAt
      })));
    }
    
    const plainDrives = drivesArray.map(d => d.toObject ? d.toObject() : d);
    console.log(`[POST /api/admin/drives/pending] Returning ${plainDrives.length} drives as JSON`);
    res.status(200).json(plainDrives);
  } catch (err) {
    console.error("Error fetching pending drives:", err);
    console.error("Error details:", err.message, err.stack);
    res.status(200).json([]);
  }
});

// POST: Export students to Excel (for recruiter) - filtered by TPO email
router.post("/recruiter/students/export", async (req, res) => {
  try {
    handleJob();
    const { minScore, limit = 100, tpoemail, minCGPA, maxCGPA } = req.query;
    
    console.log(`[POST /api/recruiter/students/export] Request received with filters:`, {
      minScore,
      limit,
      tpoemail,
      minCGPA,
      maxCGPA
    });
    
    let query = { accesstype: "Student" };
    
    // Filter by TPO email (recruiter can only export students from their TPO)
    if (tpoemail) {
      query.tpoemail = tpoemail;
      console.log(`[POST /api/recruiter/students/export] Filtering students by TPO email: ${tpoemail}`);
    } else {
      console.log(`[POST /api/recruiter/students/export] WARNING: No TPO email provided - exporting all students`);
    }
    
    if (minScore) {
      query.mostLikelyScore = { $gte: parseFloat(minScore) };
    }
    
    let students = await userdata.find(query);
    
    // Enrich with resume data (including latest CGPA)
    const enrichedStudents = await Promise.all(students.map(async (student) => {
      try {
        const studentId = student._id?.toString() || student.id || student.email;
        const resume = await Resume.findByStudentId(studentId);
        
        let latestCGPA = student.cgpa || 0;
        if (resume && resume.education && Array.isArray(resume.education) && resume.education.length > 0) {
          const educationWithCGPA = resume.education
            .filter(edu => edu && (edu.cgpa || edu.CGPA))
            .map(edu => ({
              cgpaValue: parseFloat(edu.cgpa || edu.CGPA || 0),
              yearValue: parseInt(edu.year || '0') || 0
            }))
            .sort((a, b) => b.yearValue - a.yearValue);
          
          if (educationWithCGPA.length > 0) {
            latestCGPA = educationWithCGPA[0].cgpaValue;
          }
        }
        
        return {
          ...student.toObject ? student.toObject() : student,
          latestCGPA: latestCGPA || student.cgpa || 0
        };
      } catch (err) {
        return {
          ...student.toObject ? student.toObject() : student,
          latestCGPA: student.cgpa || 0
        };
      }
    }));
    
    // Apply CGPA filters
    let filteredStudents = enrichedStudents;
    if (minCGPA || maxCGPA) {
      filteredStudents = filteredStudents.filter(s => {
        const cgpa = s.latestCGPA || s.cgpa || 0;
        if (minCGPA && cgpa < parseFloat(minCGPA)) return false;
        if (maxCGPA && cgpa > parseFloat(maxCGPA)) return false;
        return true;
      });
    }
    
    // Sort and limit
    filteredStudents.sort((a, b) => (b.mostLikelyScore || 0) - (a.mostLikelyScore || 0));
    filteredStudents = filteredStudents.slice(0, parseInt(limit));
    
    const csvHeader = "Name,Email,CGPA (Latest),Attendance%,Resume Score,Placement Score,Skills\n";
    const csvRows = filteredStudents.map(s => {
      const name = (s.username || 'N/A').replace(/,/g, ';');
      const email = (s.email || 'N/A').replace(/,/g, ';');
      const cgpa = (s.latestCGPA || s.cgpa || 0).toFixed(2);
      const attendance = s.attendancePercent || 0;
      const resumeScore = s.resumeScore || 0;
      const placementScore = s.mostLikelyScore || 0;
      const skills = (s.skills || []).join('; ').replace(/,/g, ';');
      
      return `${name},${email},${cgpa},${attendance},${resumeScore},${placementScore},"${skills}"`;
    }).join('\n');
    
    const csv = csvHeader + csvRows;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=shortlisted_students.csv');
    res.send(csv);
  } catch (err) {
    console.error("Error exporting students:", err);
    res.status(500).json({ error: "Failed to export students", details: err.message });
  }
});

module.exports = router;
