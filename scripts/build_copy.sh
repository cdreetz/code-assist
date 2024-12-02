#!/bin/bash

# Navigate to root directory (assuming script is in scripts/ folder)
cd ..

# Go to frontend and run build
cd frontend
npm run build

# Create backend/build directory if it doesn't exist
mkdir -p ../backend/build

# Copy frontend build files to backend/build
cp -r build/* ../backend/build/

echo "Frontend build files copied to backend/build successfully"
