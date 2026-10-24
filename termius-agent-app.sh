#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

if [ -x "$DIR/node_modules/.bin/electron" ]; then
  exec "$DIR/node_modules/.bin/electron" . --no-sandbox "$@"
else
  exec npx electron . --no-sandbox "$@"
fi

