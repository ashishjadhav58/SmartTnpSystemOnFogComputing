const express = require("express");
const router = express.Router();
const Drive = require("../Models/drivedetail.js");
const { handleJob } = require("../middleware/handleJob");

// POST: Get all drives
router.post("/drivedataa", async (req, res) => {
  try {
    handleJob();
    const data = await Drive.find();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "500", error: "Internal Server Error" });
  }
});

// PUT: Update drive by id
router.put("/drivedata/:id", async (req, res) => {
  try {
    handleJob();
    const updatedDrive = await Drive.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedDrive) {
      return res.status(404).json({ message: "Drive not found" });
    }
    res.json(updatedDrive);
  } catch (err) {
    console.error("Error updating drive:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// POST: Create new drive
router.post('/drivedata', async (req, res) => {
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
      status
    } = req.body;

    const newDrive = new Drive({
      companyName,
      jobRole,
      salaryPackage,
      driveDate,
      eligibilityCriteria,
      description,
      registrationLink,
      status
    });

    await newDrive.save();
    res.status(201).json({ message: 'Drive added successfully', drive: newDrive });
  } catch (err) {
    console.error("Error in POST /drivedata:", err);
    res.status(400).json({
      error: "Failed to add drive. Check data format.",
      details: err.message
    });
  }
});

module.exports = router;
