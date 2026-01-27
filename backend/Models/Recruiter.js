const mongoose = require("mongoose");

const recruiterSchema = new mongoose.Schema({
    username: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: String,
    companyName: String,
    contactNumber: String,
    createdBy: {
        type: String, // TPO email
        required: true
    },
    approvedBy: {
        type: String, // Admin email
        default: null
    },
    isApproved: {
        type: Boolean,
        default: true // Auto-approved, no admin approval needed
    },
    accesstype: {
        type: String,
        default: "Recruiter"
    }
}, { timestamps: true });

const Recruiter = mongoose.model("Recruiter", recruiterSchema);

module.exports = Recruiter;
