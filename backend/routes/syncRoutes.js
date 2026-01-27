const express = require("express");
const router = express.Router();
const Drive = require("../Models/drivedetail.js");
const TpoEvent = require("../Models/TpoEvent.js");
const Resource = require("../Models/Resouce.js");
const message = require("../Models/message.js");
const Attendence = require("../Models/Attendence.js");
const EmailUrl = require("../Models/EmailUrl.js");
const { handleJob } = require("../middleware/handleJob");
const { FOG_API, AWS_API_GATEWAY } = require("../config/constants");
const axios = require("axios");

// POST: Sync Drive data (fogsynctable1)
router.post('/fogsynctable1', async (req, res) => {
  try {
    handleJob();
    console.log("Broadcast request arrived to drivesycn");
    const {
      id,
      createdAt,
      updatedAt,
      companyName,
      jobRole,
      salaryPackage,
      driveDate,
      eligibilityCriteria,
      description,
      registrationLink,
      status
    } = req.body;

    const newDrive = new Drive({
      updatedAt,
      createdAt,
      id,
      companyName,
      jobRole,
      salaryPackage,
      driveDate,
      eligibilityCriteria,
      description,
      registrationLink,
      status,
      isSync: true
    });
    await newDrive.save();
    console.log("Successfully received and store broadcast data");
    res.status(201).json(newDrive);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST: Sync TPO Event data (fogsynctable2)
router.post('/fogsynctable2', async (req, res) => {
  try {
    handleJob();
    console.log("Broadcast require arrived to Eventsycn");
    const {
      id,
      lecturer,
      lectureName,
      eventDateTime,
      venue,
      createdAt,
      updatedAt
    } = req.body;

    const newEvent = new TpoEvent({
      id,
      lecturer,
      lectureName,
      eventDateTime,
      venue,
      createdAt,
      updatedAt,
      isSync: true
    });
    await newEvent.save();
    console.log("Successfully received and stored broadcast event");
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST: Sync Resource data (fogsynctable3)
router.post('/fogsynctable3', async (req, res) => {
  try {
    handleJob();
    console.log("Broadcast require arrived to Resourcesycn");
    const { id, title, description, link, type, createdAt, updatedAt } = req.body;
    const newResource = new Resource({
      id,
      title,
      description,
      link,
      type,
      createdAt,
      updatedAt,
      isSync: true
    });
    await newResource.save();
    console.log("Successfully received and stored broadcast resource");
    res.status(201).json(newResource);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST: Sync Message data (fogsynctable4)
router.post('/fogsynctable4', async (req, res) => {
  try {
    handleJob();
    console.log("Broadcast require arrived to Messagesycn");
    const { id, sender, receiver, msg, read, createdAt, updatedAt } = req.body;
    const newMessage = new message({
      id,
      sender,
      receiver,
      msg,
      read: read || false,
      createdAt,
      updatedAt,
      isSync: true
    });
    await newMessage.save();
    console.log("Successfully received and stored broadcast message");
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST: Sync Attendance data (fogsynctable5)
router.post('/fogsynctable5', async (req, res) => {
  try {
    handleJob();
    console.log("Broadcast require arrived to Attendancesycn");
    const { id, userEmail, eventId, eventName, views, feedback, suggestion, markedAt } = req.body;
    const newattend = new Attendence({
      id,
      userEmail,
      eventId,
      eventName,
      views,
      feedback,
      suggestion,
      markedAt: markedAt ? new Date(markedAt) : new Date(),
      isSync: true
    });
    console.log("Successfully received and stored broadcast attendance");
    const savedAttend = await newattend.save();
    res.status(201).json(savedAttend);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST: Sync EmailUrl data (fogsynctable6)
router.post('/fogsynctable6', async (req, res) => {
  try {
    handleJob();
    console.log('Broadcast request arrived to EmailUrl sync');
    const { id, email, url, createdAt, updatedAt } = req.body;
    
    const existingEmail = await EmailUrl.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'EmailUrl with this email already exists' });
    }
    
    const newEmail = new EmailUrl({
      id,
      email,
      url,
      createdAt,
      updatedAt,
      isSync: true
    });
    const saved = await newEmail.save();
    console.log('Successfully received and stored EmailUrl broadcast');
    res.status(201).json(saved);
  } catch (err) {
    console.error('Error in /fogsynctable6:', err.message);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
