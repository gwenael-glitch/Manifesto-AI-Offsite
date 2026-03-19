#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "Starting Hackathon Vote Server..."
echo ""
node vote-server.js &
SERVER_PID=$!
sleep 1.5

# Get local IP
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "localhost")

echo ""
echo "Opening presentation..."
open "http://$IP:3000/index.html"

echo ""
echo "Server running (PID $SERVER_PID). Close this window to stop."
wait $SERVER_PID
