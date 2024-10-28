#!/bin/bash

# Backend setup
echo "Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "env" ]; then
    echo "Creating new virtual environment..."
    python3 -m venv env
else
    echo "Virtual environment already exists"
fi

# Activate virtual environment
source env/bin/activate

# Install/update requirements
echo "Installing/updating dependencies..."
pip install -r requirements.txt

# Check if FastAPI is already running
if ! pgrep -f "python main.py" > /dev/null; then
    echo "Starting FastAPI server..."
    python main.py &
else
    echo "FastAPI server is already running"
fi

# Frontend setup
echo "Setting up frontend..."
cd ../frontend

# Install dependencies if node_modules doesn't exist or package.json was modified
if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
    echo "Installing npm dependencies..."
    npm install
else
    echo "Node modules are up to date"
fi

echo "Building frontend..."
npm run build

# Check if serve is already running
if ! pgrep -f "serve -s build" > /dev/null; then
    echo "Serving frontend..."
    npx serve -s build
else
    echo "Frontend server is already running"
fi
