#!/bin/bash

# MailFail — Start Script
# Startet das lokale CLI Tool (SMTP + Web UI)

cd "$(dirname "$0")"

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 > /dev/null 2>&1

# Check dependencies
if ! command -v pnpm &>/dev/null; then
  echo "  ERROR: pnpm nicht gefunden. Bitte installieren: npm i -g pnpm"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  pnpm install --silent 2>/dev/null
fi

# Rebuild native modules if needed (e.g. after Node version change)
if ! node -e "require('better-sqlite3')" 2>/dev/null; then
  echo "  Rebuilding native modules for Node $(node -v)..."
  cd node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3
  npx --yes prebuild-install 2>/dev/null || npx --yes node-gyp rebuild --release 2>/dev/null
  cd - > /dev/null
fi

# Check if CLI is built
if [ ! -f "apps/cli/dist/cli.js" ]; then
  echo "  Building CLI..."
  cd apps/cli
  bash scripts/build.sh
  cd ../..
fi

# Start CLI tool — passes all arguments through
exec node apps/cli/dist/cli.js --open "$@"
