#!/bin/bash

# MailFail — Start Script
# Startet das lokale CLI Tool (SMTP + Web UI)

cd "$(dirname "$0")"

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 22 > /dev/null 2>&1

# Check if CLI is built
if [ ! -f "apps/cli/dist/cli.js" ]; then
  echo "  Building CLI..."

  if ! command -v pnpm &>/dev/null; then
    echo "  ERROR: pnpm nicht gefunden. Bitte installieren: npm i -g pnpm"
    exit 1
  fi

  if [ ! -d "node_modules" ]; then
    pnpm install --silent 2>/dev/null
  fi

  cd apps/cli
  bash scripts/build.sh
  cd ../..
fi

# Start CLI tool — passes all arguments through
exec node apps/cli/dist/cli.js --open "$@"
