#!/bin/zsh

set -u
unsetopt bg_nice 2>/dev/null || true

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3001}"
URL="${START_URL:-http://localhost:${PORT}/admin/}"
PID_FILE="${PROJECT_DIR}/.local-server.pid"
LOG_FILE="${PROJECT_DIR}/.local-server.log"

cd "$PROJECT_DIR" || exit 1

echo "Starting GU Album local server..."
echo "Project: $PROJECT_DIR"
echo "URL: $URL"
echo

if [ ! -f "node_modules/next/dist/bin/next" ]; then
  echo "Cannot find Next.js in node_modules."
  echo "Please run: pnpm install"
  echo
  read -r "?Press Enter to close this window..."
  exit 1
fi

if [ -f "$PID_FILE" ]; then
  EXISTING_PID="$(cat "$PID_FILE")"
  if kill -0 "$EXISTING_PID" 2>/dev/null; then
    echo "Local server is already running. PID: $EXISTING_PID"
    open "$URL"
    echo
    read -r "?Press Enter to close this window..."
    exit 0
  fi
  rm -f "$PID_FILE"
fi

PORT_PID="$(lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
if [ -n "$PORT_PID" ]; then
  echo "Port $PORT is already in use by PID $PORT_PID."
  echo "Opening the local page directly."
  open "$URL"
  echo
  read -r "?Press Enter to close this window..."
  exit 0
fi

nohup node node_modules/next/dist/bin/next dev -p "$PORT" > "$LOG_FILE" 2>&1 &
SERVER_PID="$!"
echo "$SERVER_PID" > "$PID_FILE"

echo "Server PID: $SERVER_PID"
echo "Log file: $LOG_FILE"
echo "Waiting for server..."

for _ in {1..60}; do
  if curl -s -I "$URL" >/dev/null 2>&1; then
    echo "Server is ready."
    open "$URL"
    echo
    echo "You can close this window. Use stop-local.command to stop the server."
    exit 0
  fi
  sleep 1
done

echo "Server did not become ready in time."
echo "Open log file to inspect: $LOG_FILE"
echo
read -r "?Press Enter to close this window..."
