# Supply Connector v1

Updated 2026-09-13. The OSS side now implements explicit local publication, dedicated endpoint reservation, credentials, time windows, quotas, withdrawal, disconnect and durable request receipts. A command-line adapter submits a selected chat service to the existing Cloud supplier-draft API. Cloud approval, source verification, test consent, real dispatch and payment remain Cloud responsibilities; local publication is not market approval.

## Enable and use

The feature is **disabled by default** and cannot be enabled alongside `OPENSCALER_AUTH_DISABLED=true`. For the OSS Compose deployment:

```bash
OPENSCALER_SUPPLY_ENABLED=true ./scripts/start.sh
```

For native development, set the same variable before `./scripts/dev.sh`. Existing installations receive additive SQLite tables at startup. A database lock allows only one OSS process per database; this is a single-process self-hosted deployment, not a distributed capacity coordinator.

Sign in as the local administrator and open **Supply Connector / 供给接入**. Select an exact model, endpoint IDs, allowed API capabilities, an HTTPS public origin, operator and authorization evidence, declared region, start/end times, concurrency, requests per minute, total request budget and input/output USD-per-million-token prices. Service windows are at most 31 days. Save a draft; a dedicated credential is displayed once and stored only as a hash. Draft creation does not expose inference.

Review the publication consent and explicitly reserve the selected endpoints. Publication removes these endpoint IDs from private routing. Requests already running privately prevent publication until they finish. Another active/draining publication cannot reserve the same endpoint. Keep separately configured endpoints for private traffic. This is gateway-level endpoint isolation: operators must actually provision independent underlying credentials and capacity; duplicate configurations of the same physical upstream cannot establish resource independence. Declared region and evidence are not automatically verified or enforced residency guarantees.

Publication specifications are immutable. Withdraw and create a new draft when changing models, endpoints, time windows, capacity or prices. Changing an upstream URL, protocol path, upstream model or key causes that endpoint's old publication fingerprint to stop matching. Failover stays within the selected exact model and matching authorized endpoints. Credential rotation invalidates the previous supply key without resetting capacity or request budgets.

The connector currently offers Chinese and English form text; other console locales keep their existing translations and use English for the new form. Navigation labels are translated for all nine console locales.

## API

Management calls use the existing administrator Basic authentication, under `/api/admin`.

| Method/path | Behavior |
| --- | --- |
| `GET /api/admin/supply` | Enabled/disconnected state and latest 200 publications |
| `POST /api/admin/supply` | Create immutable draft, return one-time dedicated credential |
| `POST /api/admin/supply/{id}/publish` | Requires `authorize_publication=true` and `reserve_selected_endpoints=true` |
| `POST /api/admin/supply/{id}/withdraw` | Stop new admissions; retain in-flight capacity until completion/reconciliation |
| `POST /api/admin/supply/{id}/rotate-key` | Return replacement one-time credential for draft/active offer |
| `GET /api/admin/supply/{id}/manifest` | Selected public metadata only, without upstream URLs, provider keys, endpoint fingerprints or local catalog |
| `GET /api/admin/supply/{id}/receipts` | Latest 200 local request receipts |
| `GET /api/admin/supply/{id}/receipts/{request}/attempts` | Per-upstream attempt ID, provider, HTTP status and delivery state; no content or credentials |
| `POST /api/admin/supply/{id}/reconcile` | Release an unknown request after operator confirmation of upstream execution/accounting; body: `request_id`, `confirm_upstream_accounting=true` |
| `POST /api/admin/supply-control/disconnect` | Persistently block all new supply admissions; in-flight work drains |
| `POST /api/admin/supply-control/connect` | Explicitly resume valid active publications |

The dedicated supply key is accepted only at `/supply/{id}/...`. `GET /supply/{id}/v1/models` (also `/models` for Cloud probing) exposes just the authorized model. Inference paths below `/supply/{id}/v1/` are `chat/completions`, `responses`, `embeddings`, `images/generations`, `rerank`, `videos`, `audio/speech`, `audio/transcriptions`. Each publication explicitly allows its selected subset; adapters and upstream capabilities still determine actual protocol compatibility.

Requests are admitted transactionally only when the connector is connected, the publication is active, the service window is open, the credential matches, and concurrency/RPM/total request budgets permit it. All admitted attempts consume request budget, including failures; this is a local safety budget, not a Cloud invoice or token charge. Limits are independent from private API-key limits. The publication credential is never forwarded upstream.

