const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    id: {
        type: String,
        default: null,
        index: true  // Index for faster lookups by AWS UUID
    },
    username: String,
    email: {
        type: String,
        index: true  // Index for faster lookups by email
    },
    accesstype: String,
    tpoemail: String,
    classemail: String,
    password: String,
    // AI & Student Profile Fields
    resumeScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    mostLikelyScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    skills: {
        type: [String],
        default: []
    },
    cgpa: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    attendancePercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Resume Builder Fields
    resume: {
        education: [{
            degree: String,
            institution: String,
            year: String,
            cgpa: Number
        }],
        projects: [{
            title: String,
            description: String,
            technologies: [String],
            duration: String
        }],
        internships: [{
            company: String,
            role: String,
            duration: String,
            description: String
        }],
        resumePdfUrl: String,
        lastUpdated: Date
    },
    // Recruiter approval status (for recruiter accounts)
    recruiterApproved: {
        type: Boolean,
        default: false
    },
    createdBy: String, // TPO email who created recruiter
    approvedBy: String // Admin email who approved
}, { timestamps: true });

const userdata = mongoose.model("userdata", userSchema);

module.exports = userdata;
