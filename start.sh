#!/bin/bash

# MailFail — Start Script
# Startet Web-App (Port 3333) + SMTP-Server (Port 2525)

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 > /dev/null 2>&1

cd "$(dirname "$0")"

# Kill any existing processes on our ports
lsof -ti:3333 | xargs kill -9 2>/dev/null
lsof -ti:2525 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null

echo ""
echo "  MailFail"
echo "  ────────────────────────────"
echo "  Web:   http://localhost:3333"
echo "  SMTP:  localhost:2525"
echo "  ────────────────────────────"
echo ""

# Start SMTP server in background
cd apps/smtp
pnpm dev > /dev/null 2>&1 &
SMTP_PID=$!
cd ../..

# Start web app in background
cd apps/web
PORT=3333 pnpm dev > /dev/null 2>&1 &
WEB_PID=$!
cd ../..

# Wait for web server to be ready
echo "  Starting..."
for i in {1..30}; do
  if curl -s http://localhost:3333 > /dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "  Ready!"
echo ""

# Open in browser
open http://localhost:3333/dashboard

# Handle Ctrl+C — kill both processes
trap "echo ''; echo '  Stopping MailFail...'; kill $SMTP_PID $WEB_PID 2>/dev/null; exit 0" INT TERM

# Keep script running
wait
