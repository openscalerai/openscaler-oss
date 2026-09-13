# Migration to OpenScaler OSS

> 2026-09-13 update: OSS-side Supply Connector v1 and a Cloud draft adapter are implemented. Current capabilities, limits and acceptance boundaries are maintained in [Supply Connector](SUPPLY_CONNECTOR.md). Earlier planning/migration descriptions below are historical and do not imply Cloud approval or production release.

2026-09-06. This directory contains the independent self-hosted gateway migrated from the current working tree of OpenSwiftScale-OSS, including uncommitted source changes. The original checkout is unchanged. `source-manifest.json` records each input file's SHA-256 and destination; generated console assets are rebuilt from frontend source.

## Branding and compatibility

The product is **OpenScaler OSS — by SwiftScale**: **Connect and manage inference capacity.** Cloud uses **Buy and sell inference capacity.** SwiftScale retains its enterprise brand and product responsibilities.

| Surface | Current name |
| --- | --- |
| Go module | `github.com/swift-scale-ai/openscaler-oss` |
| Command and executable | `cmd/openscaler`, `openscaler` |
| Frontend package | `@openscaler/console` |
| Environment variables | `OPENSCALER_*` (including provider keys and `_FILE` secrets) |
| Response headers | `X-OpenScaler-*` |
| Metrics and error prefix | `openscaler_*` |
| Default database | `/data/openscaler.db` |
| Default catalog | `/etc/openscaler/catalog.yaml` |
| Compose project and local image | `openscaler-oss` |

Browser storage keys, UI text, logo accessibility text, examples and scripts use the new brand. Old environment names, headers and browser sessions are not aliases. Existing installations must explicitly map configuration, monitoring and integrations before switching. This migration creates no production cutover and moves no database, encrypted provider keys, master key, environment file, or user credentials. A database restore requires its matching master key and a separately reviewed backup/restore plan; a name change alone does not transfer state.

The original `LICENSE` (Apache-2.0) and `NOTICE` are retained byte-for-byte, including historical names and copyright. Third-party services, model names and SwiftScale's identity remain unchanged. Modified files are documented by this migration notice and the source manifest; the manifest describes original inputs, not hashes of transformed outputs.

## Standalone operation and product boundary

The migrated runtime remains a single Go process with embedded console and local SQLite. It retains model catalog, BYOK, local encrypted provider credentials, revocable Gateway API keys, same-model endpoint routing/failover, protocol adapters, usage metadata, health and metrics. It has no Cloud account, license server, payment ledger, supplier payout or mandatory telemetry dependency. Configured inference providers may require network access; standalone does not mean remote inference works offline.

Supply Connector is **not implemented**. Explicit service/capacity publication, authorization scope, market/private quota isolation, withdrawal and in-flight request accounting require separate implementation and acceptance. Installing OSS does not publish resources. Bare GPU deployment, enterprise SSO/governance, dynamic pricing and Spot are not implied by migration. Regional routing preferences are scoring preferences, not enforced data-residency constraints. Cloud trading, provenance verification and payment boundaries remain separate.

The parent workspace's `docs/POSITIONING.md`, `BRAND_ARCHITECTURE.md`, `PRODUCT_SPEC.md` and `IMPLEMENTATION_ROADMAP.md` govern these boundaries. Standalone copies of the relevant product guidance are [Product](PRODUCT.md), [Cloud relationship](CLOUD_RELATIONSHIP.md) and [Architecture](ARCHITECTURE.md).

## Local build and release

Run `./scripts/start.sh` from the OSS directory to create fresh credentials and build/start the local Compose image. `./scripts/dev.sh` runs the native development gateway and Vite console. `./scripts/build.sh` builds the embedded frontend and standalone binary. Build tools require Go 1.24+ and a Node version supported by the locked Vite toolchain (Node 22.12+ in the 22.x line).

Console documentation links resolve locally under `/docs/` as bundled plain-text Markdown; they do not require GitHub or Cloud. Only the public Markdown guides are embedded there.

The new remote repository and GHCR names are intended release targets, not evidence of published resources. CI and release workflows assume this directory becomes its own repository root. Local Compose builds from this checkout and does not download a presumed new-brand image. No remote repository, release, domain or deployment was created during migration.

## Verification

```bash
npm --prefix frontend ci --no-audit --no-fund
npm --prefix frontend run build
go mod verify
go vet ./...
go test -race ./...
go build -trimpath -o dist/openscaler ./cmd/openscaler
docker compose -f deploy/compose.yaml config --quiet
docker build -t openscaler-oss:local .
```

Source and boundary checks: `python3 scripts/verify-migration.py`. It validates input hashes when the original checkout is available, destination presence, preserved notices, source brand identifiers and absence of cross-component Go imports. The parent workspace's `docs/OSS_MIGRATION.md` records the actual acceptance results and limitations.
