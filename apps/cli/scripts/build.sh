#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLI_DIR="$(dirname "$SCRIPT_DIR")"

echo "Building MailFail CLI..."

# Step 1: Build UI (Vite SPA → dist/ui/)
echo "  [1/2] Building UI..."
cd "$CLI_DIR/ui"
npx vite build

# Step 2: Build server (tsup → dist/cli.js)
echo "  [2/2] Building server..."
cd "$CLI_DIR"
npx tsup

echo "Build complete! Output in dist/"
echo "  dist/cli.js    — CLI entry point"
echo "  dist/ui/       — Web UI assets"
