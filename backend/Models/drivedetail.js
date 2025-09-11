const mongoose = require("mongoose");

const driveSchema = new mongoose.Schema({
    companyName: {
        type: String,
        required: true
    },
    jobRole: {
        type: String,
        required: true
    },
    salaryPackage: {
        type: String
    },
    eligibilityCriteria: {
        type: String
    },
    driveDate: {
        type: Date,
        required: true
    },
    description: {
        type: String
    },
    registrationLink: {
        type: String
    },
    status: {
        type: String,
        enum: ["Upcoming", "Ongoing", "Closed"],
        default: "Upcoming"
    },
    isSync: {
        type: Boolean,
        default: false   // Initially false until synced with DynamoDB
    }
}, { timestamps: true });  // Adds createdAt and updatedAt

const Drive = mongoose.model("Drive", driveSchema);

module.exports = Drive;
