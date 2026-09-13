#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
OUTPUT=${1:-$ROOT_DIR/dist/openscaler}
# Resolve user-supplied relative paths before changing to the repository root.
case "$OUTPUT" in
  /*) ;;
  *) OUTPUT="$PWD/$OUTPUT" ;;
esac

command -v go >/dev/null 2>&1 || { echo "Go is required." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "Node.js and npm are required." >&2; exit 1; }

echo "Building Vite console..."
(cd "$ROOT_DIR/frontend" && npm ci --no-audit --no-fund && npm run build)

mkdir -p "$(dirname -- "$OUTPUT")"
echo "Building OpenScaler..."
(cd "$ROOT_DIR" && go build -trimpath -o "$OUTPUT" ./cmd/openscaler)
echo "Built: $OUTPUT"
