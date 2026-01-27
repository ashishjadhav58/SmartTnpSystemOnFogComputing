const express = require("express");
const router = express.Router();
const TpoEvent = require("../Models/TpoEvent.js");
const Attendence = require("../Models/Attendence.js");
const { handleJob } = require("../middleware/handleJob");

// POST: Get all TPO events
router.post('/tpoeventss', async (req, res) => {
  try {
    handleJob();
    const events = await TpoEvent.find();
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Create new TPO event
router.post('/tpoevents', async (req, res) => {
  try {
    handleJob();
    const newEvent = new TpoEvent(req.body);
    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT: Update TPO event by id
router.put('/tpoevents/:id', async (req, res) => {
  try {
    handleJob();
    const updatedEvent = await TpoEvent.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE: Delete TPO event by id
router.delete('/tpoevents/:id', async (req, res) => {
  try {
    handleJob();
    await TpoEvent.findByIdAndDelete(req.params.id);
    res.json({ message: "Event deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Mark attendance
router.post("/attendance", async (req, res) => {
  handleJob();
  const { userEmail, eventId, eventName, views, feedback, suggestion, markedAt } = req.body;

  try {
    const attendance1 = new Attendence({
      userEmail,
      eventId,
      eventName,
      views,
      feedback,
      suggestion,
      markedAt
    });

    await attendance1.save();
    res.status(201).json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Error saving attendance:", error);

    if (error.code === 11000) {
      res.status(400).json({ message: "Attendance already marked for this event" });
    } else {
      res.status(500).json({ message: "Failed to mark attendance" });
    }
  }
});

module.exports = router;
