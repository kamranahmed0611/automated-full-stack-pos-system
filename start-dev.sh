#!/bin/bash
echo "Starting SuperMart POS..."
echo "Backend → http://localhost:5000"
echo "Frontend → http://localhost:3000"
echo ""

# Start backend
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a moment then start frontend
sleep 2
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "Both servers running. Press Ctrl+C to stop."
wait $BACKEND_PID $FRONTEND_PID
