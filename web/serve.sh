#!/bin/bash
# SwissKnife Web Desktop Server Script

echo "🚀 Starting SwissKnife Web Desktop..."

# Kill any existing servers on port 8000
echo "🔄 Stopping existing servers..."
pkill -f "http-server.*8000" 2>/dev/null || true
pkill -f "serve.*8000" 2>/dev/null || true

# Ensure we have the latest build
echo "🔨 Building application..."
npm run build

# Start the server
echo "🌐 Starting server on http://localhost:8000"
echo "📱 SwissKnife Web Desktop will open automatically..."
echo "🔧 Press Ctrl+C to stop the server"
echo ""

npx http-server dist -p 8000 -c-1 --cors -o -a localhost
