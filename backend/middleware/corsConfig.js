const cors = require("cors");

const corsOptions = {
  origin: ['http://localhost:5173', 'https://evolve-traning-and-placement-system.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;
