const express = require("express");
const router = express.Router();
const Resource = require("../Models/Resouce.js");
const { handleJob } = require("../middleware/handleJob");

// POST: Get all resources
router.post('/resoucess', async (req, res) => {
  console.log("ali req");
  try {
    handleJob();
    const resources = await Resource.find();
    console.log(resources);
    res.json(resources);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST: Create new resource
router.post('/resouces', async (req, res) => {
  try {
    handleJob();
    const newRes = new Resource(req.body);
    const saved = await newRes.save();
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: "Invalid input", details: err.message });
  }
});

// PUT: Update resource by id
router.put('/resouces/:id', async (req, res) => {
  try {
    handleJob();
    const updated = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Update failed", details: err.message });
  }
});

module.exports = router;
