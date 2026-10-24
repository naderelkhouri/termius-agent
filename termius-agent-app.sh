#!/usr/bin/env bash
set -e
REAL_SCRIPT="$(realpath "${BASH_SOURCE[0]}")"
DIR="$(cd "$(dirname "$REAL_SCRIPT")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

if [ -x "$DIR/node_modules/.bin/electron" ]; then
  exec "$DIR/node_modules/.bin/electron" . --no-sandbox "$@"
else
  exec npx electron . --no-sandbox "$@"
fi