Clients may send `X-OpenScaler-Supply-Request-ID` (1–128 characters). Reusing a previously admitted ID for that publication returns 409 without executing again. Clients omitting it receive a generated ID and do not get cross-request automatic deduplication. Response headers include that supply ID and a namespaced `X-OpenScaler-Request-ID` (`supply:<publication>:<request>`), which joins the receipt to local usage records. Duplicate requests do not replay response content, since prompts and responses are not retained by the connector.

## Withdrawal, disconnect and restart

States: `draft → active → draining → withdrawn`; an idle publication can move directly to withdrawn. Expired windows reject new requests even when the stored state still reads active; withdraw explicitly to release reserved endpoints. Disconnect is a persistent global admission switch and does not change individual publication consent or release in-flight capacity.

Each admission and individual upstream attempt is durable before contacting an upstream. A transport error remains uncertain even if a later authorized failover succeeds; inspect all attempts rather than assuming a successful final response erases earlier execution risk. A successful transport completion records `completed`; ordinary HTTP failures record `failed`. Interrupted responses, cancelled requests, streaming without a recognized terminal marker, or process restart with unfinished admissions produce `unknown`. Unknown work continues occupying capacity and can keep a withdrawn publication draining. Do not retry or free it automatically: inspect the upstream and perform explicit reconciliation. Reconciliation records a local operator decision, not proof of model execution and not a payment/refund.

Streaming withdrawal does not cancel a previously admitted request. If its stream finishes normally, the receipt completes and draining can end. A truncated stream remains unknown. Local usage includes the serving endpoint, tokens and estimated cost; Cloud owns binding prices and settlement. Receipt/usage persistence failures fail closed through retained running/unknown capacity and emit an operator log.

Cloud connectivity is not required for private requests or local management. Disconnecting supply leaves separately configured private endpoints usable. To stop publishing while keeping administration available, use the disconnect/withdraw controls rather than disabling the feature flag before draining.

## Submit a Cloud supplier draft

Export the publication manifest using its management endpoint or the console. Put the dedicated supply credential and the authorized Cloud `oss_session` cookie value in separate private files. Use the intended Cloud environment explicitly:

```bash
python3 scripts/cloud-draft.py \
  --manifest /path/to/publication.json \
  --credential-file /path/to/supply-key.txt \
  --cloud-url https://cloud.example.com \
  --session-file /path/to/cloud-session.txt \
  --receipt /path/to/new-submission-receipt.json \
  --authorize-upload
```

The command sends only the model, operator, region, public connector address, chat path, prices, concurrency and dedicated connector credential accepted by the existing `/api/provider/v1/submissions` API. It does not upload private endpoints, provider keys, full catalog or user content. The public HTTPS address must resolve to your OSS reverse proxy; expose the supply paths, not the management API. Cloud must already have the model and a supplier profile for that account.

This adapter currently creates **chat supplier drafts**. Other protocols can be exposed locally, but extending the Cloud draft contract and certification for those protocols is separate work. Service windows and request budgets are enforced locally even though the current Cloud draft API does not accept those fields. Complete the remaining provenance and review steps in Cloud; this script never starts test traffic or trading.

A private receipt is reserved before the non-idempotent POST. If the request times out, crashes, redirects or returns an unrecognized result, it is not retried automatically; inspect Cloud submissions before creating another receipt. The same receipt path cannot be reused. Cloud credentials are read from local files, never placed in URLs or written to the receipt. HTTPS and no-follow-redirect behavior prevent cross-origin credential forwarding.

Local withdrawal immediately blocks future supply requests, but does not automatically delete a previously submitted Cloud draft or mark a Cloud listing withdrawn. The current Cloud API has no dedicated connector withdrawal contract: coordinate the remote listing through its existing operations flow. Cloud requests arriving after local withdrawal receive an explicit unavailable response.

## Validation and release

`go test -race ./...` covers draft consent, model/capability scope, private/market routing, quotas, duplicate admission, credential rotation, endpoint changes, persistent disconnect, recovery, draining, streaming truncation and all eight protocol paths with local mock upstreams. `scripts/smoke.py` checks the standalone process. `scripts/release-check.sh` also builds four platform archives with LICENSE/NOTICE and SHA-256 checksums; it never publishes them remotely.

Real supplier credentials, reachable deployment URLs, Cloud test identities and an authorized release repository are required for live integration and distribution acceptance. Local tests do not establish those external results.
