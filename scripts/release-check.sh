#!/usr/bin/env bash
set -euo pipefail
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$root"
npm --prefix frontend ci --no-audit --no-fund
npm --prefix frontend run build
test -z "$(gofmt -l cmd internal docs)"
go mod verify
go vet ./...
go test -race ./...
mkdir -p dist
go build -trimpath -o dist/openscaler ./cmd/openscaler
python3 scripts/smoke.py
python3 -m unittest discover -s scripts -p 'test_*.py'
python3 scripts/verify-migration.py
docker compose -f deploy/compose.yaml config --quiet
# Offline distributable artifacts; this command never pushes a release or image.
release_dir="$root/dist/release-local"
mkdir -p "$release_dir"
for target_os in linux darwin; do
  for target_arch in amd64 arm64; do
    archive_dir=$(mktemp -d)
    CGO_ENABLED=0 GOOS="$target_os" GOARCH="$target_arch" go build -trimpath -o "$archive_dir/openscaler" ./cmd/openscaler
    cp LICENSE NOTICE "$archive_dir/"
    tar -czf "$release_dir/openscaler-local_${target_os}_${target_arch}.tar.gz" -C "$archive_dir" openscaler LICENSE NOTICE
    rm -rf "$archive_dir"
  done
done
(cd "$release_dir" && shasum -a 256 *.tar.gz > checksums.txt && shasum -a 256 -c checksums.txt)
echo "Local release checks passed. Artifacts: $release_dir"
