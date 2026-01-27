const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
    // Link to student - can be MongoDB ObjectId, email, or UUID
    studentId: {
        type: String,
        required: true
        // Index defined below using resumeSchema.index() to avoid duplicate index warning
    },
    // Also store MongoDB ObjectId reference if available
    studentObjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userdata",
        default: null
    },
    // Education details
    education: [{
        degree: {
            type: String,
            default: ""
        },
        institution: {
            type: String,
            default: ""
        },
        year: {
            type: String,
            default: ""
        },
        cgpa: {
            type: Number,
            default: 0
        }
    }],
    // Skills array
    skills: {
        type: [String],
        default: []
    },
    // Projects
    projects: [{
        title: {
            type: String,
            default: ""
        },
        description: {
            type: String,
            default: ""
        },
        technologies: {
            type: [String],
            default: []
        },
        duration: {
            type: String,
            default: ""
        }
    }],
    // Internships
    internships: [{
        company: {
            type: String,
            default: ""
        },
        role: {
            type: String,
            default: ""
        },
        duration: {
            type: String,
            default: ""
        },
        description: {
            type: String,
            default: ""
        }
    }],
    // Resume PDF URL (stored in AWS)
    resumePdfUrl: {
        type: String,
        default: null
    },
    // Resume score (calculated by AI)
    resumeScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // ATS Score
    atsScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Placement score (mostLikelyScore from placement prediction)
    placementScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Latest CGPA (from most recent education entry)
    latestCGPA: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    // Last updated timestamp
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    // Version tracking (for resume history if needed)
    version: {
        type: Number,
        default: 1
    }
}, { 
    timestamps: true  // Adds createdAt and updatedAt automatically
});

// Index for faster queries by studentId
resumeSchema.index({ studentId: 1 });
resumeSchema.index({ studentObjectId: 1 });

// Method to find resume by student ID (handles multiple formats)
resumeSchema.statics.findByStudentId = async function(studentId) {
    // Try MongoDB ObjectId first
    if (studentId && studentId.match(/^[0-9a-fA-F]{24}$/)) {
        const byObjectId = await this.findOne({ studentObjectId: studentId });
        if (byObjectId) return byObjectId;
    }
    
    // Try by studentId field
    const byStudentId = await this.findOne({ studentId: studentId });
    if (byStudentId) return byStudentId;
    
    return null;
};

// Method to extract latest CGPA from education array
function extractLatestCGPA(education) {
    if (!education || !Array.isArray(education) || education.length === 0) {
        return 0;
    }
    
    // Find the most recent education entry with CGPA
    // Sort by year (descending) or use the last entry
    const educationWithCGPA = education
        .filter(edu => edu && (edu.cgpa || edu.CGPA))
        .map(edu => ({
            ...edu,
            cgpaValue: parseFloat(edu.cgpa || edu.CGPA || 0),
            yearValue: parseInt(edu.year || '0') || 0
        }))
        .sort((a, b) => b.yearValue - a.yearValue); // Most recent first
    
    if (educationWithCGPA.length > 0) {
        return educationWithCGPA[0].cgpaValue;
    }
    
    // Fallback: get any CGPA from education array
    for (const edu of education) {
        if (edu && (edu.cgpa || edu.CGPA)) {
            return parseFloat(edu.cgpa || edu.CGPA || 0);
        }
    }
    
    return 0;
}

// Method to create or update resume
resumeSchema.statics.createOrUpdate = async function(studentId, resumeData) {
    // Extract latest CGPA from education array
    if (resumeData.education && Array.isArray(resumeData.education)) {
        resumeData.latestCGPA = extractLatestCGPA(resumeData.education);
    }
    
    // Try to find existing resume
    let resume = await this.findByStudentId(studentId);
    
    if (resume) {
        // Update existing resume
        Object.assign(resume, resumeData);
        
        // Update latest CGPA if education was updated
        if (resumeData.education && Array.isArray(resumeData.education)) {
            resume.latestCGPA = extractLatestCGPA(resumeData.education);
        }
        
        resume.lastUpdated = new Date();
        resume.version = (resume.version || 1) + 1;
        
        // Update studentObjectId if we have a valid ObjectId
        if (studentId && studentId.match(/^[0-9a-fA-F]{24}$/)) {
            resume.studentObjectId = studentId;
        }
        
        await resume.save();
        return resume;
    } else {
        // Create new resume
        const resumeDataWithId = {
            ...resumeData,
            studentId: studentId
        };
        
        // Set studentObjectId if we have a valid ObjectId
        if (studentId && studentId.match(/^[0-9a-fA-F]{24}$/)) {
            resumeDataWithId.studentObjectId = studentId;
        }
        
        resume = new this(resumeDataWithId);
        await resume.save();
        return resume;
    }
};

// Method to extract resume data by student ID (for easy data extraction)
resumeSchema.statics.extractByStudentId = async function(studentId) {
    const resume = await this.findByStudentId(studentId);
    
    if (!resume) {
        return null;
    }
    
    // Return structured data for easy extraction
    return {
        studentId: resume.studentId,
        studentObjectId: resume.studentObjectId,
        education: resume.education || [],
        skills: resume.skills || [],
        projects: resume.projects || [],
        internships: resume.internships || [],
        resumePdfUrl: resume.resumePdfUrl,
        resumeScore: resume.resumeScore || 0,
        atsScore: resume.atsScore || resume.resumeScore || 0,
        latestCGPA: resume.latestCGPA || extractLatestCGPA(resume.education || []),
        lastUpdated: resume.lastUpdated,
        version: resume.version
    };
};

// Method to get all resumes for a specific student (if versioning is needed)
resumeSchema.statics.getAllByStudentId = async function(studentId) {
    const resumes = await this.find({ studentId: studentId })
        .sort({ lastUpdated: -1 });
    
    return resumes;
};

const Resume = mongoose.model("Resume", resumeSchema);

module.exports = Resume;
