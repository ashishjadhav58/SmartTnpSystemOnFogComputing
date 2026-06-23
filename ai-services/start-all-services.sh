#!/bin/bash

# Start all AI services
echo "Starting AI Microservices..."

# Start Resume AI Service
echo "Starting Resume AI Service on port 8001..."
cd resume-ai-service
python main.py &
RESUME_PID=$!
cd ..

# Start Placement Prediction Service
echo "Starting Placement Prediction Service on port 8002..."
cd placement-prediction-service
python main.py &
PLACEMENT_PID=$!
cd ..

# Start Skill Match Service
echo "Starting Skill Match Service on port 8003..."
cd skill-match-service
python main.py &
SKILL_PID=$!
cd ..

echo "All services started!"
echo "Resume AI: PID $RESUME_PID"
echo "Placement Prediction: PID $PLACEMENT_PID"
echo "Skill Match: PID $SKILL_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "kill $RESUME_PID $PLACEMENT_PID $SKILL_PID; exit" INT
wait
