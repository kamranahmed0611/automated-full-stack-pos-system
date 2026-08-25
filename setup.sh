#!/bin/bash
set -e

echo "============================================"
echo "   SuperMart POS - Setup"
echo "============================================"

echo ""
echo "[1/3] Installing backend dependencies..."
cd backend && npm install

echo ""
echo "[2/3] Seeding database..."
node db/seed.js

echo ""
echo "[3/3] Installing frontend dependencies..."
cd ../frontend && npm install

echo ""
echo "============================================"
echo "   SETUP COMPLETE!"
echo "   Run: ./start-dev.sh"
echo "============================================"
