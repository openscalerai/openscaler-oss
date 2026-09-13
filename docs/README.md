# OpenScaler documentation

> 2026-09-13 update: OSS-side Supply Connector v1 and a Cloud draft adapter are implemented. Current capabilities, limits and acceptance boundaries are maintained in [Supply Connector](SUPPLY_CONNECTOR.md). Local implementation does not imply Cloud approval or production release.

OpenScaler OSS is a transparent, open-source, self-hosted AI inference gateway for developers, internal enterprise users, and inference operators. It gives applications one API address while retaining control of credentials, routing, and local operational records.

**OSS: Connect and manage inference capacity. / Cloud: Buy and sell inference capacity.** The opt-in Supply Connector implements explicit local publication, dedicated endpoint reservation and request receipts, with an adapter for Cloud supplier drafts. It is not required for standalone use or direct API supplier onboarding; Cloud qualification is separate. Participation exchanges necessary market metadata; it does not imply all data remains local. See [OSS and Cloud responsibilities](CLOUD_RELATIONSHIP.md).

This guide explains what OpenScaler is, what it can do, how its model and endpoint hierarchy works, how to install and configure it, and how to send your first requests.

## Contents

- [What OpenScaler is](#what-openscaler-is)
- [What it can do](#what-it-can-do)
- [How it works](#how-it-works)
- [Install and start](#install-and-start)
- [Complete first-time setup](#complete-first-time-setup)
- [Call the Gateway API](#call-the-gateway-api)
- [Configure routing](#configure-routing)
- [Operate and secure it](#operate-and-secure-it)
- [More documentation](#more-documentation)

## What OpenScaler is

OpenScaler sits between your application and the inference providers you choose:

```text
Application
    │  OpenAI-compatible request + Gateway API key
    ▼
OpenScaler
    │  exact model ID → eligible endpoints → selected endpoint
    ▼
Official provider / third-party provider / local inference service
```

It is designed around four visible levels:

1. **Model publisher** — for example Alibaba, Anthropic, Google, Meta, Microsoft, NVIDIA, or OpenAI.
2. **Model family** — for example Qwen, Wan, Claude, Gemini, Llama, Phi, or GPT.
3. **Exact model ID** — the stable value your application sends in the `model` field.
4. **Endpoints** — one or more official, third-party, regional, or local services capable of serving that exact model ID.

OpenScaler may select another healthy endpoint for the same exact model ID. It never silently replaces the model selected by the developer with a different model.

The self-hosted edition is not a public marketplace or credit wallet; it connects to operator-configured endpoints and requires no SwiftScale or Cloud account. OpenScaler Cloud is a separate inference service marketplace open to individual and business suppliers. Suppliers need not install this gateway. See [Cloud relationship and optional integration](CLOUD_RELATIONSHIP.md).

OpenScaler is offered as an open-source self-hosted gateway and as OpenScaler Cloud. There is no Enterprise or Dedicated edition; organization governance, SSO/SCIM, compliance suites, and fleet management are outside its developer-focused scope.

## What it can do

### One API for multiple inference types

| Capability | Gateway endpoint |
| --- | --- |
| Model discovery | `GET /v1/models` |
| Chat completions | `POST /v1/chat/completions` |
| Responses API | `POST /v1/responses` |
| Embeddings | `POST /v1/embeddings` |
| Image generation | `POST /v1/images/generations` |
| Reranking | `POST /v1/rerank` |
| Video generation | `POST /v1/videos` |
| Speech synthesis | `POST /v1/audio/speech` |
| Audio transcription | `POST /v1/audio/transcriptions` |

Request and response fields supported by a provider are passed through. OpenScaler rewrites only the public model ID to the upstream model ID configured for the selected endpoint.

### Direct provider and local connections

- Configure official provider endpoints from the versioned model catalog.
- Add private OpenAI-compatible or Anthropic-compatible endpoints with a guided wizard.
- Connect cloud, proxy, regional, or locally operated inference services.
- Keep official and third-party endpoints visibly separated.
- Store provider API keys encrypted with AES-256-GCM.

### Transparent same-model routing

- Use a platform default score based on configured price, observed availability, latency, and preferred region.
- Use strict sequential failover by dragging endpoints into order.
- Use weighted traffic distribution such as `70 / 30` across healthy endpoints.
- Include or exclude individual endpoints without deleting them.
- Inspect the provider and route selected for completed requests.

### Local access and observability

- Create independently revocable Gateway API keys for applications and CI.
- View recent request metadata, token usage, latency, estimated cost, and serving endpoint.
- Check process health and database readiness.
- Export Prometheus metrics from `/metrics`.
- Run without telemetry or prompt persistence by default.

## How it works

### Management and inference credentials are different

| Credential | Used for | Storage |
| --- | --- | --- |
| Administrator account | Console and `/api/admin/*` | Configured at installation |
| Gateway API key | Application requests to `/v1/*` | Only a SHA-256 hash is stored for managed keys |
| Provider API key | OpenScaler requests to an upstream provider | Encrypted in SQLite with a separate master key |

Never use the administrator password or a provider API key in client applications.

### Local persistence

SQLite is the default and currently supported database. It stores provider configuration, encrypted provider credentials, managed Gateway API-key hashes, routing settings, and request metadata. Prompt and response bodies are not stored.

The official catalog in [`config/catalog.yaml`](../config/catalog.yaml) seeds publisher, family, model, endpoint, capability, and pricing metadata. Updating OpenScaler can add catalog entries; local API keys and custom endpoints remain in SQLite and are not committed to GitHub.

See [Data and storage](DATA_AND_STORAGE.md) for backup, restore, retention, and reset procedures.

## Install and start

### Requirements

- Docker Engine or Docker Desktop
- Docker Compose v2
- OpenSSL for first-run credential generation

### Console login

| Environment | Username | Password |
| --- | --- | --- |
| Local source development with `./scripts/dev.sh` | `admin` | `openscaler` |
| Standard installation with `./scripts/install.sh` | `admin` | Random password printed by the installer and saved in `secrets/admin_password.txt` |

The default local development login is therefore **`admin` / `openscaler`**. Change or override it before exposing the console beyond a trusted development machine.

### Standard installation

```bash
cd openscaler-oss
./scripts/install.sh
./scripts/start.sh
```

The installer creates local credentials under `secrets/`. The start script launches the container, waits for readiness, detects the host LAN address, and prints both the console and Gateway API addresses.

Open the console at the address printed by `scripts/start.sh` and sign in with the administrator username and password printed by `scripts/install.sh`.

Useful lifecycle commands:

```bash
./scripts/logs.sh
./scripts/stop.sh
./scripts/start.sh
```

For source development with automatic frontend updates:

```bash
./scripts/dev.sh
```

The development console runs at `http://127.0.0.1:5173`; the Go gateway remains the inference server on port `8080`. Sign in with the default development account: username `admin`, password `openscaler`.

## Complete first-time setup

### 1. Configure a model endpoint

1. Open **Models**.
2. Select a publisher, model family, and exact model ID.
3. In the endpoint table, choose **Configure** for an official endpoint.
4. Enter the provider API key and confirm the endpoint settings.
5. Save the endpoint. OpenScaler performs a read-only connectivity and credential check; it does not consume inference tokens.

To add a private or third-party endpoint, choose **Add custom endpoint** and follow the wizard:

1. Select the model category, publisher, and family.
2. Enter a stable endpoint ID, display name, protocol, authentication method, address, and region.
3. Map the public model ID to the upstream provider model ID.
4. Enter price metadata, routing values, and supported capabilities.
5. Review, save, and verify the connection.

Use HTTPS unless the endpoint is a trusted local service and you explicitly enable local HTTP.

### 2. Configure routing when a model has multiple endpoints

Choose **Route settings** beside the exact model ID. The dialog shows only endpoints for that model ID.

- Keep **Use platform default strategy** enabled for transparent scoring.
- Disable it and select **Sequential failover** to use the visible top-to-bottom order.
- Disable it and select **Weighted traffic distribution** to split initial requests by relative weight.
- Set a preferred region when same-region endpoints should receive a small advantage.

### 3. Create a Gateway API key

1. Open **API access**.
2. Review the local or LAN API base address.
3. Create a named API user for an application, developer, team, or environment.
4. Create a key and copy it immediately; the plaintext is shown only once.

Create separate keys for production, development, and CI so each can be revoked independently.

### 4. Verify callable models

```bash
export OPENSCALER_URL="http://127.0.0.1:8080/v1"
export OPENSCALER_API_KEY="<gateway-api-key>"

curl "$OPENSCALER_URL/models" \
  -H "Authorization: Bearer $OPENSCALER_API_KEY"
```

Use a returned `id` exactly as shown. A catalog entry without an enabled, authenticated, compatible endpoint is not advertised as callable.

## Call the Gateway API

All inference requests use the Gateway API key:

```http
Authorization: Bearer <gateway-api-key>
```

Replace `your-model-id` with a callable ID from `GET /v1/models` or the console.

### cURL

```bash
curl "$OPENSCALER_URL/chat/completions" \
  -H "Authorization: Bearer $OPENSCALER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "your-model-id",
    "messages": [{"role": "user", "content": "Explain transparent AI routing."}],
    "stream": false
  }'
```

### Python

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://127.0.0.1:8080/v1",
    api_key="<gateway-api-key>",
)

response = client.chat.completions.create(
    model="your-model-id",
    messages=[{"role": "user", "content": "Hello from OpenScaler"}],
)
print(response.choices[0].message.content)
```

### Node.js

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://127.0.0.1:8080/v1",
  apiKey: "<gateway-api-key>",
});

const response = await client.chat.completions.create({
  model: "your-model-id",
  messages: [{ role: "user", content: "Hello from OpenScaler" }],
});
console.log(response.choices[0].message.content);
```

### Go

```go
package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

func main() {
    body := []byte(`{"model":"your-model-id","messages":[{"role":"user","content":"Hello"}]}`)
    request, _ := http.NewRequest("POST", "http://127.0.0.1:8080/v1/chat/completions", bytes.NewReader(body))
    request.Header.Set("Authorization", "Bearer <gateway-api-key>")
    request.Header.Set("Content-Type", "application/json")
    response, err := http.DefaultClient.Do(request)
    if err != nil { panic(err) }
    defer response.Body.Close()
    output, _ := io.ReadAll(response.Body)
    fmt.Println(string(output))
}
```

### Java

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

var request = HttpRequest.newBuilder(
        URI.create("http://127.0.0.1:8080/v1/chat/completions"))
    .header("Authorization", "Bearer <gateway-api-key>")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(
        "{\"model\":\"your-model-id\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}"))
    .build();
var response = HttpClient.newHttpClient()
    .send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());
```

### Rust

```rust
let response = reqwest::Client::new()
    .post("http://127.0.0.1:8080/v1/chat/completions")
    .bearer_auth("<gateway-api-key>")
    .json(&serde_json::json!({
        "model": "your-model-id",
        "messages": [{"role": "user", "content": "Hello"}]
    }))
    .send().await?;
println!("{}", response.text().await?);
```

The console generates copyable examples for cURL, Python, Go, Java, Rust, and Node.js using the instance's current API address. It also provides examples for text, image, embeddings, rerank, video, speech, and transcription requests.

For streaming, multimodal examples, response headers, errors, and limits, see the complete [Gateway API guide](API.md).

## Configure routing

Routing is always scoped to one exact model ID.

### Platform default

| Signal | Default contribution |
| --- | ---: |
| Configured price | 45% |
| Observed availability | 35% |
| Observed latency | 15% |
| Preferred region | 5% |

The score is visible and never changes the requested model. An endpoint with no observations starts with neutral availability and latency priors. A price of zero is treated as unknown rather than free.

### Sequential failover

The first participating endpoint receives normal traffic. OpenScaler advances to the next endpoint after connection errors, timeouts, or retryable upstream responses. Drag rows to change the order.

### Weighted traffic distribution

Healthy participating endpoints receive initial requests according to relative weights. `70 / 30` targets approximately 70% and 30% over time. If the initially selected endpoint fails, another eligible endpoint may still be tried for that request.

OpenScaler retries connection and timeout errors and upstream `401`, `403`, `408`, `429`, and `5xx` responses. Other client errors are returned directly to avoid hiding an invalid request.

## Operate and secure it

### Health and metrics

```bash
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:8080/readyz
curl http://127.0.0.1:8080/metrics
```

### Network access

- Use `127.0.0.1` only for applications on the gateway host.
- Use the displayed LAN address for other trusted devices on the same network.
- Use private DNS and TLS termination for shared or production deployments.
- Restrict the administrator console more tightly than inference access.
- Never expose the default development deployment directly to the public Internet.

### Backups and upgrades

Back up the SQLite database and its matching master encryption key together before upgrading. Pin a release or container digest in production, review release notes, restart with `scripts/start.sh`, and verify `/readyz`, callable models, routing, and one real inference request.

### Troubleshooting

| Symptom | Check |
| --- | --- |
| A model is absent from `/v1/models` | Confirm an endpoint is enabled, has a provider key, supports the capability, and passed validation. |
| `401 invalid_api_key` | Use a Gateway API key, not the administrator password or provider key. |
| Provider authentication fails | Re-enter the provider key and run endpoint validation. |
| LAN address is unavailable | Set `OPENSCALER_PUBLIC_URL` explicitly or access from `127.0.0.1` on the host. |
| Requests use an unexpected endpoint | Inspect the model's route mode, participants, order, weights, preferred region, and platform score. |
| Estimated cost differs from an invoice | Update local input/output price metadata; local estimates do not include every provider discount, tax, or billing adjustment. |

## More documentation

| Guide | Purpose |
| --- | --- |
| [Gateway API](API.md) | Complete endpoints, authentication, code examples, routing headers, errors, and limits. |
| [Configuration](CONFIGURATION.md) | Environment variables, providers, model catalog, pricing, and routing behavior. |
| [Operations](OPERATIONS.md) | Lifecycle commands, networking, health, upgrades, and recovery. |
| [Data and storage](DATA_AND_STORAGE.md) | SQLite contents, secret handling, backup, restore, reset, and retention. |
| [Architecture](ARCHITECTURE.md) | Components, request path, persistence, and extension boundaries. |
| [Development](DEVELOPMENT.md) | Source layout, local workflow, tests, and builds. |
| [Product design](PRODUCT.md) | Audience, principles, scope, and non-goals. |
| [Open-source policy](OPEN_SOURCE.md) | License rights, trademarks, contributions, and dependencies. |
| [Release process](RELEASES.md) | Versioning, artifacts, images, SBOMs, and verification. |
| [Security policy](../SECURITY.md) | Vulnerability reporting and deployment baseline. |
| [Support](../SUPPORT.md) | Project support scope and safe issue reporting. |
