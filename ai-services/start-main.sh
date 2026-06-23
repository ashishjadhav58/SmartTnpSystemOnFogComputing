#!/bin/bash
# Bash script to start all AI services using main.py

echo "Starting All AI Services with Unified Launcher..."
echo ""

# Change to script directory
cd "$(dirname "$0")"

# Start main.py
python3 main.py
