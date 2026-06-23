#!/bin/bash

echo "========================================"
echo "Installing AI Services Dependencies"
echo "========================================"
echo ""

# Install Resume AI Service dependencies
echo "Installing Resume AI Service dependencies..."
cd resume-ai-service
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Resume AI Service dependencies"
    exit 1
fi
cd ..

# Install Placement Prediction Service dependencies
echo ""
echo "Installing Placement Prediction Service dependencies..."
cd placement-prediction-service
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Placement Prediction Service dependencies"
    exit 1
fi
cd ..

# Install Skill Match Service dependencies
echo ""
echo "Installing Skill Match Service dependencies..."
cd skill-match-service
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install Skill Match Service dependencies"
    exit 1
fi
cd ..

echo ""
echo "========================================"
echo "All dependencies installed successfully!"
echo "========================================"
echo ""
echo "You can now start the services using:"
echo "  ./start-all-services.sh"
echo ""
