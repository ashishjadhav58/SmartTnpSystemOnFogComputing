const express = require("express");
const router = express.Router();
const os = require("os");
const osu = require("os-utils");
const { handleJob, getActiveJobs } = require("../middleware/handleJob");

// GET: Server status
router.get("/status", (req, res) => {
  try {
    osu.cpuUsage(function (cpuPercent) {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMemPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

      res.status(200).json({
        cpu: Math.round(cpuPercent * 100),
        memory: usedMemPercent,
        activeJobs: getActiveJobs(),
        status: "up"
      });
    });
  } catch (err) {
    console.error("❌ /status error:", err.message);
    res.status(500).json({ status: "down", error: err.message });
  }
});

// GET: Do task
router.get('/do-task', (req, res) => {
  handleJob();
  res.json({ message: "Task started!" });
});

module.exports = router;
