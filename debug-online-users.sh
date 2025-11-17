#!/bin/bash
# Debug script to check online users system

echo "=== 🔍 Online Users Debug Script ==="
echo "Current time: $(date)"
echo ""

echo "📊 Checking if backend API is running..."
curl -s http://localhost:3001/api/groups/online-users -H "Authorization: Bearer your_token" || echo "❌ Backend not responding"
echo ""

echo "🌐 WebSocket connection test..."
echo "Open browser console and check for:"
echo "  1. WebSocket connection logs"
echo "  2. User profile loading"
echo "  3. Join message being sent"
echo "  4. Online users updates"
echo ""

echo "🐛 Common issues to check:"
echo "  1. Backend port 3001 is available"
echo "  2. User is properly logged in"
echo "  3. localStorage has valid token and user data"
echo "  4. WebSocket connects to ws://localhost:3001/ws"
echo "  5. Join message includes valid userId"
echo ""

echo "📝 Debugging steps:"
echo "  1. Open localhost:3000/home in browser"
echo "  2. Open browser DevTools (F12)"
echo "  3. Check Console tab for logs"
echo "  4. Check Network tab for WebSocket connection"
echo "  5. Look for logs starting with 🌐, 👤, 📤, 📥"
echo ""

echo "✨ Expected logs:"
echo "  Frontend: '👤 User profile loaded: {id: X, username: Y}'"
echo "  Frontend: '📤 Sent join message with userId: X username: Y'"
echo "  Backend: '📨 Received WebSocket message: {type: join, ...}'"
echo "  Backend: '✅ User X (Y) is now online'"
echo "  Frontend: '📥 Received online users update: [X]'"