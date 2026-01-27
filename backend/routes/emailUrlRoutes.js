const express = require("express");
const router = express.Router();
const EmailUrl = require("../Models/EmailUrl.js");
const { handleJob } = require("../middleware/handleJob");

// POST: List all email-url mappings
router.post('/emailurls/list', async (req, res) => {
  try {
    handleJob();
    const list = await EmailUrl.find();
    res.status(200).json(list);
  } catch (err) {
    console.error('Error fetching EmailUrl list:', err);
    res.status(500).json({ error: 'Failed to fetch email-url list' });
  }
});

// POST: Get single email-url by email (email provided in body: { email: '<email>' })
router.post('/emailurls/get', async (req, res) => {
  try {
    handleJob();
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email is required in request body' });
    }
    const emailUrl = await EmailUrl.findOne({ email });
    if (!emailUrl) {
      return res.status(404).json({ error: 'EmailUrl not found' });
    }
    res.json(emailUrl);
  } catch (err) {
    console.error('Error fetching EmailUrl:', err);
    res.status(500).json({ error: 'Failed to fetch email-url' });
  }
});

// POST: Create new email-url mapping
router.post('/emailurls', async (req, res) => {
  try {
    handleJob();
    const { email, url } = req.body;
    if (!email || !url) {
      return res.status(400).json({ error: 'email and url are required' });
    }
    const newEmailUrl = new EmailUrl({ email, url });
    await newEmailUrl.save();
    res.status(201).json(newEmailUrl);
  } catch (err) {
    console.error('Error creating EmailUrl:', err);
    if (err.code === 11000) {
      res.status(400).json({ error: 'EmailUrl with this email already exists' });
    } else {
      res.status(400).json({ error: 'Failed to create email-url', details: err.message });
    }
  }
});

// PUT: Replace email-url by id
router.put('/emailurls/:id', async (req, res) => {
  try {
    handleJob();
    const { email, url } = req.body;
    if (!email || !url) {
      return res.status(400).json({ error: 'email and url are required' });
    }
    const emailUrl = await EmailUrl.findByIdAndReplace(req.params.id, { email, url }, { new: true, runValidators: true });
    if (!emailUrl) {
      return res.status(404).json({ error: 'EmailUrl not found' });
    }
    res.json(emailUrl);
  } catch (err) {
    console.error('Error replacing EmailUrl:', err);
    res.status(400).json({ error: 'Failed to replace email-url', details: err.message });
  }
});

module.exports = router;
