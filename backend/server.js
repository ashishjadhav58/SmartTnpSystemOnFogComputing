const express = require("express");
const path = require("path");
const connectDB = require("./config/database");
const corsMiddleware = require("./middleware/corsConfig");
const { PORT } = require("./config/constants");
const startCronSync = require("./utils/cronSync");

// Import all route files
const statusRoutes = require("./routes/statusRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");
const driveRoutes = require("./routes/driveRoutes");
const resourceRoutes = require("./routes/resourceRoutes");
const tpoRoutes = require("./routes/tpoRoutes");
const emailUrlRoutes = require("./routes/emailUrlRoutes");
const aiRoutes = require("./routes/aiRoutes"); // AI services routes (resume scoring, placement prediction, skill matching)
const aiProxyRoutes = require("./routes/aiProxyRoutes"); // Unified AI proxy (all POST requests)
const recruiterRoutes = require("./routes/recruiterRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const driveAiRoutes = require("./routes/driveAiRoutes"); // Drive AI check with ML/DL placement prediction service
const syncRoutes = require("./routes/syncRoutes");

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(corsMiddleware);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/", statusRoutes);
app.use("/api", userRoutes);

// AWS Lambda calls /NewUser directly (without /api prefix) - add route for compatibility
// Reuse the exported handler from userRoutes
console.log("🔍 Checking userRoutes exports:", {
  hasRouter: !!userRoutes,
  hasHandleNewUser: !!userRoutes.handleNewUser,
  routerType: typeof userRoutes,
  exports: Object.keys(userRoutes)
});

// Register /NewUser route (AWS Lambda calls this directly without /api prefix)
// Try multiple methods to get the handler
let newUserHandler = null;

if (userRoutes.handleNewUser) {
  newUserHandler = userRoutes.handleNewUser;
  console.log("✅ Found handleNewUser export");
} else {
  console.warn("⚠️ handleNewUser not found in exports, trying router stack...");
  // Fallback: Try to extract handler from router stack
  try {
    const newUserRoute = userRoutes.stack?.find(layer => 
      layer.route && layer.route.path === '/NewUser' && layer.route.methods.post
    );
    if (newUserRoute) {
      newUserHandler = newUserRoute.route.stack[0].handle;
      console.log("✅ Found /NewUser handler in router stack");
    } else {
      console.error("❌ Could not find /NewUser route in router stack");
    }
  } catch (err) {
    console.error("❌ Error searching router stack:", err);
  }
}

if (newUserHandler) {
  app.post("/NewUser", (req, res, next) => {
    console.log("📥 [DIRECT /NewUser] Request received:", {
      method: req.method,
      path: req.path,
      url: req.url,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      contentType: req.headers['content-type'],
      bodyPreview: req.body ? JSON.stringify(req.body).substring(0, 200) : 'no body'
    });
    return newUserHandler(req, res, next);
  });
  console.log("✅ Registered /NewUser route (for AWS Lambda compatibility)");
} else {
  console.error("❌ CRITICAL: Could not register /NewUser route - handler not found!");
  // Add a basic handler that logs the error
  app.post("/NewUser", (req, res) => {
    console.error("❌ /NewUser called but handler not available!");
    console.error("Request body:", req.body);
    res.status(500).json({ 
      error: "NewUser handler not properly registered",
      message: "Please check server logs"
    });
  });
}

app.use("/api", messageRoutes);
app.use("/api", driveRoutes);
app.use("/api", resourceRoutes);
app.use("/api", tpoRoutes);
app.use("/api", emailUrlRoutes);
app.use("/api", aiRoutes); // AI services: /api/ai/resume/*, /api/ai/predict/placement, /api/ai/match/skills
app.use("/api", aiProxyRoutes); // Unified AI proxy: /api/ai-proxy/* (all POST requests, uses stored AI service URL)
app.use("/api", recruiterRoutes);
app.use("/api", resumeRoutes);
app.use("/api", driveAiRoutes); // Drive AI check: /api/drive/ai-check (uses ML/DL placement prediction service)
app.use("/", syncRoutes);

// Start cron sync job
startCronSync();

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`AI Services (Unified on port 8000):`);
  console.log(`  - Base URL: http://localhost:8000`);
  console.log(`  - Resume AI: http://localhost:8000/resume/*`);
  console.log(`  - Placement Prediction: http://localhost:8000/predict/*`);
  console.log(`  - Skill Match: http://localhost:8000/match/*`);
  console.log(`API Endpoints:`);
  console.log(`  - Drive AI Check: POST /api/drive/ai-check`);
  console.log(`  - Placement Prediction: POST /api/ai/predict/placement`);
  console.log(`  - Unified AI Proxy: POST /api/ai-proxy/* (uses stored AI service URL from signin)`);
});
