#!/bin/zsh

set -u
unsetopt bg_nice 2>/dev/null || true

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${PORT:-3001}"
PID_FILE="${PROJECT_DIR}/.local-server.pid"

cd "$PROJECT_DIR" || exit 1

echo "Stopping GU Album local server..."
echo "Project: $PROJECT_DIR"
echo "Port: $PORT"
echo

STOPPED=0

if [ -f "$PID_FILE" ]; then
  SERVER_PID="$(cat "$PID_FILE")"
  if kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "Stopping PID from .local-server.pid: $SERVER_PID"
    kill "$SERVER_PID" 2>/dev/null || true
    STOPPED=1
  else
    echo "PID file exists, but the process is not running."
  fi
  rm -f "$PID_FILE"
fi

PORT_PIDS="$(lsof -ti tcp:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "$PORT_PIDS" ]; then
  echo "Stopping process(es) listening on port $PORT:"
  echo "$PORT_PIDS"
  echo "$PORT_PIDS" | xargs kill 2>/dev/null || true
  STOPPED=1
fi

if [ "$STOPPED" -eq 1 ]; then
  echo
  echo "Local server stopped."
else
  echo "No local server was found."
fi

echo
read -r "?Press Enter to close this window..."
