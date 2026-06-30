const cors = require("cors");

// CORS configuration - Allow all origins for maximum compatibility
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-ai-service-url', 'ngrok-skip-browser-warning'],
  credentials: false, // Set to false when using origin: '*'
  preflightContinue: false,
  optionsSuccessStatus: 204
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;
