import{a as e,c as t,i as n,l as r,o as i,s as a,t as o,u as s}from"./index-Xv7_ZTgD.js";var c=i(`Search`,[[`circle`,{cx:`11`,cy:`11`,r:`8`,key:`4ej97u`}],[`path`,{d:`m21 21-4.3-4.3`,key:`1qie3q`}]]),l=`# Contributing

Thank you for helping improve OpenScaler.

## Before starting

1. Search existing issues and pull requests.
2. Open an issue before a large protocol, persistence, security, or architecture change.
3. Keep the open-source runtime independent of OpenScaler Cloud accounts, billing, and hosted services.
4. Add provider behavior only when an official API contract or a clearly documented compatible protocol exists.

## Local checks

Follow the [development guide](docs/DEVELOPMENT.md), then run:

\`\`\`bash
npm --prefix frontend run build
make check
\`\`\`

Add tests for request rewriting, streaming, authentication, API-key lifecycle, routing, persistence migrations, and usage extraction when those areas change.

## Pull-request expectations

- Keep a pull request focused and explain its user-visible behavior.
- Preserve backward compatibility or document a migration path.
- Update English documentation and all supported console translations for user-facing changes.
- Never commit provider credentials, Gateway API keys, administrator passwords, prompts, responses, customer data, master keys, generated SQLite files, or database WAL files.
- Do not add telemetry, an account requirement, or a mandatory hosted dependency to the self-hosted runtime.
- Verify new dependencies have a compatible license and a clear operational purpose.
- Use \`gofmt\`; do not hand-edit generated frontend build artifacts except through the normal build.

## Licensing

By contributing, you agree that your contribution is licensed under Apache-2.0.

Do not submit material you do not have the right to license. OpenScaler and SwiftScale trademarks are not granted by the source-code license; see the [open-source policy](docs/OPEN_SOURCE.md).
`,u=`# Security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Send a minimal report to \`security@swift-scale.com\` with the affected version, reproduction steps, impact, and any suggested mitigation. Please do not include live provider credentials or private prompts.

## Secure deployment baseline

- Bind the default console to localhost or place it behind TLS and trusted network controls.
- Protect and back up \`/data/keys/master.key\` separately from the SQLite database, or inject \`OPENSCALER_MASTER_KEY_FILE\` from an external secret manager.
- Use different random values for Gateway API keys, provider credentials, and the administrator password.
- Create separate managed API users and keys for each workload; revoke unused keys and review last-used timestamps.
- Keep prompt logging disabled.
- Pin production container images by digest.
- Back up the SQLite volume and test restoration.
- Restrict outbound traffic to explicitly configured provider endpoints.
- Review the model catalog, prices, limits, and regional endpoints before deployment.
- Rotate provider keys independently of gateway client keys.
- Never expose a management console containing provider configuration directly to the public internet.
- Treat custom provider endpoints as privileged configuration because they control server-side outbound requests.

Provider API keys entered in the console are encrypted with AES-256-GCM before SQLite persistence. The management API reports only whether a key exists and never returns plaintext or ciphertext. Encryption protects a database file or database-only backup; it does not protect a host where both SQLite and the master key have been compromised.

Managed Gateway API keys are never encrypted because the server does not need to recover them. The full key is displayed once at creation; SQLite stores a SHA-256 hash and a short safe prefix. The installer-created bootstrap key remains in a mounted secret file for initial access and backward compatibility. Treat that file as a privileged credential and prefer managed keys for normal applications.

Prompt and response bodies are not written to SQLite. Usage records contain request IDs, model and provider identifiers, status, token counts, latency, estimated cost, and timestamps. These metadata may still be sensitive in some organizations and should follow the same backup and access controls as the rest of the database.

OpenScaler never needs a SwiftScale account and does not emit product telemetry by default.

See [Data and storage](docs/DATA_AND_STORAGE.md) for the complete persistence and backup model.
`,d=`# Support

Use GitHub Issues for reproducible open-source runtime bugs, documentation problems, provider compatibility reports, and focused feature proposals. Search existing issues first and include the OpenScaler version, deployment method, operating system, relevant sanitized logs, and reproduction steps.

Do not post provider keys, Gateway API keys, administrator credentials, prompts, responses, customer data, database files, or master keys.

Security vulnerabilities must be reported privately according to [SECURITY.md](SECURITY.md), not through a public issue.

Project support is best effort through the public repository. This repository does not promise a commercial support plan, private deployment service, or SLA.
`,f=`# Gateway API

OpenScaler exposes an OpenAI-compatible inference API for applications inside your network. The API is separate from the administrator console: clients use a Gateway API key, while \`/api/admin/*\` uses the administrator account.

## Base URL

The standard installer detects the gateway host's active LAN address. The resulting client-reachable address is similar to:

\`\`\`text
http://192.168.1.25:8080/v1
\`\`\`

Use **Console → API access → API access method** to switch between and copy the local and LAN addresses of the current instance. \`127.0.0.1\` and \`localhost\` are reachable only from the gateway host. Production environments should normally configure the private DNS name or internal load-balancer address that exposes OpenScaler, for example:

\`\`\`text
https://ai-gateway.internal.example.com/v1
\`\`\`

Terminate TLS at a trusted internal reverse proxy or ingress when requests cross a host boundary.

## Authentication

Every inference request must include a Gateway API key as a Bearer token:

\`\`\`http
Authorization: Bearer <gateway-api-key>
\`\`\`

Create normal client credentials in **Console → API access**. Create one API user for each person, application, team, or environment, then issue one or more independently revocable keys to that user. The complete key is shown once; OpenScaler stores only its SHA-256 hash. Disabling a user immediately blocks all of that user's keys, while revoking one key leaves the user's other keys active. The console also records each key's creation time and last-used time.

\`scripts/install.sh\` generates an initial bootstrap key in \`secrets/gateway_api_keys.txt\`. The server reads bootstrap keys from \`OPENSCALER_API_KEYS\` or \`OPENSCALER_API_KEYS_FILE\` for first-run and compatibility purposes. Prefer managed keys from **API access** for applications and regular users. Do not use the console administrator password as an inference key, commit keys to source control, or expose them in browser-delivered application code.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| \`GET\` | \`/v1/models\` | List models that currently have an available provider route. |
| \`POST\` | \`/v1/chat/completions\` | OpenAI-compatible chat completions, including SSE streaming. |
| \`POST\` | \`/v1/responses\` | OpenAI Responses-compatible requests for supported providers. |
| \`POST\` | \`/v1/embeddings\` | Embeddings for routes that advertise embedding capability. |
| \`POST\` | \`/v1/images/generations\` | Image generation for routes that advertise image capability. |
| \`POST\` | \`/v1/rerank\` | Document reranking for routes that advertise rerank capability. |
| \`POST\` | \`/v1/videos\` | Video generation jobs for routes that advertise video capability. |
| \`POST\` | \`/v1/audio/speech\` | Text-to-speech for routes that advertise speech capability. |
| \`POST\` | \`/v1/audio/transcriptions\` | Multipart audio transcription for routes that advertise transcription capability. |

All inference endpoints route only within the exact public \`model\` ID supplied by the caller. JSON endpoints accept \`model\` in the request body. Audio transcription accepts \`multipart/form-data\` with a \`model\` field and a \`file\` field. OpenScaler rewrites the public model ID to the selected endpoint's upstream model ID while preserving the remaining request payload.

Health endpoints do not use inference authentication: \`GET /healthz\` reports process health and \`GET /readyz\` reports readiness. Administrator endpoints under \`/api/admin/*\` are intended for the embedded console and use separate HTTP Basic authentication. API-user and key management is available through \`/api/admin/users\`; it never returns a previously created plaintext key.

## Discover available models

\`\`\`bash
export OPENSCALER_URL="http://192.168.1.25:8080/v1"
export OPENSCALER_KEY="<key-created-in-api-access>"

curl "$OPENSCALER_URL/models" \\
  -H "Authorization: Bearer $OPENSCALER_KEY"
\`\`\`

Only models with an enabled connection and a saved Provider API key are returned. Use the returned model \`id\` exactly in inference requests; it selects the matching route rule.

## Chat completions

\`\`\`bash
curl http://192.168.1.25:8080/v1/chat/completions \\
  -H "Authorization: Bearer $OPENSCALER_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.6-luna",
    "messages": [
      {"role": "user", "content": "Explain this architecture."}
    ],
    "stream": false
  }'
\`\`\`

Set \`stream\` to \`true\` to receive upstream Server-Sent Events. OpenScaler streams the provider response without persisting prompt bodies.

## Client examples

The Models workspace shows which exact model IDs currently have a ready endpoint. Use one of those IDs with the cURL, Python, Go, Node.js, Java, or Rust examples below.

### Python OpenAI SDK

Python:

\`\`\`python
from openai import OpenAI

client = OpenAI(
    base_url="http://192.168.1.25:8080/v1",
    api_key="<gateway-api-key>",
)

response = client.chat.completions.create(
    model="gpt-5.6-luna",
    messages=[{"role": "user", "content": "Hello"}],
)
print(response.choices[0].message.content)
\`\`\`

### Node.js OpenAI SDK

\`\`\`typescript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "http://192.168.1.25:8080/v1",
  apiKey: "<gateway-api-key>",
});

const response = await client.chat.completions.create({
  model: "gpt-5.6-luna",
  messages: [{ role: "user", content: "Hello" }],
});
console.log(response.choices[0].message.content);
\`\`\`

### Go standard library

\`\`\`go
import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

body := []byte(\`{"model":"gpt-5.6-luna","messages":[{"role":"user","content":"Hello"}]}\`)
req, _ := http.NewRequest("POST", "http://192.168.1.25:8080/v1/chat/completions", bytes.NewReader(body))
req.Header.Set("Authorization", "Bearer <gateway-api-key>")
req.Header.Set("Content-Type", "application/json")
response, err := http.DefaultClient.Do(req)
if err != nil {
    panic(err)
}
defer response.Body.Close()
output, _ := io.ReadAll(response.Body)
fmt.Println(string(output))
\`\`\`

### Java HTTP client

\`\`\`java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

var request = HttpRequest.newBuilder(
        URI.create("http://192.168.1.25:8080/v1/chat/completions"))
    .header("Authorization", "Bearer <gateway-api-key>")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(
        "{\\"model\\":\\"gpt-5.6-luna\\",\\"messages\\":[{\\"role\\":\\"user\\",\\"content\\":\\"Hello\\"}]}"))
    .build();
var response = HttpClient.newHttpClient()
    .send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());
\`\`\`

### Rust with reqwest

\`\`\`rust
let response = reqwest::Client::new()
    .post("http://192.168.1.25:8080/v1/chat/completions")
    .bearer_auth("<gateway-api-key>")
    .json(&serde_json::json!({
        "model": "gpt-5.6-luna",
        "messages": [{"role": "user", "content": "Hello"}]
    }))
    .send().await?;
println!("{}", response.text().await?);
\`\`\`

Use the console-generated examples when possible: they automatically use the current \`OPENSCALER_PUBLIC_URL\` and selected callable model ID.

## Examples by model capability

The provider must advertise the requested capability for the selected exact model ID. These request bodies are compatible gateway contracts; provider-specific optional fields are passed through when supported.

### Responses API

\`\`\`bash
curl "$OPENSCALER_URL/responses" \\
  -H "Authorization: Bearer $OPENSCALER_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"your-text-model-id","input":"Explain exact-model routing."}'
\`\`\`

### Embeddings

\`\`\`bash
curl "$OPENSCALER_URL/embeddings" \\
  -H "Authorization: Bearer $OPENSCALER_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"your-embedding-model-id","input":"OpenScaler keeps routing transparent."}'
\`\`\`

### Image generation

\`\`\`bash
curl "$OPENSCALER_URL/images/generations" \\
  -H "Authorization: Bearer $OPENSCALER_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"your-image-model-id","prompt":"A transparent AI gateway","size":"1024x1024"}'
\`\`\`

### Reranking

\`\`\`bash
curl "$OPENSCALER_URL/rerank" \\
  -H "Authorization: Bearer $OPENSCALER_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"your-rerank-model-id","query":"transparent AI routing","documents":["Exact-model endpoint routing","An unrelated document"]}'
\`\`\`

### Video generation

\`\`\`bash
curl "$OPENSCALER_URL/videos" \\
  -H "Authorization: Bearer $OPENSCALER_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"your-video-model-id","prompt":"Requests flowing through a transparent AI gateway"}'
\`\`\`

Video providers commonly return an asynchronous job rather than completed media. OpenScaler passes the provider response through; poll or retrieve the job according to that provider's contract.

### Speech synthesis

\`\`\`bash
curl "$OPENSCALER_URL/audio/speech" \\
  -H "Authorization: Bearer $OPENSCALER_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"your-speech-model-id","input":"Hello from OpenScaler.","voice":"default","response_format":"mp3"}' \\
  --output speech.mp3
\`\`\`

### Audio transcription

\`\`\`bash
curl "$OPENSCALER_URL/audio/transcriptions" \\
  -H "Authorization: Bearer $OPENSCALER_KEY" \\
  -F "model=your-transcription-model-id" \\
  -F "file=@audio.wav"
\`\`\`

The console includes the same capabilities for cURL, Python, Go, Java, Rust, and Node.js. Select one language to view all supported request types vertically.

## Routing behavior

The request's \`model\` value is the Public Model ID. OpenScaler resolves its configured endpoint pool as follows:

1. The request selects one exact model ID.
2. Endpoints capable of serving that exact model are inspected in their visible order.
3. Connection failures, timeouts, and retryable upstream responses advance to another eligible endpoint for the same model.
4. Ordinary model requests are never silently replaced with a different model ID.

Successful inference responses identify the selected route with these headers:

- \`X-OpenScaler-Provider\`
- \`X-OpenScaler-Route-Priority\`

See [Configuration](CONFIGURATION.md#same-model-endpoint-routing) for endpoint ordering, transparent platform scoring, and failover details. Routing is always limited to endpoints serving the requested exact model ID.

## Errors and request limits

Authentication failures return HTTP \`401\` with an \`invalid_api_key\` error. Unknown or unavailable model IDs and invalid request bodies return a JSON error response. Per-key request and concurrency limits are controlled by \`OPENSCALER_RATE_LIMIT_RPM\` and \`OPENSCALER_CONCURRENCY\`; exceeding a limit returns HTTP \`429\`.

Provider errors that are not eligible for failover are passed back to the client. Keep the response request ID and OpenScaler route headers when troubleshooting.

## Production checklist

- Publish the gateway through a private DNS name and TLS-enabled internal ingress.
- Keep inference keys separate from administrator credentials and provider keys.
- Give different applications different Gateway API keys so they can be rotated independently.
- Restrict network access to approved workloads and never expose the default local deployment directly to the public Internet.
- Verify provider model IDs, capabilities, pricing, and data-handling terms before production use.
`,p=`# Technical architecture

> 2026-09-13 update: OSS-side Supply Connector v1 and a Cloud draft adapter are implemented. Current capabilities, limits and acceptance boundaries are maintained in [Supply Connector](SUPPLY_CONNECTOR.md). Local implementation does not imply Cloud approval or production release.

The runtime described here is the independent self-hosted gateway. The Cloud marketplace owns public supplier onboarding, trading, balances and payouts. Individual and business suppliers may connect their existing APIs directly; this runtime is not a prerequisite. Optional Cloud integration boundaries are defined in [Cloud relationship](CLOUD_RELATIONSHIP.md), not implemented by adding mandatory payment or remote-control dependencies here.

## Runtime view

The opt-in Supply Connector runs inside the OSS process without a mandatory Cloud control plane. It publishes only explicitly selected, authorized model services, capacity, and service windows, with separate market/private credentials and quotas. Revocation stops new allocations while in-flight work follows completion/cancellation and accounting rules. SQLite persists immutable publications, hashed credentials and admissions. Gateway routing reserves selected endpoint IDs and rejects changed endpoint fingerprints. The diagram below shows the core gateway; the supply paths and lifecycle are detailed in [Supply Connector](SUPPLY_CONNECTOR.md). Model deployment on bare GPUs and attested execution are separate capabilities, not implied by API forwarding.

\`\`\`text
Application / OpenAI SDK
           |
           v
+---------------------------------------------+
| OpenScaler                              |
|  API auth -> model resolver -> provider     |
|  protocol adapter -> stream forwarding      |
|  usage/cost recorder -> embedded console    |
+----------------------+----------------------+
                       |
       +---------------+----------------+
       |               |                |
       v               v                v
 OpenAI-compatible  Anthropic API   Local inference
 providers          translation     endpoints
\`\`\`

## Process model

The default deployment is one Go process. It contains:

- Public OpenAI-compatible API.
- Management API protected by a distinct administrator account.
- API-user registry with independently revocable, hash-only Gateway API keys.
- SQLite-backed provider and model registry, initially seeded from YAML.
- Multi-route model router with priorities, weighted selection, and configured fallback chains.
- OpenAI-compatible proxy adapter.
- Anthropic Messages request/response translation.
- SQLite usage store in WAL mode.
- Embedded static web console.
- Health, readiness, request IDs, and Prometheus counters.

The console source is a Vite + React + TypeScript application under \`frontend/\`. Production builds compile it into \`internal/webui/dist\`, which is embedded in the Go executable. Node.js is a development and build dependency only; no Node.js runtime, Redis, PostgreSQL, queue, or SwiftScale control plane is required in deployment.

During local development, \`scripts/dev.sh\` runs the Go gateway on port 8080 and Vite on port 5173. Vite proxies API and operational endpoints to Go and provides hot module replacement. \`scripts/build.sh\`, Docker, CI, and release workflows build the console before compiling Go.

## Request path

1. Assign an \`X-OpenScaler-Request-ID\`.
2. Authenticate either a bootstrap Gateway API key or a managed API-user key. Managed keys are matched by SHA-256 hash and disabled users are rejected.
3. Enforce the configured request body limit.
4. Parse the requested public model ID.
5. Resolve the requested exact model ID and validate endpoint capability.
6. Apply its explicit routing mode: platform scoring, strict sequential failover, or weighted distribution across participating endpoints.
7. On connection errors, timeouts, rejected credentials, throttling, or upstream server errors, advance only through endpoints serving that same exact model ID.
8. Rewrite the public model ID to the selected provider model ID.
9. Replace the client Authorization header with the provider credential.
10. Forward the request or translate it to Anthropic Messages.
11. Stream provider bytes/events without buffering the complete response.
12. Extract usage when the provider supplies it.
13. Persist request metadata, tokens, cost estimate, status, latency, and the provider that served the request to SQLite.

Prompt and response bodies are not persisted.

## Product boundary

OpenScaler is technically independent from SwiftScale. It does not share backend services, databases, accounts, configuration, queues, internal packages, or runtime state with SwiftScale products.

OpenScaler Cloud and the self-hosted edition share public contracts and product conventions rather than a required live backend dependency: brand, user experience, model hierarchy, exact-model routing invariant, and OpenAI-compatible API behavior. Cloud-only account, balance, payment, and managed-endpoint services stay outside the self-hosted process.

## Persistence

SQLite is the default because it keeps single-node deployment small and operationally understandable. WAL mode and a busy timeout are enabled. Prompt and response bodies are never persisted. Provider API keys are stored only as AES-256-GCM ciphertext with a unique nonce; the master encryption key is kept outside SQLite.

\`api_users\` owns application, person, team, or environment identities. \`api_keys\` stores key labels, safe prefixes, SHA-256 hashes, enabled state, creation time, and last-used time. Plaintext managed keys are returned once at creation and cannot be recovered from the database. Disabling a user invalidates all owned keys; deleting a user cascades to those keys.

Public model metadata and provider routes are stored separately. \`model_configs\` owns the stable public model identity; \`model_routes\` maps it to one or more provider connections and stores the upstream model ID, capability set, priority, weight, limits, local price estimate, success/failure counters, latency EWMA, and most recent health result. The \`(public model ID, provider connection ID)\` pair is unique, while a public model ID can appear in any number of routes.

\`model_route_preferences\` stores the per-model routing mode (\`platform\`, \`failover\`, or \`weighted\`) plus the optional regional preference. Participation, priority, and weight remain properties of each \`model_routes\` row. Failover mode persists distinct priorities and neutral weights; weighted mode persists one priority group and relative weights. Disabling a route does not delete its connection or prevent it from being enabled again.

The official YAML catalog is seed data rather than the runtime source of truth. On first start, official provider templates and models are inserted into SQLite. Saving a connection through the management API refreshes the in-memory routing snapshot atomically, so inference does not require a restart. Startup and readiness never depend on upstream API-key validation. Administrators can explicitly run a read-only \`/v1/models\` probe; real inference attempts also update route health observations and refresh the default score.

The default runtime remains intentionally single-node. PostgreSQL, Redis, and distributed coordination are not part of the self-hosted product unless a concrete developer use case justifies their operational cost.

## Extension boundaries

The initial implementation separates:

- \`catalog\`: provider and model contracts.
- \`router\`: exact-model capability filtering, priority ordering, weighted selection, and failover resolution.
- \`provider\`: HTTP and protocol translation.
- \`auth\`: bootstrap API-key and administrator-request parsing.
- \`store\`: provider/model configuration, managed API users and keys, routing policy, and operational usage records.
- \`secret\`: local master-key creation and authenticated credential encryption.
- \`gateway\`: HTTP orchestration.
- \`webui\`: embedded management console.

Go's runtime plugin mechanism is intentionally avoided because it complicates portability and supply-chain review.
`,m=`# 开源版与 Cloud 的关系

> 2026-09-13 update: OSS-side Supply Connector v1 and a Cloud draft adapter are implemented. Current capabilities, limits and acceptance boundaries are maintained in [Supply Connector](SUPPLY_CONNECTOR.md). Local implementation does not imply Cloud approval or production release.

更新于 2026-09-13。OSS 本地供给入口已实现；Cloud 供应商结算与远程上架验收不因本次实现而完成。

## 两种产品职责

**OpenScaler OSS — 开源、自托管的 AI 推理网关与可选供给连接器。** 面向开发者、企业内部使用者和推理服务商，管理模型和上游、统一 API、BYOK、本地凭据、路由、Failover 与观测。保持无强制账号、许可证服务器和遥测的独立部署能力。OSS 端 Supply Connector 已实现，Cloud 草稿适配已提供，远端市场准入与发布验收仍需独立完成，企业使用 OSS 不意味着新增 Enterprise/Dedicated 产品线或企业治理承诺。

OpenScaler Cloud 是开放 AI 推理服务交易平台：用户按价格、能力、稳定性、延迟、质量和区域选择服务，平台管理匹配、计量与结算。Cloud 在供应商报价基础上加收 5% 服务费；1 USD 服务对应 1.05 USD 用户费用。该费用不适用于开源版自身的本地直连调用；经 Cloud 发生的交易才适用 Cloud 规则。

> **OSS: Connect and manage inference capacity.**
> **Cloud: Buy and sell inference capacity.**

OSS 负责管理推理资源，并将符合条件的资源转化为标准化供给；Cloud 负责聚合供给、匹配需求和完成交易。两者不是免费/付费版或功能超集关系。交易对象是可调用、可计量、有交付条件的推理服务与容量，不是裸 GPU、账户或 API Key。

## Supply Connector 目标边界

- 自愿启用并选择具体模型、容量、时段、地域和凭据范围；安装 OSS 不默认发布任何资源。
- 私有和市场流量隔离凭据、配额及资源预算。市场交易交换必要的容量、身份、计量及结算信息，不承诺参与 Cloud 后所有数据仍永不离开本地。
- 撤销发布停止新接单，在途请求按约定完成、取消和核对；断开 Cloud 后不影响独立本地调用。
- GPU Cloud、私有集群及闲置资源必须先成为可调用服务。模型安装、推理引擎和调度不是网关已有能力的自动延伸，需独立设计。
- 普通 Connector 的签名不证明一定自营、模型真实或没有转发；可验证运行环境属于后续分级认证。

## 可接受的供给来源

自运营（含租用 GPU 自行部署）、有依据的授权分销、私有剩余或时段性容量均可申请。每类需分别核验适用许可/条款、实际执行方、质量与数据处理条件。持有 API 使用额度不等于有权转售；个人订阅、试用和赠送额度不默认接纳，来源不明或未经许可的供给不得上架。

认证属于具体服务及证据范围，不是一个无条件可信徽章；用户供给类型限制适用于主备请求。同一实际运营方的多个节点不是独立供给或独立故障域。相关来源字段与策略仍需 Cloud 实现和验收。

## 规划与融资表述

供应商自主报价为基础。动态定价须在供应商授权规则和区间内执行；Spot Inference 须明确可中断、计费、重试及用户选择，均为后续选项，不作为当前已上线能力。完整交易和付款完成度以 Cloud 实施及试点记录为准。

核心叙事是“OSS 降低供给标准化与接入成本，Cloud 降低发现、信任和交易成本”。这不是首创或必然低价声明；安装量不等于有效供给，节点数不等于独立供应商，供给不等于成交。融资材料区分目标、代码、集成验收、试点和上线，不能因本次定义更新改变完成度。

## 供应商直接 API 接入

个人和企业均可成为供应商，不强制注册公司，也不要求安装开源版。已有兼容 API 可直接申请，使用何种推理框架或网关不影响参与资格。可选 SDK/代理只降低接入成本，不决定审核、流量或付款优先级。

个人采用经核验的本人同名收款账户，企业采用企业同名账户；具体国家、账户与支付渠道覆盖由 Cloud 确认。海外账户和海外公司不是统一前提，不借用无关第三方账户。

## 可选集成方向

- 使用方主动将 Cloud 配置为上游；专用路由偏好及费用展示后续按协议实现。
- 供应方主动发布选定模型及容量，使用平台专用凭据和限额。
- 不默认上传全部目录、本地配置、上游密钥或请求内容。
- 不把公共余额、供应商应付或跨境付款模块加入开源运行时。

统一公开协议、兼容性测试和文档比要求统一软件更重要。社区先共建适配与测试，基金会后置。

Cloud 目标准入流程为自动验证、合成预跑、用户授权的受控真实流量、达标正式接入及持续评估。资格属于具体模型服务/节点，个人与企业不因是否安装开源版而获得不同优先级。合成测试费用需事前约定，真实试运行正常交易结算；这些状态、授权和资金规则由 Cloud 管理，不成为开源运行时依赖。相邻 Cloud 项目详见 docs/SUPPLIER_ONBOARDING.md，完整流程尚待实现。

Cloud 的用户预充值、供应商限额后结算、付款审核和风险处理属于 Cloud 职责。相邻 Cloud 项目的对应规格为 docs/MARKETPLACE.md；部署、收款及身份资格不能仅依据本文件推定已支持。
`,h="# Configuration\n\n## Required settings\n\n| Variable | Purpose |\n| --- | --- |\n| `OPENSCALER_API_KEYS` or `_FILE` | Comma-separated keys accepted by the inference API. |\n| `OPENSCALER_ADMIN_PASSWORD` or `_FILE` | Password for the administrator console and `/api/admin/*`. |\n\nProvider credentials are not required at startup. Configure them later in the embedded console. Models only appear in `/v1/models` after their connection has a saved key.\n\n## Runtime settings\n\n| Variable | Default | Purpose |\n| --- | --- | --- |\n| `OPENSCALER_ADMIN_USERNAME` | `admin` | Administrator console username. |\n| `OPENSCALER_LISTEN_ADDR` | `:8080` | HTTP listen address. |\n| `OPENSCALER_LAN_LISTEN_ADDR` | empty | Optional second listener using one explicit LAN IP and port, for example `192.168.1.25:8080`. Unspecified addresses such as `0.0.0.0` are rejected. |\n| `OPENSCALER_PUBLIC_URL` | empty | Client-reachable gateway origin shown in the console, for example `http://192.168.1.25:8080` or an internal HTTPS URL. |\n| `OPENSCALER_DATABASE_PATH` | `/data/openscaler.db` | SQLite path. |\n| `OPENSCALER_MASTER_KEY_PATH` | `/data/keys/master.key` | Master key stored separately from SQLite. Generated with mode `0600` on first start. |\n| `OPENSCALER_MASTER_KEY` or `_FILE` | empty | Optional externally managed URL-safe base64 encoding of exactly 32 random bytes. |\n| `OPENSCALER_CATALOG_PATH` | `/etc/openscaler/catalog.yaml` | Model catalog path. |\n| `OPENSCALER_REQUEST_TIMEOUT_SECONDS` | `120` | Provider request timeout. |\n| `OPENSCALER_MAX_BODY_BYTES` | `8388608` | Maximum inference request size. |\n| `OPENSCALER_RATE_LIMIT_RPM` | `60` | Per-key requests per minute; `0` disables the RPM limit. |\n| `OPENSCALER_CONCURRENCY` | `8` | Per-key concurrent requests; `0` disables the concurrency limit. |\n| `OPENSCALER_AUTH_DISABLED` | `false` | Explicit local-only authentication bypass. |\n| `OPENSCALER_LOG_PROMPTS` | `false` | Reserved opt-in. Prompt persistence is not implemented. |\n\nThe console uses HTTP Basic authentication for its management API. The default local development login used by `scripts/dev.sh` is username `admin` and password `openscaler`. `scripts/install.sh` generates a random production password in `secrets/admin_password.txt` instead. Existing installations may temporarily continue using `OPENSCALER_MANAGEMENT_TOKEN` as the administrator password while migrating.\n\n## Client API keys\n\nUse **API keys** in the top navigation to create credentials for applications calling `/v1/*`:\n\n- Keys can be created and revoked independently; their full value is shown only once.\n- SQLite stores only a SHA-256 hash, prefix, label, creation time, and last-used time for each managed key.\n\nThe console intentionally presents a flat key list. The current database retains an internal key-owner record for backward-compatible storage, but users do not need to create or manage that record.\n\nKeys configured through `OPENSCALER_API_KEYS` or `OPENSCALER_API_KEYS_FILE` remain bootstrap credentials and are not listed in the API access page. They are retained for installation and backward compatibility; managed keys are recommended for normal workloads.\n\nThe standard start script detects the host's active LAN address, publishes port `8080` on that address, and sets `OPENSCALER_PUBLIC_URL` to an address other machines can reach. Override `OPENSCALER_BIND_ADDRESS` and `OPENSCALER_PUBLIC_URL` when using a fixed private DNS name, reverse proxy, VPN address, or internal load balancer.\n\nPort `5173` is only the Vite development server for the web console. It proxies browser development requests to the Go service and must never be advertised as the inference endpoint. Client applications use the Go gateway at the configured `OPENSCALER_PUBLIC_URL`, normally `http://<host-lan-ip>:8080/v1`.\n\n## Provider connections\n\nThe normal setup path is the console's **Models** workspace. Select an exact model ID and configure one of the endpoints displayed on the right. Official provider protocol, endpoint, authentication, and model settings are seeded into SQLite on first start. Entering or replacing an API key does not perform a network request; the connection is initially marked `unverified`.\n\nCustom endpoints support the OpenAI-compatible and Anthropic Messages protocols. HTTPS is required unless the user explicitly allows HTTP for a trusted local endpoint.\n\nFor migration only, `OPENSCALER_<PROVIDER>_API_KEY`, its `_FILE` variant, and `OPENSCALER_<PROVIDER>_BASE_URL` are still accepted for built-in provider IDs. A legacy key is imported only when the database does not already contain one. New deployments should use the console.\n\nProvider secrets are encrypted with AES-256-GCM using per-secret random nonces and provider-bound associated data. The API never returns a stored credential. Losing the master key makes encrypted Provider API keys unrecoverable, so back it up separately and securely.\n\n## Model catalog\n\n`config/catalog.yaml` is a versioned seed catalog. Provider and model runtime configuration is copied into SQLite on first start and can then be changed without restarting the process. A model is available only when:\n\n1. It exists in the catalog.\n2. Its capability includes the requested endpoint.\n3. Its provider connection is enabled and has a configured key.\n\nThe top-level `families` list is discovery metadata for the console's publisher → family hierarchy. Each family references its official `provider`, so the console can show the publisher-operated endpoint even before an exact model ID is configured. The gateway exposes unified text, image, embeddings, rerank, video, speech, and transcription entry points. A family with `routeable: false` still requires a provider-specific protocol or resource endpoint (for example music or moderation). It remains visible for catalog completeness, but it is never advertised by `/v1/models` and cannot receive traffic until an exact model route and compatible adapter exist.\n\n## Same-model endpoint routing\n\nMultiple connections can publish the same exact **model ID**. The main workspace groups those endpoints together and displays their order, provider, address, price metadata, and readiness.\n\n| Setting | Meaning |\n| --- | --- |\n| Priority | Lower numbers are attempted before higher numbers. The default is `100`. |\n| Weight | Relative traffic share among available routes at the same priority. The default is `100`. |\n\nThe exact model ID is the aggregation key. To attach a third-party endpoint, configure it with the same model ID; its provider-specific upstream identifier may differ. Endpoint routing must never substitute a different model ID.\n\nUse **Route settings** beside the selected exact model ID to enable or exclude endpoints and select one explicit routing mode. **Sequential failover** uses the dragged top-to-bottom order and sends normal traffic to the first endpoint; the next endpoint is attempted only after a retryable failure. **Weighted traffic distribution** places all participating endpoints in one routing group and uses their relative weights for the initial request choice—for example, `70 / 30` targets approximately 70% / 30% over time. If the selected endpoint fails, the remaining endpoint is still attempted within the same request. Order and weight are intentionally not active at the same time.\n\nEnabling **Use platform default strategy** transparently ranks participating endpoints using price (45%), observed request availability (35%), latency EWMA (15%), and the selected regional preference (5%). With no observations, an endpoint starts with a neutral availability prior and a 500 ms latency prior. A zero price is treated as unknown—not free—and receives a conservative neutral price score. The score, availability, and observed latency are returned by the management API and displayed in the console; the selected model ID never changes. **Global** is region-neutral, while Asia Pacific, United States, Europe, and Local give matching endpoints a small advantage without preventing cross-region failover.\n\nAutomatic failover advances on connection and timeout errors and on upstream HTTP `401`, `403`, `408`, `429`, and `5xx` responses. Other client errors are returned directly because retrying the same invalid request against another provider can hide a request problem. The gateway does not persist or replay prompts beyond the current HTTP request.\n\nSuccessful inference responses include `X-OpenScaler-Provider` and `X-OpenScaler-Route-Priority`, and request records identify the provider that ultimately served each request.\n\nThird-party endpoint input and output prices are configured in USD per one million tokens and feed both cost estimates and the default score. Price fields are local estimates, not provider invoices. Verify prices and model limits before production deployment.\n\n## Persistence and backups\n\nLocal development uses `data/openscaler.db`; Docker uses `/data/openscaler.db` in the persistent `openscaler_data` volume. Configuration changes take effect from SQLite and survive process or container restarts. The YAML catalog remains seed data and does not overwrite operator configuration on every start.\n\nBack up SQLite together with the matching master encryption key before upgrades. See [Data and storage](DATA_AND_STORAGE.md) for stored fields, non-persisted prompt data, consistent backup, restore, reset, and schema migration details.\n\n## Optional supply publication\n\n`OPENSCALER_SUPPLY_ENABLED` defaults to `false`. Set it to `true` to enable local supply management and dedicated inference paths. See [Supply Connector](SUPPLY_CONNECTOR.md) for explicit consent, endpoint reservation, credentials and durable quotas.\n",g=`# OSS console workspace

The console opens on the workspace dashboard. Its navigation follows shared inference resources, private gateway operations, and optional Cloud supply.

- **Workspace:** configured model / endpoint counts, locally recorded request count, local supply state, and actions for private API use or creating supply.
- **Inference resources:** Service connections directly displays the publisher / family / model catalog with connected status and endpoint configuration. A single Connect self-hosted / compatible API action opens the custom endpoint wizard. Models & routing uses the same publisher / family / model layout, scoped to connected resources, with endpoint details, allocation, routing settings and supply creation. These services must already expose a running inference API.
- **Private gateway:** API & keys reuses the existing local API user/key management. Requests & usage currently displays the gateway's combined local usage records, including supply traffic, with this scope stated in the UI. It is not a private-only billing report.
- **Cloud supply:** My supply shows local offers, with creation split into model/endpoints, source/authorization, capacity/pricing and review. Creating a draft does not enable admission or submit it to Cloud. Supply requests exposes per-offer receipts and the existing reconciliation operation.
- **Cloud connection:** explains the existing Chat draft adapter and links to its instructions. Remote application, listing and settlement state is not read by the current console; it is explicitly shown as unsynchronized. No automatic listing or delisting is implied.
- **System:** Runtime status separates process/database health from request records. Documentation & help is a dedicated console page with categorized search and rendered guides, tables and code blocks. Guides are bundled into a separately loaded frontend module, and relative guide links and section anchors stay inside the console.

The desktop sidebar collapses into a menu on narrow screens. New workspace and wizard text is Chinese/English; other selected languages fall back to English for the new workspace text. Existing localized API, catalog and provider editors are retained.

## Local verification (2026-09-13)

- TypeScript and Vite production build.
- Browser checks of dashboard, resource catalog, all navigation destinations, service-source chooser, and 390px mobile navigation/layout.
- An isolated browser fixture exercised missing-endpoint validation, capability selection, all four draft steps, back/next input preservation, the distinct review/submit actions, and the complete submitted JSON body. It used synthetic data and an in-memory request adapter; no gateway supply or provider records were created. Temporary fixture removed after verification.

## Shared typography

All console views and dialogs use one UI font stack with explicit CJK fallbacks. Semantic size tokens define page titles (24px), section titles (18px), card titles (16px), body text (14px), descriptions and controls (13px), and metadata (12px). Headings use weight 600; explanatory text uses 400. Code retains a shared monospace stack. Decorative logo glyphs and chart ticks are separate from prose roles.

Help routes support direct links such as \`#help/API\` and \`#help/README?section=install-and-start\`. The reader renders Markdown without raw HTML and bundles only public operator guides, security, support and contribution documents. The original document language is retained.
`,_=`# Data and storage

The OpenScaler self-hosted runtime uses SQLite as its source of truth. It does not require PostgreSQL, Redis, or a hosted account.

## Database locations

| Environment | Database |
| --- | --- |
| Local source development | \`data/openscaler.db\` |
| Docker Compose | \`/data/openscaler.db\` inside the \`openscaler_data\` named volume |
| Custom binary deployment | \`OPENSCALER_DATABASE_PATH\` |

SQLite WAL mode is enabled. A running database may therefore have \`-wal\` and \`-shm\` companion files. Do not copy only the main file while writes are active.

## What is stored

- Official and third-party provider connections.
- Public model definitions and provider-specific upstream model IDs.
- Endpoint priority, weight, capability, and enabled state.
- Per-model routing mode, endpoint participation, priority, weight, and regional preference.
- Internal API-key ownership records and key enabled state.
- Managed Gateway API-key labels, prefixes, SHA-256 hashes, creation time, and last-used time.
- Request metadata including request ID, model, serving provider, status, token counts, latency, and local estimated cost.
- Provider API keys as AES-256-GCM ciphertext with unique nonces.

## What is not stored

- Prompt or response bodies.
- Plaintext managed Gateway API keys; the full value is returned once when a key is created.
- Plaintext provider credentials.
- Administrator passwords in SQLite.
- Browser session credentials outside the current browser tab.
- OpenScaler Cloud account, balance, payment, or telemetry data.

Bootstrap Gateway API keys and the administrator password are file-backed secrets created by the installer under \`secrets/\`. They are mounted into the container and are intentionally separate from SQLite.

## Encryption key

Provider credentials are encrypted with the master key at \`/data/keys/master.key\` by default. The key is not stored in SQLite. A database backup without the matching master key cannot decrypt provider credentials; a host compromise containing both files can.

Back up the database and master key separately and protect them with different access controls. Never commit either file.

## Backup and restore

For a consistent single-node backup, stop the gateway first:

\`\`\`bash
./scripts/stop.sh
\`\`\`

Back up both the Docker volume data and master key, then restart with:

\`\`\`bash
./scripts/start.sh
\`\`\`

For local source development, copy \`data/openscaler.db\` and the configured master-key file while the development process is stopped. Restore both files to their original paths and permissions before starting the same or a compatible newer version.

Test restores regularly. A backup is not complete unless provider credentials can still be decrypted and \`/readyz\` reports ready.

## Resetting local state

Stopping a process does not delete its database. To create a clean local development state, stop OpenScaler and move \`data/openscaler.db\` plus any \`-wal\` and \`-shm\` files to a recoverable backup location. The next start creates a new database and seeds the current catalog.

Removing a Docker volume permanently deletes configuration, API keys, usage history, and encrypted credentials. Treat volume removal as destructive and make a backup first.

## Schema upgrades and retention

Schema migrations run automatically during startup and are designed to preserve existing data. Back up before upgrading. The self-hosted edition currently keeps usage metadata until the operator removes or archives it; it does not persist prompts or responses.
`,v="# Development guide\n\n## Prerequisites\n\n- Go 1.24 or newer.\n- Node.js 22 and npm for the console build.\n- Docker Engine and Docker Compose v2 for container validation.\n- A supported macOS or Linux development environment.\n\n## Start the development environment\n\n```bash\n./scripts/dev.sh\n```\n\nThe script starts:\n\n- Go gateway and management API at `http://127.0.0.1:8080`.\n- Vite development console at `http://127.0.0.1:5173`.\n- Hot module replacement for React and TypeScript changes.\n- Vite proxies for `/api`, `/v1`, `/healthz`, `/readyz`, and `/metrics` to Go.\n\nPort `5173` is only a frontend development server. Applications call the gateway on port `8080`; `OPENSCALER_PUBLIC_URL` defines the LAN-reachable inference address.\n\nThe default development administrator is `admin` / `openscaler`. Development data is persisted in `data/openscaler.db` and remains after a restart.\n\n`scripts/dev.sh` refuses to start a second backend when the configured address already serves OpenScaler. Stop the existing process and reuse port `8080` rather than accidentally testing against two different databases.\n\n## Build and test\n\n```bash\nnpm --prefix frontend ci\nnpm --prefix frontend run build\ngofmt -w cmd internal\ngo vet ./...\ngo test ./...\ngo build ./cmd/openscaler\n```\n\nThe common backend checks are also available as:\n\n```bash\nmake check\n```\n\nThe frontend production build is written to `internal/webui/dist` and embedded into the Go binary. Node.js is not required at runtime.\n\n## Source layout\n\n| Path | Responsibility |\n| --- | --- |\n| `cmd/openscaler` | Process entry point and healthcheck command. |\n| `internal/gateway` | HTTP routing, authentication orchestration, management API, and inference proxy. |\n| `internal/router` | Exact-model priority, weight, platform scoring, and failover resolution. |\n| `internal/provider` | Upstream HTTP and protocol adapters. |\n| `internal/store` | SQLite schema, configuration, API users, keys, and usage records. |\n| `internal/secret` | Master-key handling and provider-credential encryption. |\n| `frontend` | Vite, React, and TypeScript management console. |\n| `internal/webui/dist` | Generated embedded console assets. |\n| `config/catalog.yaml` | Versioned provider/model seed catalog. |\n| `scripts` | Install, development, lifecycle, build, and example helpers. |\n| `deploy` | Docker Compose deployment definition. |\n\n## Adding a provider or model\n\nUse an official provider contract. Add seed metadata to `config/catalog.yaml`, keep the Public Model ID distinct from the upstream provider ID, specify only supported capabilities, and add catalog/router/provider tests. Prices are estimates and must be documented as such.\n\nThird-party and local OpenAI-compatible endpoints normally do not require source changes; add them from the **Models** workspace.\n\n## Pull requests\n\nKeep changes focused, do not include generated databases or secrets, update English documentation for user-visible behavior, add translations for console strings, and include tests proportional to the request-path risk. See [Contributing](../CONTRIBUTING.md).\n",y=`# Migration to OpenScaler OSS

> 2026-09-13 update: OSS-side Supply Connector v1 and a Cloud draft adapter are implemented. Current capabilities, limits and acceptance boundaries are maintained in [Supply Connector](SUPPLY_CONNECTOR.md). Earlier planning/migration descriptions below are historical and do not imply Cloud approval or production release.

2026-09-06. This directory contains the independent self-hosted gateway migrated from the current working tree of OpenSwiftScale-OSS, including uncommitted source changes. The original checkout is unchanged. \`source-manifest.json\` records each input file's SHA-256 and destination; generated console assets are rebuilt from frontend source.

## Branding and compatibility

The product is **OpenScaler OSS — by SwiftScale**: **Connect and manage inference capacity.** Cloud uses **Buy and sell inference capacity.** SwiftScale retains its enterprise brand and product responsibilities.

| Surface | Current name |
| --- | --- |
| Go module | \`github.com/swift-scale-ai/openscaler-oss\` |
| Command and executable | \`cmd/openscaler\`, \`openscaler\` |
| Frontend package | \`@openscaler/console\` |
| Environment variables | \`OPENSCALER_*\` (including provider keys and \`_FILE\` secrets) |
| Response headers | \`X-OpenScaler-*\` |
| Metrics and error prefix | \`openscaler_*\` |
| Default database | \`/data/openscaler.db\` |
| Default catalog | \`/etc/openscaler/catalog.yaml\` |
| Compose project and local image | \`openscaler-oss\` |

Browser storage keys, UI text, logo accessibility text, examples and scripts use the new brand. Old environment names, headers and browser sessions are not aliases. Existing installations must explicitly map configuration, monitoring and integrations before switching. This migration creates no production cutover and moves no database, encrypted provider keys, master key, environment file, or user credentials. A database restore requires its matching master key and a separately reviewed backup/restore plan; a name change alone does not transfer state.

The original \`LICENSE\` (Apache-2.0) and \`NOTICE\` are retained byte-for-byte, including historical names and copyright. Third-party services, model names and SwiftScale's identity remain unchanged. Modified files are documented by this migration notice and the source manifest; the manifest describes original inputs, not hashes of transformed outputs.

## Standalone operation and product boundary

The migrated runtime remains a single Go process with embedded console and local SQLite. It retains model catalog, BYOK, local encrypted provider credentials, revocable Gateway API keys, same-model endpoint routing/failover, protocol adapters, usage metadata, health and metrics. It has no Cloud account, license server, payment ledger, supplier payout or mandatory telemetry dependency. Configured inference providers may require network access; standalone does not mean remote inference works offline.

Supply Connector is **not implemented**. Explicit service/capacity publication, authorization scope, market/private quota isolation, withdrawal and in-flight request accounting require separate implementation and acceptance. Installing OSS does not publish resources. Bare GPU deployment, enterprise SSO/governance, dynamic pricing and Spot are not implied by migration. Regional routing preferences are scoring preferences, not enforced data-residency constraints. Cloud trading, provenance verification and payment boundaries remain separate.

The parent workspace's \`docs/POSITIONING.md\`, \`BRAND_ARCHITECTURE.md\`, \`PRODUCT_SPEC.md\` and \`IMPLEMENTATION_ROADMAP.md\` govern these boundaries. Standalone copies of the relevant product guidance are [Product](PRODUCT.md), [Cloud relationship](CLOUD_RELATIONSHIP.md) and [Architecture](ARCHITECTURE.md).

## Local build and release

Run \`./scripts/start.sh\` from the OSS directory to create fresh credentials and build/start the local Compose image. \`./scripts/dev.sh\` runs the native development gateway and Vite console. \`./scripts/build.sh\` builds the embedded frontend and standalone binary. Build tools require Go 1.24+ and a Node version supported by the locked Vite toolchain (Node 22.12+ in the 22.x line).

Console documentation links resolve locally under \`/docs/\` as bundled plain-text Markdown; they do not require GitHub or Cloud. Only the public Markdown guides are embedded there.

The new remote repository and GHCR names are intended release targets, not evidence of published resources. CI and release workflows assume this directory becomes its own repository root. Local Compose builds from this checkout and does not download a presumed new-brand image. No remote repository, release, domain or deployment was created during migration.

## Verification

\`\`\`bash
npm --prefix frontend ci --no-audit --no-fund
npm --prefix frontend run build
go mod verify
go vet ./...
go test -race ./...
go build -trimpath -o dist/openscaler ./cmd/openscaler
docker compose -f deploy/compose.yaml config --quiet
docker build -t openscaler-oss:local .
\`\`\`

Source and boundary checks: \`python3 scripts/verify-migration.py\`. It validates input hashes when the original checkout is available, destination presence, preserved notices, source brand identifiers and absence of cross-component Go imports. The parent workspace's \`docs/OSS_MIGRATION.md\` records the actual acceptance results and limitations.
`,b=`# Open-source policy

> 2026-09-13 update: OSS-side Supply Connector v1 and a Cloud draft adapter are implemented. Current capabilities, limits and acceptance boundaries are maintained in [Supply Connector](SUPPLY_CONNECTOR.md). Local implementation does not imply Cloud approval or production release.

OpenScaler is free and open-source software licensed under the Apache License 2.0. It remains independently useful without a hosted account, commercial license, external control plane, or mandatory telemetry.

## What the license permits

Subject to the full [Apache License 2.0](../LICENSE), users may use, reproduce, modify, distribute, and create derivative works from the source, including for commercial and internal purposes. The license also includes the patent grant and redistribution conditions stated in the license text.

This document is explanatory and does not replace the license.

## Open-source guarantees

The open-source edition does not impose product-level limits on requests, tokens, providers, keys, endpoint pools, or local deployments. The public repository includes:

- OpenAI-compatible inference APIs.
- Direct provider and local compatible endpoints.
- Directly managed, revocable Gateway API keys.
- Transparent same-model endpoint ordering and automatic failover.
- Local usage metadata, estimated cost, latency, and health information.
- Embedded multilingual management console.
- SQLite persistence, Docker deployment, and CI/release definitions. New-brand release binaries, public images, SBOMs and provenance are generated only when a configured release workflow runs successfully.

OpenScaler Cloud uses the same brand, model hierarchy, exact-model routing behavior, and API contract. The products have complementary responsibilities, not a free/paid or feature-superset relationship. Cloud owns market accounts, trading and settlement; the self-hosted runtime has no mandatory Cloud dependency. The optional Supply Connector is implemented locally; its Cloud integration and limits are documented in [Supply Connector](SUPPLY_CONNECTOR.md).

## Contributions

Contributions intentionally submitted to this repository are accepted under Apache-2.0 unless explicitly stated otherwise. Contributors retain copyright in their work while granting the rights described by the project license. See [Contributing](../CONTRIBUTING.md) before opening a pull request.

No contributor should submit code, documentation, model metadata, or test data they do not have the right to license.

## Trademarks and branding

The Apache license does not grant trademark rights. “OpenScaler”, its product logos, and related branding identify their respective owners. Forks may accurately describe their origin and retain legally required notices, but should not imply endorsement or official status. Use a distinct name and branding for a redistributed product unless permission has been granted.

## Third-party software and model services

Dependencies keep their own licenses and notices. Model weights, provider APIs, SDKs, model names, and service terms are not relicensed by this repository. Operators are responsible for reviewing provider terms, data-processing rules, regional restrictions, model licenses, and pricing.

OpenScaler does not sell model credits and does not make an unavailable or restricted model open source merely by listing compatible metadata.

## Security and support

Apache-2.0 software is provided without warranty. Report vulnerabilities privately as described in [Security](../SECURITY.md). Questions and reproducible bugs may be filed through GitHub Issues.
`,x=`# Operations guide

## Install and start

\`\`\`bash
./scripts/install.sh
./scripts/start.sh
\`\`\`

The installer validates Docker, creates bootstrap credentials, and prepares local configuration. The start script launches Docker Compose, waits for health, detects an active LAN address, and prints the console and internal Gateway API addresses.

Useful lifecycle commands:

\`\`\`bash
./scripts/logs.sh
./scripts/stop.sh
./scripts/start.sh
\`\`\`

Users do not need to invoke \`docker compose\` directly.

## First configuration

1. Sign in with the administrator account printed by the installer. For local source development, the default login is username \`admin\` and password \`openscaler\`.
2. Open **Models**, select an exact model ID, and configure at least one official or third-party endpoint with its provider API key.
3. If the model has multiple endpoints, open **Route settings** and choose platform default, sequential failover, or weighted distribution.
4. Open **API access**, create an API user, and issue a Gateway API key.
5. Select local or LAN access, then copy the API base URL and a callable model ID.
6. Test with one of the built-in cURL, Python, Go, Node.js, Java, or Rust examples.

## Networking

The inference and management service listens on port \`8080\`. \`scripts/start.sh\` publishes it on the detected host LAN address. Set these explicitly for private DNS, VPNs, reverse proxies, or internal load balancers:

\`\`\`bash
export OPENSCALER_BIND_ADDRESS=192.168.1.25
export OPENSCALER_PUBLIC_URL=https://ai-gateway.internal.example.com
./scripts/start.sh
\`\`\`

Terminate TLS at a trusted reverse proxy or ingress before allowing traffic across hosts. Restrict management access more tightly than inference access. Port \`5173\` is only used by Vite during source development.

## Health and observability

- \`GET /healthz\`: process health.
- \`GET /readyz\`: database readiness.
- \`GET /metrics\`: Prometheus-format operational metrics.
- **Runtime monitoring**: compact process health plus paginated recent request metadata without prompt bodies.

Estimated cost is derived from locally configured model prices and reported token counts. It is not a provider invoice.

## Upgrades

1. Read release notes and back up SQLite plus the master key.
2. Pull the desired image tag or source version.
3. Run \`./scripts/start.sh\` to recreate the container using the persistent volume.
4. Check \`/readyz\`, configured routes, callable models, and a real inference request.

Pin a version or image digest in production rather than relying on \`latest\`. Schema migrations run at startup; do not downgrade a production database without a tested restore plan.

## Failure recovery

- A missing provider key makes its routes unavailable but does not stop the gateway.
- A disabled API user blocks all keys owned by that user.
- A lost managed Gateway API key cannot be recovered; revoke it and create another.
- A lost master key makes encrypted provider credentials unrecoverable; restore the matching key or enter credentials again.
- If port \`8080\` is already serving OpenScaler, stop that instance rather than starting a second gateway on a different port unintentionally.

See [Data and storage](DATA_AND_STORAGE.md) and [Security](../SECURITY.md) for backups and production hardening.
`,S=`# OpenScaler product design

> 2026-09-13 update: OSS-side Supply Connector v1 and a Cloud draft adapter are implemented. Current capabilities, limits and acceptance boundaries are maintained in [Supply Connector](SUPPLY_CONNECTOR.md). Local implementation does not imply Cloud approval or production release.

## Product statement

OpenScaler OSS is a free, open-source, self-hosted AI inference gateway with an opt-in Supply Connector, serving developers, internal enterprise users, and inference operators. It provides one OpenAI-compatible endpoint while making the complete request path understandable: model publisher, model family, exact model ID, and every endpoint capable of serving it. The OSS connector is implemented locally; remote market qualification and production acceptance remain separate.

OpenScaler — by SwiftScale is the open-source and marketplace brand; SwiftScale retains enterprise governance and private deployment services. The OSS runtime is independent. It does not require a hosted account, license server, external control plane, or mandatory telemetry.

## Product forms

OpenScaler has two product forms:

- **OSS / Self-hosted:** an independent gateway on infrastructure the operator controls; an implemented, opt-in Supply Connector standardizes selected authorized services and capacity for the Cloud market.
- **OpenScaler Cloud:** an open AI inference service marketplace connecting users with individual and business suppliers. Users select services by capabilities, price, stability, latency, and region; Cloud manages routing, metering, and settlement, adding 5% to supplier service prices.

Suppliers can submit a compatible API directly. Company registration and installation of the open-source gateway are not prerequisites. Individuals use verified accounts in their own name; businesses use verified business accounts, subject to payment-channel eligibility. The OSS connector and Cloud draft adapter are implemented; supplier payout and remote listing lifecycle remain Cloud responsibilities. See [Cloud relationship](CLOUD_RELATIONSHIP.md).

There is no OpenScaler Enterprise or Dedicated edition. Organization governance and private deployment platform features belong outside the OpenScaler product line so the open-source and Cloud experiences can remain small, consistent, and developer-focused.

**OSS: Connect and manage inference capacity. / Cloud: Buy and sell inference capacity.** The products have complementary responsibilities, not a free/paid or feature-superset relationship. Existing APIs can join Cloud without OSS. Enterprise use does not imply enterprise governance features. See [Cloud relationship](CLOUD_RELATIONSHIP.md) for supply provenance, consent, isolation, and roadmap boundaries.

## Design principles

1. **Useful in three minutes.** Install, add one provider key, create one Gateway API key, test, and finish.
2. **One resource workspace, two uses.** The home workspace presents private gateway operations and optional Cloud supply. Connected services and models are the default resource views; the complete publisher → family → exact model ID → endpoints catalog remains available for discovery and configuration.
3. **The requested model is immutable.** Routing may select another endpoint for the same exact model, but must never silently substitute a different model.
4. **Simple defaults, visible control.** OpenScaler chooses a sensible endpoint order; users may override that order without learning a routing language.
5. **Local control is real.** Credentials, request metadata, and operational records stay inside the user-selected network path.
6. **Small default footprint.** One process, one container, embedded UI, and SQLite.
7. **Protocols before proprietary SDKs.** OpenAI-compatible HTTP is the primary client contract.
8. **Secure defaults.** Separate data-plane and management credentials, no prompt logging, no telemetry, and a non-root container.

## Target users

- Individual developers using several commercial, open-weight, or local model providers.
- Small product teams that need one inexpensive internal AI endpoint.
- Developers who want to understand exactly which provider endpoint served a request.
- Enterprise teams operating an internal gateway without requiring Cloud participation.
- Professional inference operators standardizing their services, with optional selective supply publication through the local connector.

Organization hierarchies, SSO/SCIM, approval workflows, compliance suites, and fleet management are intentionally outside this product.

## Open-source scope

- Direct provider connections and BYOK.
- A model catalog organized by publisher, family, exact model ID, and endpoint.
- Same-model endpoint ordering and failover with no cross-model substitution.
- Unified chat, responses, embeddings, image generation, reranking, video generation, speech synthesis, transcription, and model discovery APIs.
- Streaming, tool calls, structured-output pass-through, and provider error handling.
- Independently revocable, hash-only Gateway API keys and separate administrator authentication.
- Local request metadata, Token usage, estimated cost, latency, and serving endpoint.
- Embedded web console, health, readiness, and Prometheus metrics.
- Docker Compose and multi-architecture release artifacts.
- Multilingual onboarding and concise SDK examples.

## Explicit non-goals

- Selling bare GPUs, accounts, API keys, or unverified transferable quotas; available hardware must first become a licensed, validated inference service.
- Automatically publishing private resources or requiring Cloud for standalone use.
- Semantic task classification or automatic model selection.
- Virtual model aliases that route across different model IDs.
- Organization-wide identity, policy, compliance, or multi-organization administration.
- Embedding a public trading, credit-wallet, or supplier-payment system in the self-hosted runtime; optional service publication uses Cloud's separate marketplace.
- Requiring any model aggregator or Cloud account; an operator may explicitly configure a compatible upstream of their choice.
- Storing prompts or responses by default.
- Claiming support for a model without a verifiable provider contract.

## Open-source and Cloud consistency

The self-hosted gateway and Cloud marketplace share the OpenScaler brand, transparent model hierarchy and exact-model routing principle, without requiring identical features or navigation. Cloud owns public trading, accounts, payments, supplier onboarding and settlement. The open-source runtime remains independent. Connecting to Cloud as a consumer or exposing selected services as a supplier is optional; suppliers using other software can participate equally.

## Success criteria

- First request in under three minutes after Docker is available.
- A new user can understand the main screen without reading routing documentation.
- Every request record identifies the requested model and serving endpoint.
- The gateway never changes the exact requested model ID during failover.
- Idle memory target below 100 MB for the default process.
- Gateway processing overhead target below 5 ms p95, excluding provider time.
- No outbound network calls except providers explicitly configured by the operator.
`,C=`# OpenScaler documentation

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

\`\`\`text
Application
    │  OpenAI-compatible request + Gateway API key
    ▼
OpenScaler
    │  exact model ID → eligible endpoints → selected endpoint
    ▼
Official provider / third-party provider / local inference service
\`\`\`

It is designed around four visible levels:

1. **Model publisher** — for example Alibaba, Anthropic, Google, Meta, Microsoft, NVIDIA, or OpenAI.
2. **Model family** — for example Qwen, Wan, Claude, Gemini, Llama, Phi, or GPT.
3. **Exact model ID** — the stable value your application sends in the \`model\` field.
4. **Endpoints** — one or more official, third-party, regional, or local services capable of serving that exact model ID.

OpenScaler may select another healthy endpoint for the same exact model ID. It never silently replaces the model selected by the developer with a different model.

The self-hosted edition is not a public marketplace or credit wallet; it connects to operator-configured endpoints and requires no SwiftScale or Cloud account. OpenScaler Cloud is a separate inference service marketplace open to individual and business suppliers. Suppliers need not install this gateway. See [Cloud relationship and optional integration](CLOUD_RELATIONSHIP.md).

OpenScaler is offered as an open-source self-hosted gateway and as OpenScaler Cloud. There is no Enterprise or Dedicated edition; organization governance, SSO/SCIM, compliance suites, and fleet management are outside its developer-focused scope.

## What it can do

### One API for multiple inference types

| Capability | Gateway endpoint |
| --- | --- |
| Model discovery | \`GET /v1/models\` |
| Chat completions | \`POST /v1/chat/completions\` |
| Responses API | \`POST /v1/responses\` |
| Embeddings | \`POST /v1/embeddings\` |
| Image generation | \`POST /v1/images/generations\` |
| Reranking | \`POST /v1/rerank\` |
| Video generation | \`POST /v1/videos\` |
| Speech synthesis | \`POST /v1/audio/speech\` |
| Audio transcription | \`POST /v1/audio/transcriptions\` |

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
- Use weighted traffic distribution such as \`70 / 30\` across healthy endpoints.
- Include or exclude individual endpoints without deleting them.
- Inspect the provider and route selected for completed requests.

### Local access and observability

- Create independently revocable Gateway API keys for applications and CI.
- View recent request metadata, token usage, latency, estimated cost, and serving endpoint.
- Check process health and database readiness.
- Export Prometheus metrics from \`/metrics\`.
- Run without telemetry or prompt persistence by default.

## How it works

### Management and inference credentials are different

| Credential | Used for | Storage |
| --- | --- | --- |
| Administrator account | Console and \`/api/admin/*\` | Configured at installation |
| Gateway API key | Application requests to \`/v1/*\` | Only a SHA-256 hash is stored for managed keys |
| Provider API key | OpenScaler requests to an upstream provider | Encrypted in SQLite with a separate master key |

Never use the administrator password or a provider API key in client applications.

### Local persistence

SQLite is the default and currently supported database. It stores provider configuration, encrypted provider credentials, managed Gateway API-key hashes, routing settings, and request metadata. Prompt and response bodies are not stored.

The official catalog in [\`config/catalog.yaml\`](../config/catalog.yaml) seeds publisher, family, model, endpoint, capability, and pricing metadata. Updating OpenScaler can add catalog entries; local API keys and custom endpoints remain in SQLite and are not committed to GitHub.

See [Data and storage](DATA_AND_STORAGE.md) for backup, restore, retention, and reset procedures.

## Install and start

### Requirements

- Docker Engine or Docker Desktop
- Docker Compose v2
- OpenSSL for first-run credential generation

### Console login

| Environment | Username | Password |
| --- | --- | --- |
| Local source development with \`./scripts/dev.sh\` | \`admin\` | \`openscaler\` |
| Standard installation with \`./scripts/install.sh\` | \`admin\` | Random password printed by the installer and saved in \`secrets/admin_password.txt\` |

The default local development login is therefore **\`admin\` / \`openscaler\`**. Change or override it before exposing the console beyond a trusted development machine.

### Standard installation

\`\`\`bash
cd openscaler-oss
./scripts/install.sh
./scripts/start.sh
\`\`\`

The installer creates local credentials under \`secrets/\`. The start script launches the container, waits for readiness, detects the host LAN address, and prints both the console and Gateway API addresses.

Open the console at the address printed by \`scripts/start.sh\` and sign in with the administrator username and password printed by \`scripts/install.sh\`.

Useful lifecycle commands:

\`\`\`bash
./scripts/logs.sh
./scripts/stop.sh
./scripts/start.sh
\`\`\`

For source development with automatic frontend updates:

\`\`\`bash
./scripts/dev.sh
\`\`\`

The development console runs at \`http://127.0.0.1:5173\`; the Go gateway remains the inference server on port \`8080\`. Sign in with the default development account: username \`admin\`, password \`openscaler\`.

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

\`\`\`bash
export OPENSCALER_URL="http://127.0.0.1:8080/v1"
export OPENSCALER_API_KEY="<gateway-api-key>"

curl "$OPENSCALER_URL/models" \\
  -H "Authorization: Bearer $OPENSCALER_API_KEY"
\`\`\`

Use a returned \`id\` exactly as shown. A catalog entry without an enabled, authenticated, compatible endpoint is not advertised as callable.

## Call the Gateway API

All inference requests use the Gateway API key:

\`\`\`http
Authorization: Bearer <gateway-api-key>
\`\`\`

Replace \`your-model-id\` with a callable ID from \`GET /v1/models\` or the console.

### cURL

\`\`\`bash
curl "$OPENSCALER_URL/chat/completions" \\
  -H "Authorization: Bearer $OPENSCALER_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "your-model-id",
    "messages": [{"role": "user", "content": "Explain transparent AI routing."}],
    "stream": false
  }'
\`\`\`

### Python

\`\`\`python
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
\`\`\`

### Node.js

\`\`\`javascript
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
\`\`\`

### Go

\`\`\`go
package main

import (
    "bytes"
    "fmt"
    "io"
    "net/http"
)

func main() {
    body := []byte(\`{"model":"your-model-id","messages":[{"role":"user","content":"Hello"}]}\`)
    request, _ := http.NewRequest("POST", "http://127.0.0.1:8080/v1/chat/completions", bytes.NewReader(body))
    request.Header.Set("Authorization", "Bearer <gateway-api-key>")
    request.Header.Set("Content-Type", "application/json")
    response, err := http.DefaultClient.Do(request)
    if err != nil { panic(err) }
    defer response.Body.Close()
    output, _ := io.ReadAll(response.Body)
    fmt.Println(string(output))
}
\`\`\`

### Java

\`\`\`java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

var request = HttpRequest.newBuilder(
        URI.create("http://127.0.0.1:8080/v1/chat/completions"))
    .header("Authorization", "Bearer <gateway-api-key>")
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(
        "{\\"model\\":\\"your-model-id\\",\\"messages\\":[{\\"role\\":\\"user\\",\\"content\\":\\"Hello\\"}]}"))
    .build();
var response = HttpClient.newHttpClient()
    .send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.body());
\`\`\`

### Rust

\`\`\`rust
let response = reqwest::Client::new()
    .post("http://127.0.0.1:8080/v1/chat/completions")
    .bearer_auth("<gateway-api-key>")
    .json(&serde_json::json!({
        "model": "your-model-id",
        "messages": [{"role": "user", "content": "Hello"}]
    }))
    .send().await?;
println!("{}", response.text().await?);
\`\`\`

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

Healthy participating endpoints receive initial requests according to relative weights. \`70 / 30\` targets approximately 70% and 30% over time. If the initially selected endpoint fails, another eligible endpoint may still be tried for that request.

OpenScaler retries connection and timeout errors and upstream \`401\`, \`403\`, \`408\`, \`429\`, and \`5xx\` responses. Other client errors are returned directly to avoid hiding an invalid request.

## Operate and secure it

### Health and metrics

\`\`\`bash
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:8080/readyz
curl http://127.0.0.1:8080/metrics
\`\`\`

### Network access

- Use \`127.0.0.1\` only for applications on the gateway host.
- Use the displayed LAN address for other trusted devices on the same network.
- Use private DNS and TLS termination for shared or production deployments.
- Restrict the administrator console more tightly than inference access.
- Never expose the default development deployment directly to the public Internet.

### Backups and upgrades

Back up the SQLite database and its matching master encryption key together before upgrading. Pin a release or container digest in production, review release notes, restart with \`scripts/start.sh\`, and verify \`/readyz\`, callable models, routing, and one real inference request.

### Troubleshooting

| Symptom | Check |
| --- | --- |
| A model is absent from \`/v1/models\` | Confirm an endpoint is enabled, has a provider key, supports the capability, and passed validation. |
| \`401 invalid_api_key\` | Use a Gateway API key, not the administrator password or provider key. |
| Provider authentication fails | Re-enter the provider key and run endpoint validation. |
| LAN address is unavailable | Set \`OPENSCALER_PUBLIC_URL\` explicitly or access from \`127.0.0.1\` on the host. |
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
`,w=`# Releases

This checkout contains release definitions, not a published OpenScaler release. Repository and GHCR identifiers below are intended targets and must be configured and verified before publishing. In this workspace use the local Compose build. Workflows assume \`openscaler-oss\` is the root of its own repository.

OpenScaler uses tagged GitHub releases for reproducible open-source distribution. A tag matching \`v*\` starts the release workflow.

## Release outputs

Each successful release publishes:

- statically linked \`openscaler\` archives for Linux and macOS on \`amd64\` and \`arm64\`;
- \`checksums.txt\` for the downloadable archives;
- multi-architecture Linux container images for \`amd64\` and \`arm64\` at \`ghcr.io/swift-scale-ai/openscaler-oss\`;
- image SBOM and build provenance generated by GitHub Actions.

The container workflow publishes the full semantic version, the matching major/minor tag, and \`latest\`. Pin an exact version in production rather than following \`latest\`.

## Creating a release

Maintainers should first verify the release commit:

\`\`\`bash
go test ./...
npm --prefix frontend ci --no-audit --no-fund
npm --prefix frontend run build
\`\`\`

Then create and push an annotated semantic-version tag:

\`\`\`bash
git tag -a v0.1.0 -m "OpenScaler v0.1.0"
git push origin v0.1.0
\`\`\`

The GitHub workflow builds the frontend before packaging the Go binary, runs the Go test suite, creates the GitHub release with GoReleaser, and publishes the container independently. Do not upload locally built files over workflow-produced assets.

## Verifying archives

Download an archive and \`checksums.txt\` from the same GitHub release, then run:

\`\`\`bash
shasum -a 256 -c checksums.txt
\`\`\`

On Linux, \`sha256sum -c checksums.txt\` is equivalent. The checksum file contains every release archive, so warnings about files not downloaded locally may be ignored while a mismatch must not be ignored.

## Verifying container provenance

The release workflow attaches GitHub build provenance to the pushed image digest. Use the GitHub CLI attestation verifier with the expected repository:

\`\`\`bash
gh attestation verify \\
  oci://ghcr.io/swift-scale-ai/openscaler-oss:<version> \\
  --repo swift-scale-ai/openscaler-oss
\`\`\`

Deploy by digest when immutability is required.

## Compatibility and upgrades

- Semantic version tags describe the application release, not provider-model freshness.
- Provider catalogs may evolve between releases; review release notes before upgrading.
- Back up the SQLite database and master key before replacing a running installation.
- Never downgrade a production database unless that downgrade is explicitly documented as safe.

See [Operations](OPERATIONS.md) for the upgrade procedure and [Data and storage](DATA_AND_STORAGE.md) for backups.

## Local release acceptance

Run \`./scripts/release-check.sh\` to build and verify standalone Linux/macOS amd64/arm64 archives and checksums under \`dist/release-local\`. This does not create GitHub releases or upload images. The Supply Connector protocol and external acceptance requirements are in [Supply Connector](SUPPLY_CONNECTOR.md).
`,T="# Supply Connector v1\n\nUpdated 2026-09-13. The OSS side now implements explicit local publication, dedicated endpoint reservation, credentials, time windows, quotas, withdrawal, disconnect and durable request receipts. A command-line adapter submits a selected chat service to the existing Cloud supplier-draft API. Cloud approval, source verification, test consent, real dispatch and payment remain Cloud responsibilities; local publication is not market approval.\n\n## Enable and use\n\nThe feature is **disabled by default** and cannot be enabled alongside `OPENSCALER_AUTH_DISABLED=true`. For the OSS Compose deployment:\n\n```bash\nOPENSCALER_SUPPLY_ENABLED=true ./scripts/start.sh\n```\n\nFor native development, set the same variable before `./scripts/dev.sh`. Existing installations receive additive SQLite tables at startup. A database lock allows only one OSS process per database; this is a single-process self-hosted deployment, not a distributed capacity coordinator.\n\nSign in as the local administrator and open **Supply Connector / 供给接入**. Select an exact model, endpoint IDs, allowed API capabilities, an HTTPS public origin, operator and authorization evidence, declared region, start/end times, concurrency, requests per minute, total request budget and input/output USD-per-million-token prices. Service windows are at most 31 days. Save a draft; a dedicated credential is displayed once and stored only as a hash. Draft creation does not expose inference.\n\nReview the publication consent and explicitly reserve the selected endpoints. Publication removes these endpoint IDs from private routing. Requests already running privately prevent publication until they finish. Another active/draining publication cannot reserve the same endpoint. Keep separately configured endpoints for private traffic. This is gateway-level endpoint isolation: operators must actually provision independent underlying credentials and capacity; duplicate configurations of the same physical upstream cannot establish resource independence. Declared region and evidence are not automatically verified or enforced residency guarantees.\n\nPublication specifications are immutable. Withdraw and create a new draft when changing models, endpoints, time windows, capacity or prices. Changing an upstream URL, protocol path, upstream model or key causes that endpoint's old publication fingerprint to stop matching. Failover stays within the selected exact model and matching authorized endpoints. Credential rotation invalidates the previous supply key without resetting capacity or request budgets.\n\nThe connector currently offers Chinese and English form text; other console locales keep their existing translations and use English for the new form. Navigation labels are translated for all nine console locales.\n\n## API\n\nManagement calls use the existing administrator Basic authentication, under `/api/admin`.\n\n| Method/path | Behavior |\n| --- | --- |\n| `GET /api/admin/supply` | Enabled/disconnected state and latest 200 publications |\n| `POST /api/admin/supply` | Create immutable draft, return one-time dedicated credential |\n| `POST /api/admin/supply/{id}/publish` | Requires `authorize_publication=true` and `reserve_selected_endpoints=true` |\n| `POST /api/admin/supply/{id}/withdraw` | Stop new admissions; retain in-flight capacity until completion/reconciliation |\n| `POST /api/admin/supply/{id}/rotate-key` | Return replacement one-time credential for draft/active offer |\n| `GET /api/admin/supply/{id}/manifest` | Selected public metadata only, without upstream URLs, provider keys, endpoint fingerprints or local catalog |\n| `GET /api/admin/supply/{id}/receipts` | Latest 200 local request receipts |\n| `GET /api/admin/supply/{id}/receipts/{request}/attempts` | Per-upstream attempt ID, provider, HTTP status and delivery state; no content or credentials |\n| `POST /api/admin/supply/{id}/reconcile` | Release an unknown request after operator confirmation of upstream execution/accounting; body: `request_id`, `confirm_upstream_accounting=true` |\n| `POST /api/admin/supply-control/disconnect` | Persistently block all new supply admissions; in-flight work drains |\n| `POST /api/admin/supply-control/connect` | Explicitly resume valid active publications |\n\nThe dedicated supply key is accepted only at `/supply/{id}/...`. `GET /supply/{id}/v1/models` (also `/models` for Cloud probing) exposes just the authorized model. Inference paths below `/supply/{id}/v1/` are `chat/completions`, `responses`, `embeddings`, `images/generations`, `rerank`, `videos`, `audio/speech`, `audio/transcriptions`. Each publication explicitly allows its selected subset; adapters and upstream capabilities still determine actual protocol compatibility.\n\nRequests are admitted transactionally only when the connector is connected, the publication is active, the service window is open, the credential matches, and concurrency/RPM/total request budgets permit it. All admitted attempts consume request budget, including failures; this is a local safety budget, not a Cloud invoice or token charge. Limits are independent from private API-key limits. The publication credential is never forwarded upstream.\n\nClients may send `X-OpenScaler-Supply-Request-ID` (1–128 characters). Reusing a previously admitted ID for that publication returns 409 without executing again. Clients omitting it receive a generated ID and do not get cross-request automatic deduplication. Response headers include that supply ID and a namespaced `X-OpenScaler-Request-ID` (`supply:<publication>:<request>`), which joins the receipt to local usage records. Duplicate requests do not replay response content, since prompts and responses are not retained by the connector.\n\n## Withdrawal, disconnect and restart\n\nStates: `draft → active → draining → withdrawn`; an idle publication can move directly to withdrawn. Expired windows reject new requests even when the stored state still reads active; withdraw explicitly to release reserved endpoints. Disconnect is a persistent global admission switch and does not change individual publication consent or release in-flight capacity.\n\nEach admission and individual upstream attempt is durable before contacting an upstream. A transport error remains uncertain even if a later authorized failover succeeds; inspect all attempts rather than assuming a successful final response erases earlier execution risk. A successful transport completion records `completed`; ordinary HTTP failures record `failed`. Interrupted responses, cancelled requests, streaming without a recognized terminal marker, or process restart with unfinished admissions produce `unknown`. Unknown work continues occupying capacity and can keep a withdrawn publication draining. Do not retry or free it automatically: inspect the upstream and perform explicit reconciliation. Reconciliation records a local operator decision, not proof of model execution and not a payment/refund.\n\nStreaming withdrawal does not cancel a previously admitted request. If its stream finishes normally, the receipt completes and draining can end. A truncated stream remains unknown. Local usage includes the serving endpoint, tokens and estimated cost; Cloud owns binding prices and settlement. Receipt/usage persistence failures fail closed through retained running/unknown capacity and emit an operator log.\n\nCloud connectivity is not required for private requests or local management. Disconnecting supply leaves separately configured private endpoints usable. To stop publishing while keeping administration available, use the disconnect/withdraw controls rather than disabling the feature flag before draining.\n\n## Submit a Cloud supplier draft\n\nExport the publication manifest using its management endpoint or the console. Put the dedicated supply credential and the authorized Cloud `oss_session` cookie value in separate private files. Use the intended Cloud environment explicitly:\n\n```bash\npython3 scripts/cloud-draft.py \\\n  --manifest /path/to/publication.json \\\n  --credential-file /path/to/supply-key.txt \\\n  --cloud-url https://cloud.example.com \\\n  --session-file /path/to/cloud-session.txt \\\n  --receipt /path/to/new-submission-receipt.json \\\n  --authorize-upload\n```\n\nThe command sends only the model, operator, region, public connector address, chat path, prices, concurrency and dedicated connector credential accepted by the existing `/api/provider/v1/submissions` API. It does not upload private endpoints, provider keys, full catalog or user content. The public HTTPS address must resolve to your OSS reverse proxy; expose the supply paths, not the management API. Cloud must already have the model and a supplier profile for that account.\n\nThis adapter currently creates **chat supplier drafts**. Other protocols can be exposed locally, but extending the Cloud draft contract and certification for those protocols is separate work. Service windows and request budgets are enforced locally even though the current Cloud draft API does not accept those fields. Complete the remaining provenance and review steps in Cloud; this script never starts test traffic or trading.\n\nA private receipt is reserved before the non-idempotent POST. If the request times out, crashes, redirects or returns an unrecognized result, it is not retried automatically; inspect Cloud submissions before creating another receipt. The same receipt path cannot be reused. Cloud credentials are read from local files, never placed in URLs or written to the receipt. HTTPS and no-follow-redirect behavior prevent cross-origin credential forwarding.\n\nLocal withdrawal immediately blocks future supply requests, but does not automatically delete a previously submitted Cloud draft or mark a Cloud listing withdrawn. The current Cloud API has no dedicated connector withdrawal contract: coordinate the remote listing through its existing operations flow. Cloud requests arriving after local withdrawal receive an explicit unavailable response.\n\n## Validation and release\n\n`go test -race ./...` covers draft consent, model/capability scope, private/market routing, quotas, duplicate admission, credential rotation, endpoint changes, persistent disconnect, recovery, draining, streaming truncation and all eight protocol paths with local mock upstreams. `scripts/smoke.py` checks the standalone process. `scripts/release-check.sh` also builds four platform archives with LICENSE/NOTICE and SHA-256 checksums; it never publishes them remotely.\n\nReal supplier credentials, reachable deployment URLs, Cloud test identities and an authorized release repository are required for live integration and distribution acceptance. Local tests do not establish those external results.\n";function E(e,t){let n=t||{};return(e[e.length-1]===``?[...e,``]:e).join((n.padRight?` `:``)+`,`+(n.padLeft===!1?``:` `)).trim()}var ee=/^[$_\p{ID_Start}][$_\u{200C}\u{200D}\p{ID_Continue}]*$/u,D=/^[$_\p{ID_Start}][-$_\u{200C}\u{200D}\p{ID_Continue}]*$/u,te={};function ne(e,t){return((t||te).jsx?D:ee).test(e)}var re=/[ \t\n\f\r]/g;function O(e){return typeof e==`object`?e.type===`text`&&k(e.value):k(e)}function k(e){return e.replace(re,``)===``}var A=class{constructor(e,t,n){this.normal=t,this.property=e,n&&(this.space=n)}};A.prototype.normal={},A.prototype.property={},A.prototype.space=void 0;function ie(e,t){let n={},r={};for(let t of e)Object.assign(n,t.property),Object.assign(r,t.normal);return new A(n,r,t)}function j(e){return e.toLowerCase()}var M=class{constructor(e,t){this.attribute=t,this.property=e}};M.prototype.attribute=``,M.prototype.booleanish=!1,M.prototype.boolean=!1,M.prototype.commaOrSpaceSeparated=!1,M.prototype.commaSeparated=!1,M.prototype.defined=!1,M.prototype.mustUseProperty=!1,M.prototype.number=!1,M.prototype.overloadedBoolean=!1,M.prototype.property=``,M.prototype.spaceSeparated=!1,M.prototype.space=void 0;var ae=r({boolean:()=>N,booleanish:()=>P,commaOrSpaceSeparated:()=>L,commaSeparated:()=>ce,number:()=>F,overloadedBoolean:()=>se,spaceSeparated:()=>I}),oe=0,N=R(),P=R(),se=R(),F=R(),I=R(),ce=R(),L=R();function R(){return 2**++oe}var le=Object.keys(ae),ue=class extends M{constructor(e,t,n,r){let i=-1;if(super(e,t),de(this,`space`,r),typeof n==`number`)for(;++i<le.length;){let e=le[i];de(this,le[i],(n&ae[e])===ae[e])}}};ue.prototype.defined=!0;function de(e,t,n){n&&(e[t]=n)}function fe(e){let t={},n={};for(let[r,i]of Object.entries(e.properties)){let a=new ue(r,e.transform(e.attributes||{},r),i,e.space);e.mustUseProperty&&e.mustUseProperty.includes(r)&&(a.mustUseProperty=!0),t[r]=a,n[j(r)]=r,n[j(a.attribute)]=r}return new A(t,n,e.space)}var pe=fe({properties:{ariaActiveDescendant:null,ariaAtomic:P,ariaAutoComplete:null,ariaBusy:P,ariaChecked:P,ariaColCount:F,ariaColIndex:F,ariaColSpan:F,ariaControls:I,ariaCurrent:null,ariaDescribedBy:I,ariaDetails:null,ariaDisabled:P,ariaDropEffect:I,ariaErrorMessage:null,ariaExpanded:P,ariaFlowTo:I,ariaGrabbed:P,ariaHasPopup:null,ariaHidden:P,ariaInvalid:null,ariaKeyShortcuts:null,ariaLabel:null,ariaLabelledBy:I,ariaLevel:F,ariaLive:null,ariaModal:P,ariaMultiLine:P,ariaMultiSelectable:P,ariaOrientation:null,ariaOwns:I,ariaPlaceholder:null,ariaPosInSet:F,ariaPressed:P,ariaReadOnly:P,ariaRelevant:null,ariaRequired:P,ariaRoleDescription:I,ariaRowCount:F,ariaRowIndex:F,ariaRowSpan:F,ariaSelected:P,ariaSetSize:F,ariaSort:null,ariaValueMax:F,ariaValueMin:F,ariaValueNow:F,ariaValueText:null,role:null},transform(e,t){return t===`role`?t:`aria-`+t.slice(4).toLowerCase()}});function me(e,t){return t in e?e[t]:t}function he(e,t){return me(e,t.toLowerCase())}var ge=fe({attributes:{acceptcharset:`accept-charset`,classname:`class`,htmlfor:`for`,httpequiv:`http-equiv`},mustUseProperty:[`checked`,`multiple`,`muted`,`selected`],properties:{abbr:null,accept:ce,acceptCharset:I,accessKey:I,action:null,allow:null,allowFullScreen:N,allowPaymentRequest:N,allowUserMedia:N,alpha:N,alt:null,as:null,async:N,autoCapitalize:null,autoComplete:I,autoFocus:N,autoPlay:N,blocking:I,capture:null,charSet:null,checked:N,cite:null,className:I,closedBy:null,colorSpace:null,cols:F,colSpan:F,command:null,commandFor:null,content:null,contentEditable:P,controls:N,controlsList:I,coords:F|ce,crossOrigin:null,data:null,dateTime:null,decoding:null,default:N,defer:N,dir:null,dirName:null,disabled:N,download:se,draggable:P,encType:null,enterKeyHint:null,fetchPriority:null,form:null,formAction:null,formEncType:null,formMethod:null,formNoValidate:N,formTarget:null,headers:I,height:F,hidden:se,high:F,href:null,hrefLang:null,htmlFor:I,httpEquiv:I,id:null,imageSizes:null,imageSrcSet:null,inert:N,inputMode:null,integrity:null,is:null,isMap:N,itemId:null,itemProp:I,itemRef:I,itemScope:N,itemType:I,kind:null,label:null,lang:null,language:null,list:null,loading:null,loop:N,low:F,manifest:null,max:null,maxLength:F,media:null,method:null,min:null,minLength:F,multiple:N,muted:N,name:null,nonce:null,noModule:N,noValidate:N,onAbort:null,onAfterPrint:null,onAuxClick:null,onBeforeMatch:null,onBeforePrint:null,onBeforeToggle:null,onBeforeUnload:null,onBlur:null,onCancel:null,onCanPlay:null,onCanPlayThrough:null,onChange:null,onClick:null,onClose:null,onContextLost:null,onContextMenu:null,onContextRestored:null,onCopy:null,onCueChange:null,onCut:null,onDblClick:null,onDrag:null,onDragEnd:null,onDragEnter:null,onDragExit:null,onDragLeave:null,onDragOver:null,onDragStart:null,onDrop:null,onDurationChange:null,onEmptied:null,onEnded:null,onError:null,onFocus:null,onFormData:null,onHashChange:null,onInput:null,onInvalid:null,onKeyDown:null,onKeyPress:null,onKeyUp:null,onLanguageChange:null,onLoad:null,onLoadedData:null,onLoadedMetadata:null,onLoadEnd:null,onLoadStart:null,onMessage:null,onMessageError:null,onMouseDown:null,onMouseEnter:null,onMouseLeave:null,onMouseMove:null,onMouseOut:null,onMouseOver:null,onMouseUp:null,onOffline:null,onOnline:null,onPageHide:null,onPageShow:null,onPaste:null,onPause:null,onPlay:null,onPlaying:null,onPopState:null,onProgress:null,onRateChange:null,onRejectionHandled:null,onReset:null,onResize:null,onScroll:null,onScrollEnd:null,onSecurityPolicyViolation:null,onSeeked:null,onSeeking:null,onSelect:null,onSlotChange:null,onStalled:null,onStorage:null,onSubmit:null,onSuspend:null,onTimeUpdate:null,onToggle:null,onUnhandledRejection:null,onUnload:null,onVolumeChange:null,onWaiting:null,onWheel:null,open:N,optimum:F,pattern:null,ping:I,placeholder:null,playsInline:N,popover:null,popoverTarget:null,popoverTargetAction:null,poster:null,preload:null,readOnly:N,referrerPolicy:null,rel:I,required:N,reversed:N,rows:F,rowSpan:F,sandbox:I,scope:null,scoped:N,seamless:N,selected:N,shadowRootClonable:N,shadowRootCustomElementRegistry:N,shadowRootDelegatesFocus:N,shadowRootMode:null,shadowRootSerializable:N,shape:null,size:F,sizes:null,slot:null,span:F,spellCheck:P,src:null,srcDoc:null,srcLang:null,srcSet:null,start:F,step:null,style:null,tabIndex:F,target:null,title:null,translate:null,type:null,typeMustMatch:N,useMap:null,value:P,width:F,wrap:null,writingSuggestions:null,align:null,aLink:null,archive:I,axis:null,background:null,bgColor:null,border:F,borderColor:null,bottomMargin:F,cellPadding:null,cellSpacing:null,char:null,charOff:null,classId:null,clear:null,code:null,codeBase:null,codeType:null,color:null,compact:N,declare:N,event:null,face:null,frame:null,frameBorder:null,hSpace:F,leftMargin:F,link:null,longDesc:null,lowSrc:null,marginHeight:F,marginWidth:F,noResize:N,noHref:N,noShade:N,noWrap:N,object:null,profile:null,prompt:null,rev:null,rightMargin:F,rules:null,scheme:null,scrolling:P,standby:null,summary:null,text:null,topMargin:F,valueType:null,version:null,vAlign:null,vLink:null,vSpace:F,allowTransparency:null,autoCorrect:null,autoSave:null,credentialless:N,disablePictureInPicture:N,disableRemotePlayback:N,exportParts:ce,part:I,prefix:null,property:null,results:F,security:null,unselectable:null},space:`html`,transform:he}),_e=fe({attributes:{accentHeight:`accent-height`,alignmentBaseline:`alignment-baseline`,arabicForm:`arabic-form`,baselineShift:`baseline-shift`,capHeight:`cap-height`,className:`class`,clipPath:`clip-path`,clipRule:`clip-rule`,colorInterpolation:`color-interpolation`,colorInterpolationFilters:`color-interpolation-filters`,colorProfile:`color-profile`,colorRendering:`color-rendering`,crossOrigin:`crossorigin`,dataType:`datatype`,dominantBaseline:`dominant-baseline`,enableBackground:`enable-background`,fillOpacity:`fill-opacity`,fillRule:`fill-rule`,floodColor:`flood-color`,floodOpacity:`flood-opacity`,fontFamily:`font-family`,fontSize:`font-size`,fontSizeAdjust:`font-size-adjust`,fontStretch:`font-stretch`,fontStyle:`font-style`,fontVariant:`font-variant`,fontWeight:`font-weight`,glyphName:`glyph-name`,glyphOrientationHorizontal:`glyph-orientation-horizontal`,glyphOrientationVertical:`glyph-orientation-vertical`,hrefLang:`hreflang`,horizAdvX:`horiz-adv-x`,horizOriginX:`horiz-origin-x`,horizOriginY:`horiz-origin-y`,imageRendering:`image-rendering`,letterSpacing:`letter-spacing`,lightingColor:`lighting-color`,markerEnd:`marker-end`,markerMid:`marker-mid`,markerStart:`marker-start`,maskType:`mask-type`,navDown:`nav-down`,navDownLeft:`nav-down-left`,navDownRight:`nav-down-right`,navLeft:`nav-left`,navNext:`nav-next`,navPrev:`nav-prev`,navRight:`nav-right`,navUp:`nav-up`,navUpLeft:`nav-up-left`,navUpRight:`nav-up-right`,onAbort:`onabort`,onActivate:`onactivate`,onAfterPrint:`onafterprint`,onBeforePrint:`onbeforeprint`,onBegin:`onbegin`,onCancel:`oncancel`,onCanPlay:`oncanplay`,onCanPlayThrough:`oncanplaythrough`,onChange:`onchange`,onClick:`onclick`,onClose:`onclose`,onCopy:`oncopy`,onCueChange:`oncuechange`,onCut:`oncut`,onDblClick:`ondblclick`,onDrag:`ondrag`,onDragEnd:`ondragend`,onDragEnter:`ondragenter`,onDragExit:`ondragexit`,onDragLeave:`ondragleave`,onDragOver:`ondragover`,onDragStart:`ondragstart`,onDrop:`ondrop`,onDurationChange:`ondurationchange`,onEmptied:`onemptied`,onEnd:`onend`,onEnded:`onended`,onError:`onerror`,onFocus:`onfocus`,onFocusIn:`onfocusin`,onFocusOut:`onfocusout`,onHashChange:`onhashchange`,onInput:`oninput`,onInvalid:`oninvalid`,onKeyDown:`onkeydown`,onKeyPress:`onkeypress`,onKeyUp:`onkeyup`,onLoad:`onload`,onLoadedData:`onloadeddata`,onLoadedMetadata:`onloadedmetadata`,onLoadStart:`onloadstart`,onMessage:`onmessage`,onMouseDown:`onmousedown`,onMouseEnter:`onmouseenter`,onMouseLeave:`onmouseleave`,onMouseMove:`onmousemove`,onMouseOut:`onmouseout`,onMouseOver:`onmouseover`,onMouseUp:`onmouseup`,onMouseWheel:`onmousewheel`,onOffline:`onoffline`,onOnline:`ononline`,onPageHide:`onpagehide`,onPageShow:`onpageshow`,onPaste:`onpaste`,onPause:`onpause`,onPlay:`onplay`,onPlaying:`onplaying`,onPopState:`onpopstate`,onProgress:`onprogress`,onRateChange:`onratechange`,onRepeat:`onrepeat`,onReset:`onreset`,onResize:`onresize`,onScroll:`onscroll`,onSeeked:`onseeked`,onSeeking:`onseeking`,onSelect:`onselect`,onShow:`onshow`,onStalled:`onstalled`,onStorage:`onstorage`,onSubmit:`onsubmit`,onSuspend:`onsuspend`,onTimeUpdate:`ontimeupdate`,onToggle:`ontoggle`,onUnload:`onunload`,onVolumeChange:`onvolumechange`,onWaiting:`onwaiting`,onZoom:`onzoom`,overlinePosition:`overline-position`,overlineThickness:`overline-thickness`,paintOrder:`paint-order`,panose1:`panose-1`,pointerEvents:`pointer-events`,referrerPolicy:`referrerpolicy`,renderingIntent:`rendering-intent`,shapeRendering:`shape-rendering`,stopColor:`stop-color`,stopOpacity:`stop-opacity`,strikethroughPosition:`strikethrough-position`,strikethroughThickness:`strikethrough-thickness`,strokeDashArray:`stroke-dasharray`,strokeDashOffset:`stroke-dashoffset`,strokeLineCap:`stroke-linecap`,strokeLineJoin:`stroke-linejoin`,strokeMiterLimit:`stroke-miterlimit`,strokeOpacity:`stroke-opacity`,strokeWidth:`stroke-width`,tabIndex:`tabindex`,textAnchor:`text-anchor`,textDecoration:`text-decoration`,textRendering:`text-rendering`,transformOrigin:`transform-origin`,typeOf:`typeof`,underlinePosition:`underline-position`,underlineThickness:`underline-thickness`,unicodeBidi:`unicode-bidi`,unicodeRange:`unicode-range`,unitsPerEm:`units-per-em`,vAlphabetic:`v-alphabetic`,vHanging:`v-hanging`,vIdeographic:`v-ideographic`,vMathematical:`v-mathematical`,vectorEffect:`vector-effect`,vertAdvY:`vert-adv-y`,vertOriginX:`vert-origin-x`,vertOriginY:`vert-origin-y`,wordSpacing:`word-spacing`,writingMode:`writing-mode`,xHeight:`x-height`,playbackOrder:`playbackorder`,timelineBegin:`timelinebegin`},properties:{about:L,accentHeight:F,accumulate:null,additive:null,alignmentBaseline:null,alphabetic:F,amplitude:F,arabicForm:null,ascent:F,attributeName:null,attributeType:null,azimuth:F,bandwidth:null,baselineShift:null,baseFrequency:null,baseProfile:null,bbox:null,begin:null,bias:F,by:null,calcMode:null,capHeight:F,className:I,clip:null,clipPath:null,clipPathUnits:null,clipRule:null,color:null,colorInterpolation:null,colorInterpolationFilters:null,colorProfile:null,colorRendering:null,content:null,contentScriptType:null,contentStyleType:null,crossOrigin:null,cursor:null,cx:null,cy:null,d:null,dataType:null,defaultAction:null,descent:F,diffuseConstant:F,direction:null,display:null,dur:null,divisor:F,dominantBaseline:null,download:N,dx:null,dy:null,edgeMode:null,editable:null,elevation:F,enableBackground:null,end:null,event:null,exponent:F,externalResourcesRequired:null,fill:null,fillOpacity:F,fillRule:null,filter:null,filterRes:null,filterUnits:null,floodColor:null,floodOpacity:null,focusable:null,focusHighlight:null,fontFamily:null,fontSize:null,fontSizeAdjust:null,fontStretch:null,fontStyle:null,fontVariant:null,fontWeight:null,format:null,fr:null,from:null,fx:null,fy:null,g1:ce,g2:ce,glyphName:ce,glyphOrientationHorizontal:null,glyphOrientationVertical:null,glyphRef:null,gradientTransform:null,gradientUnits:null,handler:null,hanging:F,hatchContentUnits:null,hatchUnits:null,height:null,href:null,hrefLang:null,horizAdvX:F,horizOriginX:F,horizOriginY:F,id:null,ideographic:F,imageRendering:null,initialVisibility:null,in:null,in2:null,intercept:F,k:F,k1:F,k2:F,k3:F,k4:F,kernelMatrix:L,kernelUnitLength:null,keyPoints:null,keySplines:null,keyTimes:null,kerning:null,lang:null,lengthAdjust:null,letterSpacing:null,lightingColor:null,limitingConeAngle:F,local:null,markerEnd:null,markerMid:null,markerStart:null,markerHeight:null,markerUnits:null,markerWidth:null,mask:null,maskContentUnits:null,maskType:null,maskUnits:null,mathematical:null,max:null,media:null,mediaCharacterEncoding:null,mediaContentEncodings:null,mediaSize:F,mediaTime:null,method:null,min:null,mode:null,name:null,navDown:null,navDownLeft:null,navDownRight:null,navLeft:null,navNext:null,navPrev:null,navRight:null,navUp:null,navUpLeft:null,navUpRight:null,numOctaves:null,observer:null,offset:null,onAbort:null,onActivate:null,onAfterPrint:null,onBeforePrint:null,onBegin:null,onCancel:null,onCanPlay:null,onCanPlayThrough:null,onChange:null,onClick:null,onClose:null,onCopy:null,onCueChange:null,onCut:null,onDblClick:null,onDrag:null,onDragEnd:null,onDragEnter:null,onDragExit:null,onDragLeave:null,onDragOver:null,onDragStart:null,onDrop:null,onDurationChange:null,onEmptied:null,onEnd:null,onEnded:null,onError:null,onFocus:null,onFocusIn:null,onFocusOut:null,onHashChange:null,onInput:null,onInvalid:null,onKeyDown:null,onKeyPress:null,onKeyUp:null,onLoad:null,onLoadedData:null,onLoadedMetadata:null,onLoadStart:null,onMessage:null,onMouseDown:null,onMouseEnter:null,onMouseLeave:null,onMouseMove:null,onMouseOut:null,onMouseOver:null,onMouseUp:null,onMouseWheel:null,onOffline:null,onOnline:null,onPageHide:null,onPageShow:null,onPaste:null,onPause:null,onPlay:null,onPlaying:null,onPopState:null,onProgress:null,onRateChange:null,onRepeat:null,onReset:null,onResize:null,onScroll:null,onSeeked:null,onSeeking:null,onSelect:null,onShow:null,onStalled:null,onStorage:null,onSubmit:null,onSuspend:null,onTimeUpdate:null,onToggle:null,onUnload:null,onVolumeChange:null,onWaiting:null,onZoom:null,opacity:null,operator:null,order:null,orient:null,orientation:null,origin:null,overflow:null,overlay:null,overlinePosition:F,overlineThickness:F,paintOrder:null,panose1:null,path:null,pathLength:F,patternContentUnits:null,patternTransform:null,patternUnits:null,phase:null,ping:I,pitch:null,playbackOrder:null,pointerEvents:null,points:null,pointsAtX:F,pointsAtY:F,pointsAtZ:F,preserveAlpha:null,preserveAspectRatio:null,primitiveUnits:null,propagate:null,property:L,r:null,radius:null,referrerPolicy:null,refX:null,refY:null,rel:L,rev:L,renderingIntent:null,repeatCount:null,repeatDur:null,requiredExtensions:L,requiredFeatures:L,requiredFonts:L,requiredFormats:L,resource:null,restart:null,result:null,rotate:null,rx:null,ry:null,scale:null,seed:null,shapeRendering:null,side:null,slope:null,snapshotTime:null,specularConstant:F,specularExponent:F,spreadMethod:null,spacing:null,startOffset:null,stdDeviation:null,stemh:null,stemv:null,stitchTiles:null,stopColor:null,stopOpacity:null,strikethroughPosition:F,strikethroughThickness:F,string:null,stroke:null,strokeDashArray:L,strokeDashOffset:null,strokeLineCap:null,strokeLineJoin:null,strokeMiterLimit:F,strokeOpacity:F,strokeWidth:null,style:null,surfaceScale:F,syncBehavior:null,syncBehaviorDefault:null,syncMaster:null,syncTolerance:null,syncToleranceDefault:null,systemLanguage:L,tabIndex:F,tableValues:null,target:null,targetX:F,targetY:F,textAnchor:null,textDecoration:null,textRendering:null,textLength:null,timelineBegin:null,title:null,transformBehavior:null,type:null,typeOf:L,to:null,transform:null,transformOrigin:null,u1:null,u2:null,underlinePosition:F,underlineThickness:F,unicode:null,unicodeBidi:null,unicodeRange:null,unitsPerEm:F,values:null,vAlphabetic:F,vMathematical:F,vectorEffect:null,vHanging:F,vIdeographic:F,version:null,vertAdvY:F,vertOriginX:F,vertOriginY:F,viewBox:null,viewTarget:null,visibility:null,width:null,widths:null,wordSpacing:null,writingMode:null,x:null,x1:null,x2:null,xChannelSelector:null,xHeight:F,y:null,y1:null,y2:null,yChannelSelector:null,z:null,zoomAndPan:null},space:`svg`,transform:me}),ve=fe({properties:{xLinkActuate:null,xLinkArcRole:null,xLinkHref:null,xLinkRole:null,xLinkShow:null,xLinkTitle:null,xLinkType:null},space:`xlink`,transform(e,t){return`xlink:`+t.slice(5).toLowerCase()}}),ye=fe({attributes:{xmlnsxlink:`xmlns:xlink`},properties:{xmlnsXLink:null,xmlns:null},space:`xmlns`,transform:he}),be=fe({properties:{xmlBase:null,xmlLang:null,xmlSpace:null},space:`xml`,transform(e,t){return`xml:`+t.slice(3).toLowerCase()}}),xe={classId:`classID`,dataType:`datatype`,itemId:`itemID`,strokeDashArray:`strokeDasharray`,strokeDashOffset:`strokeDashoffset`,strokeLineCap:`strokeLinecap`,strokeLineJoin:`strokeLinejoin`,strokeMiterLimit:`strokeMiterlimit`,typeOf:`typeof`,xLinkActuate:`xlinkActuate`,xLinkArcRole:`xlinkArcrole`,xLinkHref:`xlinkHref`,xLinkRole:`xlinkRole`,xLinkShow:`xlinkShow`,xLinkTitle:`xlinkTitle`,xLinkType:`xlinkType`,xmlnsXLink:`xmlnsXlink`},Se=/[A-Z]/g,Ce=/-[a-z]/g,we=/^data[-\w.:]+$/i;function Te(e,t){let n=j(t),r=t,i=M;if(n in e.normal)return e.property[e.normal[n]];if(n.length>4&&n.slice(0,4)===`data`&&we.test(t)){if(t.charAt(4)===`-`){let e=t.slice(5).replace(Ce,De);r=`data`+e.charAt(0).toUpperCase()+e.slice(1)}else{let e=t.slice(4);if(!Ce.test(e)){let n=e.replace(Se,Ee);n.charAt(0)!==`-`&&(n=`-`+n),t=`data`+n}}i=ue}return new i(r,t)}function Ee(e){return`-`+e.toLowerCase()}function De(e){return e.charAt(1).toUpperCase()}var Oe=ie([pe,ge,ve,ye,be],`html`),ke=ie([pe,_e,ve,ye,be],`svg`);function Ae(e){return e.join(` `).trim()}var je=t(((e,t)=>{var n=/\/\*[^*]*\*+([^/*][^*]*\*+)*\//g,r=/\n/g,i=/^\s*/,a=/^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/,o=/^:\s*/,s=/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/,c=/^[;\s]*/,l=/^\s+|\s+$/g;function u(e,t){if(typeof e!=`string`)throw TypeError(`First argument must be a string`);if(!e)return[];t||={};var l=1,u=1;function f(e){var t=e.match(r);t&&(l+=t.length);var n=e.lastIndexOf(`
`);u=~n?e.length-n:u+e.length}function p(){var e={line:l,column:u};return function(t){return t.position=new m(e),_(),t}}function m(e){this.start=e,this.end={line:l,column:u},this.source=t.source}m.prototype.content=e;function h(n){var r=Error(t.source+`:`+l+`:`+u+`: `+n);if(r.reason=n,r.filename=t.source,r.line=l,r.column=u,r.source=e,!t.silent)throw r}function g(t){var n=t.exec(e);if(n){var r=n[0];return f(r),e=e.slice(r.length),n}}function _(){g(i)}function v(e){var t;for(e||=[];t=y();)t!==!1&&e.push(t);return e}function y(){var t=p();if(e.charAt(0)==`/`&&e.charAt(1)==`*`){for(var n=2;e.charAt(n)!=``&&(e.charAt(n)!=`*`||e.charAt(n+1)!=`/`);)++n;if(n+=2,e.charAt(n-1)===``)return h(`End of comment missing`);var r=e.slice(2,n-2);return u+=2,f(r),e=e.slice(n),u+=2,t({type:`comment`,comment:r})}}function b(){var e=p(),t=g(a);if(t){if(y(),!g(o))return h(`property missing ':'`);var r=g(s),i=e({type:`declaration`,property:d(t[0].replace(n,``)),value:r?d(r[0].replace(n,``)):``});return g(c),i}}function x(){var e=[];v(e);for(var t;t=b();)t!==!1&&(e.push(t),v(e));return e}return _(),x()}function d(e){return e?e.replace(l,``):``}t.exports=u})),Me=t((e=>{var t=e&&e.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(e,"__esModule",{value:!0}),e.default=r;var n=t(je());function r(e,t){let r=null;if(!e||typeof e!=`string`)return r;let i=(0,n.default)(e),a=typeof t==`function`;return i.forEach(e=>{if(e.type!==`declaration`)return;let{property:n,value:i}=e;a?t(n,i,e):i&&(r||={},r[n]=i)}),r}})),Ne=t((e=>{Object.defineProperty(e,"__esModule",{value:!0}),e.camelCase=void 0;var t=/^--[a-zA-Z0-9_-]+$/,n=/-([a-z])/g,r=/^[^-]+$/,i=/^-(webkit|moz|ms|o|khtml)-/,a=/^-(ms)-/,o=function(e){return!e||r.test(e)||t.test(e)},s=function(e,t){return t.toUpperCase()},c=function(e,t){return`${t}-`};e.camelCase=function(e,t){return t===void 0&&(t={}),o(e)?e:(e=e.toLowerCase(),e=t.reactCompat?e.replace(a,c):e.replace(i,c),e.replace(n,s))}})),Pe=t(((e,t)=>{var n=(e&&e.__importDefault||function(e){return e&&e.__esModule?e:{default:e}})(Me()),r=Ne();function i(e,t){var i={};return!e||typeof e!=`string`||(0,n.default)(e,function(e,n){e&&n&&(i[(0,r.camelCase)(e,t)]=n)}),i}i.default=i,t.exports=i})),Fe=Le(`end`),Ie=Le(`start`);function Le(e){return t;function t(t){let n=t&&t.position&&t.position[e]||{};if(typeof n.line==`number`&&n.line>0&&typeof n.column==`number`&&n.column>0)return{line:n.line,column:n.column,offset:typeof n.offset==`number`&&n.offset>-1?n.offset:void 0}}}function Re(e){let t=Ie(e),n=Fe(e);if(t&&n)return{start:t,end:n}}function ze(e){return!e||typeof e!=`object`?``:`position`in e||`type`in e?Ve(e.position):`start`in e||`end`in e?Ve(e):`line`in e||`column`in e?Be(e):``}function Be(e){return He(e&&e.line)+`:`+He(e&&e.column)}function Ve(e){return Be(e&&e.start)+`-`+Be(e&&e.end)}function He(e){return e&&typeof e==`number`?e:1}var z=class extends Error{constructor(e,t,n){super(),typeof t==`string`&&(n=t,t=void 0);let r=``,i={},a=!1;if(t&&(i=`line`in t&&`column`in t||`start`in t&&`end`in t?{place:t}:`type`in t?{ancestors:[t],place:t.position}:{...t}),typeof e==`string`?r=e:!i.cause&&e&&(a=!0,r=e.message,i.cause=e),!i.ruleId&&!i.source&&typeof n==`string`){let e=n.indexOf(`:`);e===-1?i.ruleId=n:(i.source=n.slice(0,e),i.ruleId=n.slice(e+1))}if(!i.place&&i.ancestors&&i.ancestors){let e=i.ancestors[i.ancestors.length-1];e&&(i.place=e.position)}let o=i.place&&`start`in i.place?i.place.start:i.place;this.ancestors=i.ancestors||void 0,this.cause=i.cause||void 0,this.column=o?o.column:void 0,this.fatal=void 0,this.file=``,this.message=r,this.line=o?o.line:void 0,this.name=ze(i.place)||`1:1`,this.place=i.place||void 0,this.reason=this.message,this.ruleId=i.ruleId||void 0,this.source=i.source||void 0,this.stack=a&&i.cause&&typeof i.cause.stack==`string`?i.cause.stack:``,this.actual=void 0,this.expected=void 0,this.note=void 0,this.url=void 0}};z.prototype.file=``,z.prototype.name=``,z.prototype.reason=``,z.prototype.message=``,z.prototype.stack=``,z.prototype.column=void 0,z.prototype.line=void 0,z.prototype.ancestors=void 0,z.prototype.cause=void 0,z.prototype.fatal=void 0,z.prototype.place=void 0,z.prototype.ruleId=void 0,z.prototype.source=void 0;var Ue=s(Pe(),1),We={}.hasOwnProperty,Ge=new Map,Ke=/[A-Z]/g,qe=new Set([`table`,`tbody`,`thead`,`tfoot`,`tr`]),Je=new Set([`td`,`th`]),Ye=`https://github.com/syntax-tree/hast-util-to-jsx-runtime`;function Xe(e,t){if(!t||t.Fragment===void 0)throw TypeError("Expected `Fragment` in options");let n=t.filePath||void 0,r;if(t.development){if(typeof t.jsxDEV!=`function`)throw TypeError("Expected `jsxDEV` in options when `development: true`");r=st(n,t.jsxDEV)}else{if(typeof t.jsx!=`function`)throw TypeError("Expected `jsx` in production options");if(typeof t.jsxs!=`function`)throw TypeError("Expected `jsxs` in production options");r=ot(n,t.jsx,t.jsxs)}let i={Fragment:t.Fragment,ancestors:[],components:t.components||{},create:r,elementAttributeNameCase:t.elementAttributeNameCase||`react`,evaluater:t.createEvaluater?t.createEvaluater():void 0,filePath:n,ignoreInvalidStyle:t.ignoreInvalidStyle||!1,passKeys:t.passKeys!==!1,passNode:t.passNode||!1,schema:t.space===`svg`?ke:Oe,stylePropertyNameCase:t.stylePropertyNameCase||`dom`,tableCellAlignToStyle:t.tableCellAlignToStyle!==!1},a=Ze(i,e,void 0);return a&&typeof a!=`string`?a:i.create(e,i.Fragment,{children:a||void 0},void 0)}function Ze(e,t,n){if(t.type===`element`)return Qe(e,t,n);if(t.type===`mdxFlowExpression`||t.type===`mdxTextExpression`)return $e(e,t);if(t.type===`mdxJsxFlowElement`||t.type===`mdxJsxTextElement`)return tt(e,t,n);if(t.type===`mdxjsEsm`)return et(e,t);if(t.type===`root`)return nt(e,t,n);if(t.type===`text`)return rt(e,t)}function Qe(e,t,n){let r=e.schema,i=r;t.tagName.toLowerCase()===`svg`&&r.space===`html`&&(i=ke,e.schema=i),e.ancestors.push(t);let a=pt(e,t.tagName,!1),o=ct(e,t),s=ut(e,t);return qe.has(t.tagName)&&(s=s.filter(function(e){return typeof e!=`string`||!O(e)})),it(e,o,a,t),at(o,s),e.ancestors.pop(),e.schema=r,e.create(t,a,o,n)}function $e(e,t){if(t.data&&t.data.estree&&e.evaluater){let n=t.data.estree.body[0];return n.type,e.evaluater.evaluateExpression(n.expression)}mt(e,t.position)}function et(e,t){if(t.data&&t.data.estree&&e.evaluater)return e.evaluater.evaluateProgram(t.data.estree);mt(e,t.position)}function tt(e,t,n){let r=e.schema,i=r;t.name===`svg`&&r.space===`html`&&(i=ke,e.schema=i),e.ancestors.push(t);let a=t.name===null?e.Fragment:pt(e,t.name,!0),o=lt(e,t),s=ut(e,t);return it(e,o,a,t),at(o,s),e.ancestors.pop(),e.schema=r,e.create(t,a,o,n)}function nt(e,t,n){let r={};return at(r,ut(e,t)),e.create(t,e.Fragment,r,n)}function rt(e,t){return t.value}function it(e,t,n,r){typeof n!=`string`&&n!==e.Fragment&&e.passNode&&(t.node=r)}function at(e,t){if(t.length>0){let n=t.length>1?t:t[0];n&&(e.children=n)}}function ot(e,t,n){return r;function r(e,r,i,a){let o=Array.isArray(i.children)?n:t;return a?o(r,i,a):o(r,i)}}function st(e,t){return n;function n(n,r,i,a){let o=Array.isArray(i.children),s=Ie(n);return t(r,i,a,o,{columnNumber:s?s.column-1:void 0,fileName:e,lineNumber:s?s.line:void 0},void 0)}}function ct(e,t){let n={},r,i;for(i in t.properties)if(i!==`children`&&We.call(t.properties,i)){let a=dt(e,i,t.properties[i]);if(a){let[i,o]=a;e.tableCellAlignToStyle&&i===`align`&&typeof o==`string`&&Je.has(t.tagName)?r=o:n[i]=o}}if(r){let t=n.style||={};t[e.stylePropertyNameCase===`css`?`text-align`:`textAlign`]=r}return n}function lt(e,t){let n={};for(let r of t.attributes)if(r.type===`mdxJsxExpressionAttribute`){if(r.data&&r.data.estree&&e.evaluater){let t=r.data.estree.body[0];t.type;let i=t.expression;i.type;let a=i.properties[0];a.type,Object.assign(n,e.evaluater.evaluateExpression(a.argument))}else mt(e,t.position)}else{let i=r.name,a;if(r.value&&typeof r.value==`object`){if(r.value.data&&r.value.data.estree&&e.evaluater){let t=r.value.data.estree.body[0];t.type,a=e.evaluater.evaluateExpression(t.expression)}else mt(e,t.position)}else a=r.value===null||r.value;n[i]=a}return n}function ut(e,t){let n=[],r=-1,i=e.passKeys?new Map:Ge;for(;++r<t.children.length;){let a=t.children[r],o;if(e.passKeys){let e=a.type===`element`?a.tagName:a.type===`mdxJsxFlowElement`||a.type===`mdxJsxTextElement`?a.name:void 0;if(e){let t=i.get(e)||0;o=e+`-`+t,i.set(e,t+1)}}let s=Ze(e,a,o);s!==void 0&&n.push(s)}return n}function dt(e,t,n){let r=Te(e.schema,t);if(!(n==null||typeof n==`number`&&Number.isNaN(n))){if(Array.isArray(n)&&(n=r.commaSeparated?E(n):Ae(n)),r.property===`style`){let t=typeof n==`object`?n:ft(e,String(n));return e.stylePropertyNameCase===`css`&&(t=ht(t)),[`style`,t]}return[e.elementAttributeNameCase===`react`&&r.space?xe[r.property]||r.property:r.attribute,n]}}function ft(e,t){try{return(0,Ue.default)(t,{reactCompat:!0})}catch(t){if(e.ignoreInvalidStyle)return{};let n=t,r=new z("Cannot parse `style` attribute",{ancestors:e.ancestors,cause:n,ruleId:`style`,source:`hast-util-to-jsx-runtime`});throw r.file=e.filePath||void 0,r.url=Ye+`#cannot-parse-style-attribute`,r}}function pt(e,t,n){let r;if(!n)r={type:`Literal`,value:t};else if(t.includes(`.`)){let e=t.split(`.`),n=-1,i;for(;++n<e.length;){let t=ne(e[n])?{type:`Identifier`,name:e[n]}:{type:`Literal`,value:e[n]};i=i?{type:`MemberExpression`,object:i,property:t,computed:!!(n&&t.type===`Literal`),optional:!1}:t}r=i}else r=ne(t)&&!/^[a-z]/.test(t)?{type:`Identifier`,name:t}:{type:`Literal`,value:t};if(r.type===`Literal`){let t=r.value;return We.call(e.components,t)?e.components[t]:t}if(e.evaluater)return e.evaluater.evaluateExpression(r);mt(e)}function mt(e,t){let n=new z("Cannot handle MDX estrees without `createEvaluater`",{ancestors:e.ancestors,place:t,ruleId:`mdx-estree`,source:`hast-util-to-jsx-runtime`});throw n.file=e.filePath||void 0,n.url=Ye+`#cannot-handle-mdx-estrees-without-createevaluater`,n}function ht(e){let t={},n;for(n in e)We.call(e,n)&&(t[gt(n)]=e[n]);return t}function gt(e){let t=e.replace(Ke,_t);return t.slice(0,3)===`ms-`&&(t=`-`+t),t}function _t(e){return`-`+e.toLowerCase()}var vt={action:[`form`],cite:[`blockquote`,`del`,`ins`,`q`],data:[`object`],formAction:[`button`,`input`],href:[`a`,`area`,`base`,`link`],icon:[`menuitem`],itemId:null,manifest:[`html`],ping:[`a`,`area`],poster:[`video`],src:[`audio`,`embed`,`iframe`,`img`,`input`,`script`,`source`,`track`,`video`]},yt={};function bt(e,t){let n=t||yt;return xt(e,typeof n.includeImageAlt!=`boolean`||n.includeImageAlt,typeof n.includeHtml!=`boolean`||n.includeHtml)}function xt(e,t,n){if(Ct(e)){if(`value`in e)return e.type===`html`&&!n?``:e.value;if(t&&`alt`in e&&e.alt)return e.alt;if(`children`in e)return St(e.children,t,n)}return Array.isArray(e)?St(e,t,n):``}function St(e,t,n){let r=[],i=-1;for(;++i<e.length;)r[i]=xt(e[i],t,n);return r.join(``)}function Ct(e){return!!(e&&typeof e==`object`)}var wt=document.createElement(`i`);function Tt(e){let t=`&`+e+`;`;wt.innerHTML=t;let n=wt.textContent;return n.charCodeAt(n.length-1)===59&&e!==`semi`?!1:n!==t&&n}function B(e,t,n,r){let i=e.length,a=0,o;if(t=t<0?-t>i?0:i+t:t>i?i:t,n=n>0?n:0,r.length<1e4)o=Array.from(r),o.unshift(t,n),e.splice(...o);else for(n&&e.splice(t,n);a<r.length;)o=r.slice(a,a+1e4),o.unshift(t,0),e.splice(...o),a+=1e4,t+=1e4}function V(e,t){return e.length>0?(B(e,e.length,0,t),e):t}var Et={}.hasOwnProperty;function Dt(e){let t={},n=-1;for(;++n<e.length;)Ot(t,e[n]);return t}function Ot(e,t){let n;for(n in t){let r=(Et.call(e,n)?e[n]:void 0)||(e[n]={}),i=t[n],a;if(i)for(a in i){Et.call(r,a)||(r[a]=[]);let e=i[a];kt(r[a],Array.isArray(e)?e:e?[e]:[])}}}function kt(e,t){let n=-1,r=[];for(;++n<t.length;)(t[n].add===`after`?e:r).push(t[n]);B(e,0,0,r)}function At(e,t){let n=Number.parseInt(e,t);return n<9||n===11||n>13&&n<32||n>126&&n<160||n>55295&&n<57344||n>64975&&n<65008||(n&65535)==65535||(n&65535)==65534||n>1114111?`�`:String.fromCodePoint(n)}function H(e){return e.replace(/[\t\n\r ]+/g,` `).replace(/^ | $/g,``).toLowerCase().toUpperCase()}var U=Rt(/[A-Za-z]/),W=Rt(/[\dA-Za-z]/),jt=Rt(/[#-'*+\--9=?A-Z^-~]/);function Mt(e){return e!==null&&(e<32||e===127)}var Nt=Rt(/\d/),Pt=Rt(/[\dA-Fa-f]/),Ft=Rt(/[!-/:-@[-`{-~]/);function G(e){return e!==null&&e<-2}function K(e){return e!==null&&(e<0||e===32)}function q(e){return e===-2||e===-1||e===32}var It=Rt(/\p{P}|\p{S}/u),Lt=Rt(/\s/);function Rt(e){return t;function t(t){return t!==null&&t>-1&&e.test(String.fromCharCode(t))}}function zt(e){let t=[],n=-1,r=0,i=0;for(;++n<e.length;){let a=e.charCodeAt(n),o=``;if(a===37&&W(e.charCodeAt(n+1))&&W(e.charCodeAt(n+2)))i=2;else if(a<128)/[!#$&-;=?-Z_a-z~]/.test(String.fromCharCode(a))||(o=String.fromCharCode(a));else if(a>55295&&a<57344){let t=e.charCodeAt(n+1);a<56320&&t>56319&&t<57344?(o=String.fromCharCode(a,t),i=1):o=`�`}else o=String.fromCharCode(a);o&&=(t.push(e.slice(r,n),encodeURIComponent(o)),r=n+i+1,``),i&&=(n+=i,0)}return t.join(``)+e.slice(r)}function J(e,t,n,r){let i=r?r-1:1/0,a=0;return o;function o(r){return q(r)?(e.enter(n),s(r)):t(r)}function s(r){return q(r)&&a++<i?(e.consume(r),s):(e.exit(n),t(r))}}var Bt={tokenize:Vt};function Vt(e){let t=e.attempt(this.parser.constructs.contentInitial,r,i),n;return t;function r(n){if(n===null){e.consume(n);return}return e.enter(`lineEnding`),e.consume(n),e.exit(`lineEnding`),J(e,t,`linePrefix`)}function i(t){return e.enter(`paragraph`),a(t)}function a(t){let r=e.enter(`chunkText`,{contentType:`text`,previous:n});return n&&(n.next=r),n=r,o(t)}function o(t){if(t===null){e.exit(`chunkText`),e.exit(`paragraph`),e.consume(t);return}return G(t)?(e.consume(t),e.exit(`chunkText`),a):(e.consume(t),o)}}var Ht={tokenize:Wt},Ut={tokenize:Gt};function Wt(e){let t=this,n=[],r=0,i,a,o;return s;function s(i){if(r<n.length){let a=n[r];return t.containerState=a[1],e.attempt(a[0].continuation,c,l)(i)}return l(i)}function c(e){if(r++,t.containerState._closeFlow){t.containerState._closeFlow=void 0,i&&v();let n=t.events.length,a=n,o;for(;a--;)if(t.events[a][0]===`exit`&&t.events[a][1].type===`chunkFlow`){o=t.events[a][1].end;break}_(r);let s=n;for(;s<t.events.length;)t.events[s][1].end={...o},s++;return B(t.events,a+1,0,t.events.slice(n)),t.events.length=s,l(e)}return s(e)}function l(a){if(r===n.length){if(!i)return f(a);if(i.currentConstruct&&i.currentConstruct.concrete)return m(a);t.interrupt=!!(i.currentConstruct&&!i._gfmTableDynamicInterruptHack)}return t.containerState={},e.check(Ut,u,d)(a)}function u(e){return i&&v(),_(r),f(e)}function d(e){return t.parser.lazy[t.now().line]=r!==n.length,o=t.now().offset,m(e)}function f(n){return t.containerState={},e.attempt(Ut,p,m)(n)}function p(e){return r++,n.push([t.currentConstruct,t.containerState]),f(e)}function m(n){if(n===null){i&&v(),_(0),e.consume(n);return}return i||=t.parser.flow(t.now()),e.enter(`chunkFlow`,{_tokenizer:i,contentType:`flow`,previous:a}),h(n)}function h(n){if(n===null){g(e.exit(`chunkFlow`),!0),_(0),e.consume(n);return}return G(n)?(e.consume(n),g(e.exit(`chunkFlow`)),r=0,t.interrupt=void 0,s):(e.consume(n),h)}function g(e,n){let s=t.sliceStream(e);if(n&&s.push(null),e.previous=a,a&&(a.next=e),a=e,i.defineSkip(e.start),i.write(s),t.parser.lazy[e.start.line]){let e=i.events.length;for(;e--;)if(i.events[e][1].start.offset<o&&(!i.events[e][1].end||i.events[e][1].end.offset>o))return;let n=t.events.length,a=n,s,c;for(;a--;)if(t.events[a][0]===`exit`&&t.events[a][1].type===`chunkFlow`){if(s){c=t.events[a][1].end;break}s=!0}for(_(r),e=n;e<t.events.length;)t.events[e][1].end={...c},e++;B(t.events,a+1,0,t.events.slice(n)),t.events.length=e}}function _(r){let i=n.length;for(;i-->r;){let r=n[i];t.containerState=r[1],r[0].exit.call(t,e)}n.length=r}function v(){i.write([null]),a=void 0,i=void 0,t.containerState._closeFlow=void 0}}function Gt(e,t,n){return J(e,e.attempt(this.parser.constructs.document,t,n),`linePrefix`,this.parser.constructs.disable.null.includes(`codeIndented`)?void 0:4)}function Kt(e){if(e===null||K(e)||Lt(e))return 1;if(It(e))return 2}function qt(e,t,n){let r=[],i=-1;for(;++i<e.length;){let a=e[i].resolveAll;a&&!r.includes(a)&&(t=a(t,n),r.push(a))}return t}var Jt={name:`attention`,resolveAll:Yt,tokenize:Xt};function Yt(e,t){let n=-1,r,i,a,o,s,c,l,u;for(;++n<e.length;)if(e[n][0]===`enter`&&e[n][1].type===`attentionSequence`&&e[n][1]._close){for(r=n;r--;)if(e[r][0]===`exit`&&e[r][1].type===`attentionSequence`&&e[r][1]._open&&t.sliceSerialize(e[r][1]).charCodeAt(0)===t.sliceSerialize(e[n][1]).charCodeAt(0)){if((e[r][1]._close||e[n][1]._open)&&(e[n][1].end.offset-e[n][1].start.offset)%3&&!((e[r][1].end.offset-e[r][1].start.offset+e[n][1].end.offset-e[n][1].start.offset)%3))continue;c=e[r][1].end.offset-e[r][1].start.offset>1&&e[n][1].end.offset-e[n][1].start.offset>1?2:1;let d={...e[r][1].end},f={...e[n][1].start};Zt(d,-c),Zt(f,c),o={type:c>1?`strongSequence`:`emphasisSequence`,start:d,end:{...e[r][1].end}},s={type:c>1?`strongSequence`:`emphasisSequence`,start:{...e[n][1].start},end:f},a={type:c>1?`strongText`:`emphasisText`,start:{...e[r][1].end},end:{...e[n][1].start}},i={type:c>1?`strong`:`emphasis`,start:{...o.start},end:{...s.end}},e[r][1].end={...o.start},e[n][1].start={...s.end},l=[],e[r][1].end.offset-e[r][1].start.offset&&(l=V(l,[[`enter`,e[r][1],t],[`exit`,e[r][1],t]])),l=V(l,[[`enter`,i,t],[`enter`,o,t],[`exit`,o,t],[`enter`,a,t]]),l=V(l,qt(t.parser.constructs.insideSpan.null,e.slice(r+1,n),t)),l=V(l,[[`exit`,a,t],[`enter`,s,t],[`exit`,s,t],[`exit`,i,t]]),e[n][1].end.offset-e[n][1].start.offset?(u=2,l=V(l,[[`enter`,e[n][1],t],[`exit`,e[n][1],t]])):u=0,B(e,r-1,n-r+3,l),n=r+l.length-u-2;break}}for(n=-1;++n<e.length;)e[n][1].type===`attentionSequence`&&(e[n][1].type=`data`);return e}function Xt(e,t){let n=this.parser.constructs.attentionMarkers.null,r=this.previous,i=Kt(r),a;return o;function o(t){return a=t,e.enter(`attentionSequence`),s(t)}function s(o){if(o===a)return e.consume(o),s;let c=e.exit(`attentionSequence`),l=Kt(o),u=!l||l===2&&i||n.includes(o),d=!i||i===2&&l||n.includes(r);return c._open=!!(a===42?u:u&&(i||!d)),c._close=!!(a===42?d:d&&(l||!u)),t(o)}}function Zt(e,t){e.column+=t,e.offset+=t,e._bufferIndex+=t}var Qt={name:`autolink`,tokenize:$t};function $t(e,t,n){let r=0;return i;function i(t){return e.enter(`autolink`),e.enter(`autolinkMarker`),e.consume(t),e.exit(`autolinkMarker`),e.enter(`autolinkProtocol`),a}function a(t){return U(t)?(e.consume(t),o):t===64?n(t):l(t)}function o(e){return e===43||e===45||e===46||W(e)?(r=1,s(e)):l(e)}function s(t){return t===58?(e.consume(t),r=0,c):(t===43||t===45||t===46||W(t))&&r++<32?(e.consume(t),s):(r=0,l(t))}function c(r){return r===62?(e.exit(`autolinkProtocol`),e.enter(`autolinkMarker`),e.consume(r),e.exit(`autolinkMarker`),e.exit(`autolink`),t):r===null||r===32||r===60||Mt(r)?n(r):(e.consume(r),c)}function l(t){return t===64?(e.consume(t),u):jt(t)?(e.consume(t),l):n(t)}function u(e){return W(e)?d(e):n(e)}function d(n){return n===46?(e.consume(n),r=0,u):n===62?(e.exit(`autolinkProtocol`).type=`autolinkEmail`,e.enter(`autolinkMarker`),e.consume(n),e.exit(`autolinkMarker`),e.exit(`autolink`),t):f(n)}function f(t){if((t===45||W(t))&&r++<63){let n=t===45?f:d;return e.consume(t),n}return n(t)}}var en={partial:!0,tokenize:tn};function tn(e,t,n){return r;function r(t){return q(t)?J(e,i,`linePrefix`)(t):i(t)}function i(e){return e===null||G(e)?t(e):n(e)}}var nn={continuation:{tokenize:an},exit:on,name:`blockQuote`,tokenize:rn};function rn(e,t,n){let r=this;return i;function i(t){if(t===62){let n=r.containerState;return n.open||=(e.enter(`blockQuote`,{_container:!0}),!0),e.enter(`blockQuotePrefix`),e.enter(`blockQuoteMarker`),e.consume(t),e.exit(`blockQuoteMarker`),a}return n(t)}function a(n){return q(n)?(e.enter(`blockQuotePrefixWhitespace`),e.consume(n),e.exit(`blockQuotePrefixWhitespace`),e.exit(`blockQuotePrefix`),t):(e.exit(`blockQuotePrefix`),t(n))}}function an(e,t,n){let r=this;return i;function i(t){return q(t)?J(e,a,`linePrefix`,r.parser.constructs.disable.null.includes(`codeIndented`)?void 0:4)(t):a(t)}function a(r){return e.attempt(nn,t,n)(r)}}function on(e){e.exit(`blockQuote`)}var sn={name:`characterEscape`,tokenize:cn};function cn(e,t,n){return r;function r(t){return e.enter(`characterEscape`),e.enter(`escapeMarker`),e.consume(t),e.exit(`escapeMarker`),i}function i(r){return Ft(r)?(e.enter(`characterEscapeValue`),e.consume(r),e.exit(`characterEscapeValue`),e.exit(`characterEscape`),t):n(r)}}var ln={name:`characterReference`,tokenize:un};function un(e,t,n){let r=this,i=0,a,o;return s;function s(t){return e.enter(`characterReference`),e.enter(`characterReferenceMarker`),e.consume(t),e.exit(`characterReferenceMarker`),c}function c(t){return t===35?(e.enter(`characterReferenceMarkerNumeric`),e.consume(t),e.exit(`characterReferenceMarkerNumeric`),l):(e.enter(`characterReferenceValue`),a=31,o=W,u(t))}function l(t){return t===88||t===120?(e.enter(`characterReferenceMarkerHexadecimal`),e.consume(t),e.exit(`characterReferenceMarkerHexadecimal`),e.enter(`characterReferenceValue`),a=6,o=Pt,u):(e.enter(`characterReferenceValue`),a=7,o=Nt,u(t))}function u(s){if(s===59&&i){let i=e.exit(`characterReferenceValue`);return o===W&&!Tt(r.sliceSerialize(i))?n(s):(e.enter(`characterReferenceMarker`),e.consume(s),e.exit(`characterReferenceMarker`),e.exit(`characterReference`),t)}return o(s)&&i++<a?(e.consume(s),u):n(s)}}var dn={partial:!0,tokenize:mn},fn={concrete:!0,name:`codeFenced`,tokenize:pn};function pn(e,t,n){let r=this,i={partial:!0,tokenize:x},a=0,o=0,s;return c;function c(e){return l(e)}function l(t){let n=r.events[r.events.length-1];return a=n&&n[1].type===`linePrefix`?n[2].sliceSerialize(n[1],!0).length:0,s=t,e.enter(`codeFenced`),e.enter(`codeFencedFence`),e.enter(`codeFencedFenceSequence`),u(t)}function u(t){return t===s?(o++,e.consume(t),u):o<3?n(t):(e.exit(`codeFencedFenceSequence`),q(t)?J(e,d,`whitespace`)(t):d(t))}function d(n){return n===null||G(n)?(e.exit(`codeFencedFence`),r.interrupt?t(n):e.check(dn,h,b)(n)):(e.enter(`codeFencedFenceInfo`),e.enter(`chunkString`,{contentType:`string`}),f(n))}function f(t){return t===null||G(t)?(e.exit(`chunkString`),e.exit(`codeFencedFenceInfo`),d(t)):q(t)?(e.exit(`chunkString`),e.exit(`codeFencedFenceInfo`),J(e,p,`whitespace`)(t)):t===96&&t===s?n(t):(e.consume(t),f)}function p(t){return t===null||G(t)?d(t):(e.enter(`codeFencedFenceMeta`),e.enter(`chunkString`,{contentType:`string`}),m(t))}function m(t){return t===null||G(t)?(e.exit(`chunkString`),e.exit(`codeFencedFenceMeta`),d(t)):t===96&&t===s?n(t):(e.consume(t),m)}function h(t){return e.attempt(i,b,g)(t)}function g(t){return e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),_}function _(t){return a>0&&q(t)?J(e,v,`linePrefix`,a+1)(t):v(t)}function v(t){return t===null||G(t)?e.check(dn,h,b)(t):(e.enter(`codeFlowValue`),y(t))}function y(t){return t===null||G(t)?(e.exit(`codeFlowValue`),v(t)):(e.consume(t),y)}function b(n){return e.exit(`codeFenced`),t(n)}function x(e,t,n){let i=0;return a;function a(t){return e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),c}function c(t){return e.enter(`codeFencedFence`),q(t)?J(e,l,`linePrefix`,r.parser.constructs.disable.null.includes(`codeIndented`)?void 0:4)(t):l(t)}function l(t){return t===s?(e.enter(`codeFencedFenceSequence`),u(t)):n(t)}function u(t){return t===s?(i++,e.consume(t),u):i>=o?(e.exit(`codeFencedFenceSequence`),q(t)?J(e,d,`whitespace`)(t):d(t)):n(t)}function d(r){return r===null||G(r)?(e.exit(`codeFencedFence`),t(r)):n(r)}}}function mn(e,t,n){let r=this;return i;function i(t){return t===null?n(t):(e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),a)}function a(e){return r.parser.lazy[r.now().line]?n(e):t(e)}}var hn={name:`codeIndented`,tokenize:_n},gn={partial:!0,tokenize:vn};function _n(e,t,n){let r=this;return i;function i(t){return e.enter(`codeIndented`),J(e,a,`linePrefix`,5)(t)}function a(e){let t=r.events[r.events.length-1];return t&&t[1].type===`linePrefix`&&t[2].sliceSerialize(t[1],!0).length>=4?o(e):n(e)}function o(t){return t===null?c(t):G(t)?e.attempt(gn,o,c)(t):(e.enter(`codeFlowValue`),s(t))}function s(t){return t===null||G(t)?(e.exit(`codeFlowValue`),o(t)):(e.consume(t),s)}function c(n){return e.exit(`codeIndented`),t(n)}}function vn(e,t,n){let r=this;return i;function i(t){return r.parser.lazy[r.now().line]?n(t):G(t)?(e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),i):J(e,a,`linePrefix`,5)(t)}function a(e){let a=r.events[r.events.length-1];return a&&a[1].type===`linePrefix`&&a[2].sliceSerialize(a[1],!0).length>=4?t(e):G(e)?i(e):n(e)}}var yn={name:`codeText`,previous:xn,resolve:bn,tokenize:Sn};function bn(e){let t=e.length-4,n=3,r,i;if((e[n][1].type===`lineEnding`||e[n][1].type===`space`)&&(e[t][1].type===`lineEnding`||e[t][1].type===`space`)){for(r=n;++r<t;)if(e[r][1].type===`codeTextData`){e[n][1].type=`codeTextPadding`,e[t][1].type=`codeTextPadding`,n+=2,t-=2;break}}for(r=n-1,t++;++r<=t;)i===void 0?r!==t&&e[r][1].type!==`lineEnding`&&(i=r):(r===t||e[r][1].type===`lineEnding`)&&(e[i][1].type=`codeTextData`,r!==i+2&&(e[i][1].end=e[r-1][1].end,e.splice(i+2,r-i-2),t-=r-i-2,r=i+2),i=void 0);return e}function xn(e){return e!==96||this.events[this.events.length-1][1].type===`characterEscape`}function Sn(e,t,n){let r=0,i,a;return o;function o(t){return e.enter(`codeText`),e.enter(`codeTextSequence`),s(t)}function s(t){return t===96?(e.consume(t),r++,s):(e.exit(`codeTextSequence`),c(t))}function c(t){return t===null?n(t):t===32?(e.enter(`space`),e.consume(t),e.exit(`space`),c):t===96?(a=e.enter(`codeTextSequence`),i=0,u(t)):G(t)?(e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),c):(e.enter(`codeTextData`),l(t))}function l(t){return t===null||t===32||t===96||G(t)?(e.exit(`codeTextData`),c(t)):(e.consume(t),l)}function u(n){return n===96?(e.consume(n),i++,u):i===r?(e.exit(`codeTextSequence`),e.exit(`codeText`),t(n)):(a.type=`codeTextData`,l(n))}}var Cn=class{constructor(e){this.left=e?[...e]:[],this.right=[]}get(e){if(e<0||e>=this.left.length+this.right.length)throw RangeError("Cannot access index `"+e+"` in a splice buffer of size `"+(this.left.length+this.right.length)+"`");return e<this.left.length?this.left[e]:this.right[this.right.length-e+this.left.length-1]}get length(){return this.left.length+this.right.length}shift(){return this.setCursor(0),this.right.pop()}slice(e,t){let n=t??1/0;return n<this.left.length?this.left.slice(e,n):e>this.left.length?this.right.slice(this.right.length-n+this.left.length,this.right.length-e+this.left.length).reverse():this.left.slice(e).concat(this.right.slice(this.right.length-n+this.left.length).reverse())}splice(e,t,n){let r=t||0;this.setCursor(Math.trunc(e));let i=this.right.splice(this.right.length-r,1/0);return n&&wn(this.left,n),i.reverse()}pop(){return this.setCursor(1/0),this.left.pop()}push(e){this.setCursor(1/0),this.left.push(e)}pushMany(e){this.setCursor(1/0),wn(this.left,e)}unshift(e){this.setCursor(0),this.right.push(e)}unshiftMany(e){this.setCursor(0),wn(this.right,e.reverse())}setCursor(e){if(!(e===this.left.length||e>this.left.length&&this.right.length===0||e<0&&this.left.length===0)){if(e<this.left.length){let t=this.left.splice(e,1/0);wn(this.right,t.reverse())}else{let t=this.right.splice(this.left.length+this.right.length-e,1/0);wn(this.left,t.reverse())}}}};function wn(e,t){let n=0;if(t.length<1e4)e.push(...t);else for(;n<t.length;)e.push(...t.slice(n,n+1e4)),n+=1e4}function Tn(e){let t={},n=-1,r,i,a,o,s,c,l,u=new Cn(e);for(;++n<u.length;){for(;n in t;)n=t[n];if(r=u.get(n),n&&r[1].type===`chunkFlow`&&u.get(n-1)[1].type===`listItemPrefix`&&(c=r[1]._tokenizer.events,a=0,a<c.length&&c[a][1].type===`lineEndingBlank`&&(a+=2),a<c.length&&c[a][1].type===`content`))for(;++a<c.length&&c[a][1].type!==`content`;)c[a][1].type===`chunkText`&&(c[a][1]._isInFirstContentOfListItem=!0,a++);if(r[0]===`enter`)r[1].contentType&&(Object.assign(t,En(u,n)),n=t[n],l=!0);else if(r[1]._container){for(a=n,i=void 0;a--;)if(o=u.get(a),o[1].type===`lineEnding`||o[1].type===`lineEndingBlank`)o[0]===`enter`&&(i&&(u.get(i)[1].type=`lineEndingBlank`),o[1].type=`lineEnding`,i=a);else if(o[1].type!==`linePrefix`&&o[1].type!==`listItemIndent`)break;i&&(r[1].end={...u.get(i)[1].start},s=u.slice(i,n),s.unshift(r),u.splice(i,n-i+1,s))}}return B(e,0,1/0,u.slice(0)),!l}function En(e,t){let n=e.get(t)[1],r=e.get(t)[2],i=t-1,a=[],o=n._tokenizer;o||(o=r.parser[n.contentType](n.start),n._contentTypeTextTrailing&&(o._contentTypeTextTrailing=!0));let s=o.events,c=[],l={},u,d,f=-1,p=n,m=0,h=0,g=[h];for(;p;){for(;e.get(++i)[1]!==p;);a.push(i),p._tokenizer||(u=r.sliceStream(p),p.next||u.push(null),d&&o.defineSkip(p.start),p._isInFirstContentOfListItem&&(o._gfmTasklistFirstContentOfListItem=!0),o.write(u),p._isInFirstContentOfListItem&&(o._gfmTasklistFirstContentOfListItem=void 0)),d=p,p=p.next}for(p=n;++f<s.length;)s[f][0]===`exit`&&s[f-1][0]===`enter`&&s[f][1].type===s[f-1][1].type&&s[f][1].start.line!==s[f][1].end.line&&(h=f+1,g.push(h),p._tokenizer=void 0,p.previous=void 0,p=p.next);for(o.events=[],p?(p._tokenizer=void 0,p.previous=void 0):g.pop(),f=g.length;f--;){let t=s.slice(g[f],g[f+1]),n=a.pop();c.push([n,n+t.length-1]),e.splice(n,2,t)}for(c.reverse(),f=-1;++f<c.length;)l[m+c[f][0]]=m+c[f][1],m+=c[f][1]-c[f][0]-1;return l}var Dn={resolve:kn,tokenize:An},On={partial:!0,tokenize:jn};function kn(e){return Tn(e),e}function An(e,t){let n;return r;function r(t){return e.enter(`content`),n=e.enter(`chunkContent`,{contentType:`content`}),i(t)}function i(t){return t===null?a(t):G(t)?e.check(On,o,a)(t):(e.consume(t),i)}function a(n){return e.exit(`chunkContent`),e.exit(`content`),t(n)}function o(t){return e.consume(t),e.exit(`chunkContent`),n.next=e.enter(`chunkContent`,{contentType:`content`,previous:n}),n=n.next,i}}function jn(e,t,n){let r=this;return i;function i(t){return e.exit(`chunkContent`),e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),J(e,a,`linePrefix`)}function a(i){if(i===null||G(i))return n(i);let a=r.events[r.events.length-1];return!r.parser.constructs.disable.null.includes(`codeIndented`)&&a&&a[1].type===`linePrefix`&&a[2].sliceSerialize(a[1],!0).length>=4?t(i):e.interrupt(r.parser.constructs.flow,n,t)(i)}}function Mn(e,t,n,r,i,a,o,s,c){let l=c||1/0,u=0;return d;function d(t){return t===60?(e.enter(r),e.enter(i),e.enter(a),e.consume(t),e.exit(a),f):t===null||t===32||t===41||Mt(t)?n(t):(e.enter(r),e.enter(o),e.enter(s),e.enter(`chunkString`,{contentType:`string`}),h(t))}function f(n){return n===62?(e.enter(a),e.consume(n),e.exit(a),e.exit(i),e.exit(r),t):(e.enter(s),e.enter(`chunkString`,{contentType:`string`}),p(n))}function p(t){return t===62?(e.exit(`chunkString`),e.exit(s),f(t)):t===null||t===60||G(t)?n(t):(e.consume(t),t===92?m:p)}function m(t){return t===60||t===62||t===92?(e.consume(t),p):p(t)}function h(i){return!u&&(i===null||i===41||K(i))?(e.exit(`chunkString`),e.exit(s),e.exit(o),e.exit(r),t(i)):u<l&&i===40?(e.consume(i),u++,h):i===41?(e.consume(i),u--,h):i===null||i===32||i===40||Mt(i)?n(i):(e.consume(i),i===92?g:h)}function g(t){return t===40||t===41||t===92?(e.consume(t),h):h(t)}}function Nn(e,t,n,r,i,a){let o=this,s=0,c;return l;function l(t){return e.enter(r),e.enter(i),e.consume(t),e.exit(i),e.enter(a),u}function u(l){return s>999||l===null||l===91||l===93&&!c||l===94&&!s&&`_hiddenFootnoteSupport`in o.parser.constructs?n(l):l===93?(e.exit(a),e.enter(i),e.consume(l),e.exit(i),e.exit(r),t):G(l)?(e.enter(`lineEnding`),e.consume(l),e.exit(`lineEnding`),u):(e.enter(`chunkString`,{contentType:`string`}),d(l))}function d(t){return t===null||t===91||t===93||G(t)||s++>999?(e.exit(`chunkString`),u(t)):(e.consume(t),c||=!q(t),t===92?f:d)}function f(t){return t===91||t===92||t===93?(e.consume(t),s++,d):d(t)}}function Pn(e,t,n,r,i,a){let o;return s;function s(t){return t===34||t===39||t===40?(e.enter(r),e.enter(i),e.consume(t),e.exit(i),o=t===40?41:t,c):n(t)}function c(n){return n===o?(e.enter(i),e.consume(n),e.exit(i),e.exit(r),t):(e.enter(a),l(n))}function l(t){return t===o?(e.exit(a),c(o)):t===null?n(t):G(t)?(e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),J(e,l,`linePrefix`)):(e.enter(`chunkString`,{contentType:`string`}),u(t))}function u(t){return t===o||t===null||G(t)?(e.exit(`chunkString`),l(t)):(e.consume(t),t===92?d:u)}function d(t){return t===o||t===92?(e.consume(t),u):u(t)}}function Fn(e,t){let n;return r;function r(i){return G(i)?(e.enter(`lineEnding`),e.consume(i),e.exit(`lineEnding`),n=!0,r):q(i)?J(e,r,n?`linePrefix`:`lineSuffix`)(i):t(i)}}var In={name:`definition`,tokenize:Rn},Ln={partial:!0,tokenize:zn};function Rn(e,t,n){let r=this,i;return a;function a(t){return e.enter(`definition`),o(t)}function o(t){return Nn.call(r,e,s,n,`definitionLabel`,`definitionLabelMarker`,`definitionLabelString`)(t)}function s(t){return i=H(r.sliceSerialize(r.events[r.events.length-1][1]).slice(1,-1)),t===58?(e.enter(`definitionMarker`),e.consume(t),e.exit(`definitionMarker`),c):n(t)}function c(t){return K(t)?Fn(e,l)(t):l(t)}function l(t){return Mn(e,u,n,`definitionDestination`,`definitionDestinationLiteral`,`definitionDestinationLiteralMarker`,`definitionDestinationRaw`,`definitionDestinationString`)(t)}function u(t){return e.attempt(Ln,d,d)(t)}function d(t){return q(t)?J(e,f,`whitespace`)(t):f(t)}function f(a){return a===null||G(a)?(e.exit(`definition`),r.parser.defined.push(i),t(a)):n(a)}}function zn(e,t,n){return r;function r(t){return K(t)?Fn(e,i)(t):n(t)}function i(t){return Pn(e,a,n,`definitionTitle`,`definitionTitleMarker`,`definitionTitleString`)(t)}function a(t){return q(t)?J(e,o,`whitespace`)(t):o(t)}function o(e){return e===null||G(e)?t(e):n(e)}}var Bn={name:`hardBreakEscape`,tokenize:Vn};function Vn(e,t,n){return r;function r(t){return e.enter(`hardBreakEscape`),e.consume(t),i}function i(r){return G(r)?(e.exit(`hardBreakEscape`),t(r)):n(r)}}var Hn={name:`headingAtx`,resolve:Un,tokenize:Wn};function Un(e,t){let n=e.length-2,r=3,i,a;return e[r][1].type===`whitespace`&&(r+=2),n-2>r&&e[n][1].type===`whitespace`&&(n-=2),e[n][1].type===`atxHeadingSequence`&&(r===n-1||n-4>r&&e[n-2][1].type===`whitespace`)&&(n-=r+1===n?2:4),n>r&&(i={type:`atxHeadingText`,start:e[r][1].start,end:e[n][1].end},a={type:`chunkText`,start:e[r][1].start,end:e[n][1].end,contentType:`text`},B(e,r,n-r+1,[[`enter`,i,t],[`enter`,a,t],[`exit`,a,t],[`exit`,i,t]])),e}function Wn(e,t,n){let r=0;return i;function i(t){return e.enter(`atxHeading`),a(t)}function a(t){return e.enter(`atxHeadingSequence`),o(t)}function o(t){return t===35&&r++<6?(e.consume(t),o):t===null||K(t)?(e.exit(`atxHeadingSequence`),s(t)):n(t)}function s(n){return n===35?(e.enter(`atxHeadingSequence`),c(n)):n===null||G(n)?(e.exit(`atxHeading`),t(n)):q(n)?J(e,s,`whitespace`)(n):(e.enter(`atxHeadingText`),l(n))}function c(t){return t===35?(e.consume(t),c):(e.exit(`atxHeadingSequence`),s(t))}function l(t){return t===null||t===35||K(t)?(e.exit(`atxHeadingText`),s(t)):(e.consume(t),l)}}var Gn=`address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul`.split(`.`),Kn=[`pre`,`script`,`style`,`textarea`],qn={concrete:!0,name:`htmlFlow`,resolveTo:Xn,tokenize:Zn},Jn={partial:!0,tokenize:$n},Yn={partial:!0,tokenize:Qn};function Xn(e){let t=e.length;for(;t--&&(e[t][0]!==`enter`||e[t][1].type!==`htmlFlow`););return t>1&&e[t-2][1].type===`linePrefix`&&(e[t][1].start=e[t-2][1].start,e[t+1][1].start=e[t-2][1].start,e.splice(t-2,2)),e}function Zn(e,t,n){let r=this,i,a,o,s,c;return l;function l(e){return u(e)}function u(t){return e.enter(`htmlFlow`),e.enter(`htmlFlowData`),e.consume(t),d}function d(s){return s===33?(e.consume(s),f):s===47?(e.consume(s),a=!0,h):s===63?(e.consume(s),i=3,r.interrupt?t:j):U(s)?(e.consume(s),o=String.fromCharCode(s),g):n(s)}function f(a){return a===45?(e.consume(a),i=2,p):a===91?(e.consume(a),i=5,s=0,m):U(a)?(e.consume(a),i=4,r.interrupt?t:j):n(a)}function p(i){return i===45?(e.consume(i),r.interrupt?t:j):n(i)}function m(i){return i===`CDATA[`.charCodeAt(s++)?(e.consume(i),s===6?r.interrupt?t:D:m):n(i)}function h(t){return U(t)?(e.consume(t),o=String.fromCharCode(t),g):n(t)}function g(s){if(s===null||s===47||s===62||K(s)){let c=s===47,l=o.toLowerCase();return!c&&!a&&Kn.includes(l)?(i=1,r.interrupt?t(s):D(s)):Gn.includes(o.toLowerCase())?(i=6,c?(e.consume(s),_):r.interrupt?t(s):D(s)):(i=7,r.interrupt&&!r.parser.lazy[r.now().line]?n(s):a?v(s):y(s))}return s===45||W(s)?(e.consume(s),o+=String.fromCharCode(s),g):n(s)}function _(i){return i===62?(e.consume(i),r.interrupt?t:D):n(i)}function v(t){return q(t)?(e.consume(t),v):E(t)}function y(t){return t===47?(e.consume(t),E):t===58||t===95||U(t)?(e.consume(t),b):q(t)?(e.consume(t),y):E(t)}function b(t){return t===45||t===46||t===58||t===95||W(t)?(e.consume(t),b):x(t)}function x(t){return t===61?(e.consume(t),S):q(t)?(e.consume(t),x):y(t)}function S(t){return t===null||t===60||t===61||t===62||t===96?n(t):t===34||t===39?(e.consume(t),c=t,C):q(t)?(e.consume(t),S):w(t)}function C(t){return t===c?(e.consume(t),c=null,T):t===null||G(t)?n(t):(e.consume(t),C)}function w(t){return t===null||t===34||t===39||t===47||t===60||t===61||t===62||t===96||K(t)?x(t):(e.consume(t),w)}function T(e){return e===47||e===62||q(e)?y(e):n(e)}function E(t){return t===62?(e.consume(t),ee):n(t)}function ee(t){return t===null||G(t)?D(t):q(t)?(e.consume(t),ee):n(t)}function D(t){return t===45&&i===2?(e.consume(t),O):t===60&&i===1?(e.consume(t),k):t===62&&i===4?(e.consume(t),M):t===63&&i===3?(e.consume(t),j):t===93&&i===5?(e.consume(t),ie):G(t)&&(i===6||i===7)?(e.exit(`htmlFlowData`),e.check(Jn,ae,te)(t)):t===null||G(t)?(e.exit(`htmlFlowData`),te(t)):(e.consume(t),D)}function te(t){return e.check(Yn,ne,ae)(t)}function ne(t){return e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),re}function re(t){return t===null||G(t)?te(t):(e.enter(`htmlFlowData`),D(t))}function O(t){return t===45?(e.consume(t),j):D(t)}function k(t){return t===47?(e.consume(t),o=``,A):D(t)}function A(t){if(t===62){let n=o.toLowerCase();return Kn.includes(n)?(e.consume(t),M):D(t)}return U(t)&&o.length<8?(e.consume(t),o+=String.fromCharCode(t),A):D(t)}function ie(t){return t===93?(e.consume(t),j):D(t)}function j(t){return t===62?(e.consume(t),M):t===45&&i===2?(e.consume(t),j):D(t)}function M(t){return t===null||G(t)?(e.exit(`htmlFlowData`),ae(t)):(e.consume(t),M)}function ae(n){return e.exit(`htmlFlow`),t(n)}}function Qn(e,t,n){let r=this;return i;function i(t){return G(t)?(e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),a):n(t)}function a(e){return r.parser.lazy[r.now().line]?n(e):t(e)}}function $n(e,t,n){return r;function r(r){return e.enter(`lineEnding`),e.consume(r),e.exit(`lineEnding`),e.attempt(en,t,n)}}var er={name:`htmlText`,tokenize:tr};function tr(e,t,n){let r=this,i,a,o;return s;function s(t){return e.enter(`htmlText`),e.enter(`htmlTextData`),e.consume(t),c}function c(t){return t===33?(e.consume(t),l):t===47?(e.consume(t),x):t===63?(e.consume(t),y):U(t)?(e.consume(t),w):n(t)}function l(t){return t===45?(e.consume(t),u):t===91?(e.consume(t),a=0,m):U(t)?(e.consume(t),v):n(t)}function u(t){return t===45?(e.consume(t),p):n(t)}function d(t){return t===null?n(t):t===45?(e.consume(t),f):G(t)?(o=d,k(t)):(e.consume(t),d)}function f(t){return t===45?(e.consume(t),p):d(t)}function p(e){return e===62?O(e):e===45?f(e):d(e)}function m(t){return t===`CDATA[`.charCodeAt(a++)?(e.consume(t),a===6?h:m):n(t)}function h(t){return t===null?n(t):t===93?(e.consume(t),g):G(t)?(o=h,k(t)):(e.consume(t),h)}function g(t){return t===93?(e.consume(t),_):h(t)}function _(t){return t===62?O(t):t===93?(e.consume(t),_):h(t)}function v(t){return t===null||t===62?O(t):G(t)?(o=v,k(t)):(e.consume(t),v)}function y(t){return t===null?n(t):t===63?(e.consume(t),b):G(t)?(o=y,k(t)):(e.consume(t),y)}function b(e){return e===62?O(e):y(e)}function x(t){return U(t)?(e.consume(t),S):n(t)}function S(t){return t===45||W(t)?(e.consume(t),S):C(t)}function C(t){return G(t)?(o=C,k(t)):q(t)?(e.consume(t),C):O(t)}function w(t){return t===45||W(t)?(e.consume(t),w):t===47||t===62||K(t)?T(t):n(t)}function T(t){return t===47?(e.consume(t),O):t===58||t===95||U(t)?(e.consume(t),E):G(t)?(o=T,k(t)):q(t)?(e.consume(t),T):O(t)}function E(t){return t===45||t===46||t===58||t===95||W(t)?(e.consume(t),E):ee(t)}function ee(t){return t===61?(e.consume(t),D):G(t)?(o=ee,k(t)):q(t)?(e.consume(t),ee):T(t)}function D(t){return t===null||t===60||t===61||t===62||t===96?n(t):t===34||t===39?(e.consume(t),i=t,te):G(t)?(o=D,k(t)):q(t)?(e.consume(t),D):(e.consume(t),ne)}function te(t){return t===i?(e.consume(t),i=void 0,re):t===null?n(t):G(t)?(o=te,k(t)):(e.consume(t),te)}function ne(t){return t===null||t===34||t===39||t===60||t===61||t===96?n(t):t===47||t===62||K(t)?T(t):(e.consume(t),ne)}function re(e){return e===47||e===62||K(e)?T(e):n(e)}function O(r){return r===62?(e.consume(r),e.exit(`htmlTextData`),e.exit(`htmlText`),t):n(r)}function k(t){return e.exit(`htmlTextData`),e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),A}function A(t){return q(t)?J(e,ie,`linePrefix`,r.parser.constructs.disable.null.includes(`codeIndented`)?void 0:4)(t):ie(t)}function ie(t){return e.enter(`htmlTextData`),o(t)}}var nr={name:`labelEnd`,resolveAll:or,resolveTo:sr,tokenize:cr},rr={tokenize:lr},ir={tokenize:ur},ar={tokenize:dr};function or(e){let t=-1,n=[];for(;++t<e.length;){let r=e[t][1];if(n.push(e[t]),r.type===`labelImage`||r.type===`labelLink`||r.type===`labelEnd`){let e=r.type===`labelImage`?4:2;r.type=`data`,t+=e}}return e.length!==n.length&&B(e,0,e.length,n),e}function sr(e,t){let n=e.length,r=0,i,a,o,s;for(;n--;)if(i=e[n][1],a){if(i.type===`link`||i.type===`labelLink`&&i._inactive)break;e[n][0]===`enter`&&i.type===`labelLink`&&(i._inactive=!0)}else if(o){if(e[n][0]===`enter`&&(i.type===`labelImage`||i.type===`labelLink`)&&!i._balanced&&(a=n,i.type!==`labelLink`)){r=2;break}}else i.type===`labelEnd`&&(o=n);let c={type:e[a][1].type===`labelLink`?`link`:`image`,start:{...e[a][1].start},end:{...e[e.length-1][1].end}},l={type:`label`,start:{...e[a][1].start},end:{...e[o][1].end}},u={type:`labelText`,start:{...e[a+r+2][1].end},end:{...e[o-2][1].start}};return s=[[`enter`,c,t],[`enter`,l,t]],s=V(s,e.slice(a+1,a+r+3)),s=V(s,[[`enter`,u,t]]),s=V(s,qt(t.parser.constructs.insideSpan.null,e.slice(a+r+4,o-3),t)),s=V(s,[[`exit`,u,t],e[o-2],e[o-1],[`exit`,l,t]]),s=V(s,e.slice(o+1)),s=V(s,[[`exit`,c,t]]),B(e,a,e.length,s),e}function cr(e,t,n){let r=this,i=r.events.length,a,o;for(;i--;)if((r.events[i][1].type===`labelImage`||r.events[i][1].type===`labelLink`)&&!r.events[i][1]._balanced){a=r.events[i][1];break}return s;function s(t){return a?a._inactive?d(t):(o=r.parser.defined.includes(H(r.sliceSerialize({start:a.end,end:r.now()}))),e.enter(`labelEnd`),e.enter(`labelMarker`),e.consume(t),e.exit(`labelMarker`),e.exit(`labelEnd`),c):n(t)}function c(t){return t===40?e.attempt(rr,u,o?u:d)(t):t===91?e.attempt(ir,u,o?l:d)(t):o?u(t):d(t)}function l(t){return e.attempt(ar,u,d)(t)}function u(e){return t(e)}function d(e){return a._balanced=!0,n(e)}}function lr(e,t,n){return r;function r(t){return e.enter(`resource`),e.enter(`resourceMarker`),e.consume(t),e.exit(`resourceMarker`),i}function i(t){return K(t)?Fn(e,a)(t):a(t)}function a(t){return t===41?u(t):Mn(e,o,s,`resourceDestination`,`resourceDestinationLiteral`,`resourceDestinationLiteralMarker`,`resourceDestinationRaw`,`resourceDestinationString`,32)(t)}function o(t){return K(t)?Fn(e,c)(t):u(t)}function s(e){return n(e)}function c(t){return t===34||t===39||t===40?Pn(e,l,n,`resourceTitle`,`resourceTitleMarker`,`resourceTitleString`)(t):u(t)}function l(t){return K(t)?Fn(e,u)(t):u(t)}function u(r){return r===41?(e.enter(`resourceMarker`),e.consume(r),e.exit(`resourceMarker`),e.exit(`resource`),t):n(r)}}function ur(e,t,n){let r=this;return i;function i(t){return Nn.call(r,e,a,o,`reference`,`referenceMarker`,`referenceString`)(t)}function a(e){return r.parser.defined.includes(H(r.sliceSerialize(r.events[r.events.length-1][1]).slice(1,-1)))?t(e):n(e)}function o(e){return n(e)}}function dr(e,t,n){return r;function r(t){return e.enter(`reference`),e.enter(`referenceMarker`),e.consume(t),e.exit(`referenceMarker`),i}function i(r){return r===93?(e.enter(`referenceMarker`),e.consume(r),e.exit(`referenceMarker`),e.exit(`reference`),t):n(r)}}var fr={name:`labelStartImage`,resolveAll:nr.resolveAll,tokenize:pr};function pr(e,t,n){let r=this;return i;function i(t){return e.enter(`labelImage`),e.enter(`labelImageMarker`),e.consume(t),e.exit(`labelImageMarker`),a}function a(t){return t===91?(e.enter(`labelMarker`),e.consume(t),e.exit(`labelMarker`),e.exit(`labelImage`),o):n(t)}function o(e){return e===94&&`_hiddenFootnoteSupport`in r.parser.constructs?n(e):t(e)}}var mr={name:`labelStartLink`,resolveAll:nr.resolveAll,tokenize:hr};function hr(e,t,n){let r=this;return i;function i(t){return e.enter(`labelLink`),e.enter(`labelMarker`),e.consume(t),e.exit(`labelMarker`),e.exit(`labelLink`),a}function a(e){return e===94&&`_hiddenFootnoteSupport`in r.parser.constructs?n(e):t(e)}}var gr={name:`lineEnding`,tokenize:_r};function _r(e,t){return n;function n(n){return e.enter(`lineEnding`),e.consume(n),e.exit(`lineEnding`),J(e,t,`linePrefix`)}}var vr={name:`thematicBreak`,tokenize:yr};function yr(e,t,n){let r=0,i;return a;function a(t){return e.enter(`thematicBreak`),o(t)}function o(e){return i=e,s(e)}function s(a){return a===i?(e.enter(`thematicBreakSequence`),c(a)):r>=3&&(a===null||G(a))?(e.exit(`thematicBreak`),t(a)):n(a)}function c(t){return t===i?(e.consume(t),r++,c):(e.exit(`thematicBreakSequence`),q(t)?J(e,s,`whitespace`)(t):s(t))}}var Y={continuation:{tokenize:Cr},exit:Tr,name:`list`,tokenize:Sr},br={partial:!0,tokenize:Er},xr={partial:!0,tokenize:wr};function Sr(e,t,n){let r=this,i=r.events[r.events.length-1],a=i&&i[1].type===`linePrefix`?i[2].sliceSerialize(i[1],!0).length:0,o=0;return s;function s(t){let i=r.containerState.type||(t===42||t===43||t===45?`listUnordered`:`listOrdered`);if(i===`listUnordered`?!r.containerState.marker||t===r.containerState.marker:Nt(t)){if(r.containerState.type||(r.containerState.type=i,e.enter(i,{_container:!0})),i===`listUnordered`)return e.enter(`listItemPrefix`),t===42||t===45?e.check(vr,n,l)(t):l(t);if(!r.interrupt||t===49)return e.enter(`listItemPrefix`),e.enter(`listItemValue`),c(t)}return n(t)}function c(t){return Nt(t)&&++o<10?(e.consume(t),c):(!r.interrupt||o<2)&&(r.containerState.marker?t===r.containerState.marker:t===41||t===46)?(e.exit(`listItemValue`),l(t)):n(t)}function l(t){return e.enter(`listItemMarker`),e.consume(t),e.exit(`listItemMarker`),r.containerState.marker=r.containerState.marker||t,e.check(en,r.interrupt?n:u,e.attempt(br,f,d))}function u(e){return r.containerState.initialBlankLine=!0,a++,f(e)}function d(t){return q(t)?(e.enter(`listItemPrefixWhitespace`),e.consume(t),e.exit(`listItemPrefixWhitespace`),f):n(t)}function f(n){return r.containerState.size=a+r.sliceSerialize(e.exit(`listItemPrefix`),!0).length,t(n)}}function Cr(e,t,n){let r=this;return r.containerState._closeFlow=void 0,e.check(en,i,a);function i(n){return r.containerState.furtherBlankLines=r.containerState.furtherBlankLines||r.containerState.initialBlankLine,J(e,t,`listItemIndent`,r.containerState.size+1)(n)}function a(n){return r.containerState.furtherBlankLines||!q(n)?(r.containerState.furtherBlankLines=void 0,r.containerState.initialBlankLine=void 0,o(n)):(r.containerState.furtherBlankLines=void 0,r.containerState.initialBlankLine=void 0,e.attempt(xr,t,o)(n))}function o(i){return r.containerState._closeFlow=!0,r.interrupt=void 0,J(e,e.attempt(Y,t,n),`linePrefix`,r.parser.constructs.disable.null.includes(`codeIndented`)?void 0:4)(i)}}function wr(e,t,n){let r=this;return J(e,i,`listItemIndent`,r.containerState.size+1);function i(e){let i=r.events[r.events.length-1];return i&&i[1].type===`listItemIndent`&&i[2].sliceSerialize(i[1],!0).length===r.containerState.size?t(e):n(e)}}function Tr(e){e.exit(this.containerState.type)}function Er(e,t,n){let r=this;return J(e,i,`listItemPrefixWhitespace`,r.parser.constructs.disable.null.includes(`codeIndented`)?void 0:5);function i(e){let i=r.events[r.events.length-1];return!q(e)&&i&&i[1].type===`listItemPrefixWhitespace`?t(e):n(e)}}var Dr={name:`setextUnderline`,resolveTo:Or,tokenize:kr};function Or(e,t){let n=e.length,r,i,a;for(;n--;)if(e[n][0]===`enter`){if(e[n][1].type===`content`){r=n;break}e[n][1].type===`paragraph`&&(i=n)}else e[n][1].type===`content`&&e.splice(n,1),!a&&e[n][1].type===`definition`&&(a=n);let o={type:`setextHeading`,start:{...e[r][1].start},end:{...e[e.length-1][1].end}};return e[i][1].type=`setextHeadingText`,a?(e.splice(i,0,[`enter`,o,t]),e.splice(a+1,0,[`exit`,e[r][1],t]),e[r][1].end={...e[a][1].end}):e[r][1]=o,e.push([`exit`,o,t]),e}function kr(e,t,n){let r=this,i;return a;function a(t){let a=r.events.length,s;for(;a--;)if(r.events[a][1].type!==`lineEnding`&&r.events[a][1].type!==`linePrefix`&&r.events[a][1].type!==`content`){s=r.events[a][1].type===`paragraph`;break}return!r.parser.lazy[r.now().line]&&(r.interrupt||s)?(e.enter(`setextHeadingLine`),i=t,o(t)):n(t)}function o(t){return e.enter(`setextHeadingLineSequence`),s(t)}function s(t){return t===i?(e.consume(t),s):(e.exit(`setextHeadingLineSequence`),q(t)?J(e,c,`lineSuffix`)(t):c(t))}function c(r){return r===null||G(r)?(e.exit(`setextHeadingLine`),t(r)):n(r)}}var Ar={tokenize:jr};function jr(e){let t=this,n=e.attempt(en,r,e.attempt(this.parser.constructs.flowInitial,i,J(e,e.attempt(this.parser.constructs.flow,i,e.attempt(Dn,i)),`linePrefix`)));return n;function r(r){if(r===null){e.consume(r);return}return e.enter(`lineEndingBlank`),e.consume(r),e.exit(`lineEndingBlank`),t.currentConstruct=void 0,n}function i(r){if(r===null){e.consume(r);return}return e.enter(`lineEnding`),e.consume(r),e.exit(`lineEnding`),t.currentConstruct=void 0,n}}var Mr={resolveAll:Ir()},Nr=Fr(`string`),Pr=Fr(`text`);function Fr(e){return{resolveAll:Ir(e===`text`?Lr:void 0),tokenize:t};function t(t){let n=this,r=this.parser.constructs[e],i=t.attempt(r,a,o);return a;function a(e){return c(e)?i(e):o(e)}function o(e){if(e===null){t.consume(e);return}return t.enter(`data`),t.consume(e),s}function s(e){return c(e)?(t.exit(`data`),i(e)):(t.consume(e),s)}function c(e){if(e===null)return!0;let t=r[e],i=-1;if(t)for(;++i<t.length;){let e=t[i];if(!e.previous||e.previous.call(n,n.previous))return!0}return!1}}}function Ir(e){return t;function t(t,n){let r=-1,i;for(;++r<=t.length;)i===void 0?t[r]&&t[r][1].type===`data`&&(i=r,r++):(!t[r]||t[r][1].type!==`data`)&&(r!==i+2&&(t[i][1].end=t[r-1][1].end,t.splice(i+2,r-i-2),r=i+2),i=void 0);return e?e(t,n):t}}function Lr(e,t){let n=0;for(;++n<=e.length;)if((n===e.length||e[n][1].type===`lineEnding`)&&e[n-1][1].type===`data`){let r=e[n-1][1],i=t.sliceStream(r),a=i.length,o=-1,s=0,c;for(;a--;){let e=i[a];if(typeof e==`string`){for(o=e.length;e.charCodeAt(o-1)===32;)s++,o--;if(o)break;o=-1}else if(e===-2)c=!0,s++;else if(e!==-1){a++;break}}if(t._contentTypeTextTrailing&&n===e.length&&(s=0),s){let i={type:n===e.length||c||s<2?`lineSuffix`:`hardBreakTrailing`,start:{_bufferIndex:a?o:r.start._bufferIndex+o,_index:r.start._index+a,line:r.end.line,column:r.end.column-s,offset:r.end.offset-s},end:{...r.end}};r.end={...i.start},r.start.offset===r.end.offset?Object.assign(r,i):(e.splice(n,0,[`enter`,i,t],[`exit`,i,t]),n+=2)}n++}return e}var Rr=r({attentionMarkers:()=>Kr,contentInitial:()=>Br,disable:()=>qr,document:()=>zr,flow:()=>Hr,flowInitial:()=>Vr,insideSpan:()=>Gr,string:()=>Ur,text:()=>Wr}),zr={42:Y,43:Y,45:Y,48:Y,49:Y,50:Y,51:Y,52:Y,53:Y,54:Y,55:Y,56:Y,57:Y,62:nn},Br={91:In},Vr={[-2]:hn,[-1]:hn,32:hn},Hr={35:Hn,42:vr,45:[Dr,vr],60:qn,61:Dr,95:vr,96:fn,126:fn},Ur={38:ln,92:sn},Wr={[-5]:gr,[-4]:gr,[-3]:gr,33:fr,38:ln,42:Jt,60:[Qt,er],91:mr,92:[Bn,sn],93:nr,95:Jt,96:yn},Gr={null:[Jt,Mr]},Kr={null:[42,95]},qr={null:[]};function Jr(e,t,n){let r={_bufferIndex:-1,_index:0,line:n&&n.line||1,column:n&&n.column||1,offset:n&&n.offset||0},i={},a=[],o=[],s=[],c={attempt:C(x),check:C(S),consume:v,enter:y,exit:b,interrupt:C(S,{interrupt:!0})},l={code:null,containerState:{},defineSkip:h,events:[],now:m,parser:e,previous:null,sliceSerialize:f,sliceStream:p,write:d},u=t.tokenize.call(l,c);return t.resolveAll&&a.push(t),l;function d(e){return o=V(o,e),g(),o[o.length-1]===null?(w(t,0),l.events=qt(a,l.events,l),l.events):[]}function f(e,t){return Xr(p(e),t)}function p(e){return Yr(o,e)}function m(){let{_bufferIndex:e,_index:t,line:n,column:i,offset:a}=r;return{_bufferIndex:e,_index:t,line:n,column:i,offset:a}}function h(e){i[e.line]=e.column,E()}function g(){let e;for(;r._index<o.length;){let t=o[r._index];if(typeof t==`string`)for(e=r._index,r._bufferIndex<0&&(r._bufferIndex=0);r._index===e&&r._bufferIndex<t.length;)_(t.charCodeAt(r._bufferIndex));else _(t)}}function _(e){u=u(e)}function v(e){G(e)?(r.line++,r.column=1,r.offset+=e===-3?2:1,E()):e!==-1&&(r.column++,r.offset++),r._bufferIndex<0?r._index++:(r._bufferIndex++,r._bufferIndex===o[r._index].length&&(r._bufferIndex=-1,r._index++)),l.previous=e}function y(e,t){let n=t||{};return n.type=e,n.start=m(),l.events.push([`enter`,n,l]),s.push(n),n}function b(e){let t=s.pop();return t.end=m(),l.events.push([`exit`,t,l]),t}function x(e,t){w(e,t.from)}function S(e,t){t.restore()}function C(e,t){return n;function n(n,r,i){let a,o,s,u;return Array.isArray(n)?f(n):`tokenize`in n?f([n]):d(n);function d(e){return t;function t(t){let n=t!==null&&e[t],r=t!==null&&e.null;return f([...Array.isArray(n)?n:n?[n]:[],...Array.isArray(r)?r:r?[r]:[]])(t)}}function f(e){return a=e,o=0,e.length===0?i:p(e[o])}function p(e){return n;function n(n){return u=T(),s=e,e.partial||(l.currentConstruct=e),e.name&&l.parser.constructs.disable.null.includes(e.name)?h(n):e.tokenize.call(t?Object.assign(Object.create(l),t):l,c,m,h)(n)}}function m(t){return e(s,u),r}function h(e){return u.restore(),++o<a.length?p(a[o]):i}}}function w(e,t){e.resolveAll&&!a.includes(e)&&a.push(e),e.resolve&&B(l.events,t,l.events.length-t,e.resolve(l.events.slice(t),l)),e.resolveTo&&(l.events=e.resolveTo(l.events,l))}function T(){let e=m(),t=l.previous,n=l.currentConstruct,i=l.events.length,a=Array.from(s);return{from:i,restore:o};function o(){r=e,l.previous=t,l.currentConstruct=n,l.events.length=i,s=a,E()}}function E(){r.line in i&&r.column<2&&(r.column=i[r.line],r.offset+=i[r.line]-1)}}function Yr(e,t){let n=t.start._index,r=t.start._bufferIndex,i=t.end._index,a=t.end._bufferIndex,o;if(n===i)o=[e[n].slice(r,a)];else{if(o=e.slice(n,i),r>-1){let e=o[0];typeof e==`string`?o[0]=e.slice(r):o.shift()}a>0&&o.push(e[i].slice(0,a))}return o}function Xr(e,t){let n=-1,r=[],i;for(;++n<e.length;){let a=e[n],o;if(typeof a==`string`)o=a;else switch(a){case-5:o=`\r`;break;case-4:o=`
`;break;case-3:o=`\r
`;break;case-2:o=t?` `:`	`;break;case-1:if(!t&&i)continue;o=` `;break;default:o=String.fromCharCode(a)}i=a===-2,r.push(o)}return r.join(``)}function Zr(e){let t={constructs:Dt([Rr,...(e||{}).extensions||[]]),content:n(Bt),defined:[],document:n(Ht),flow:n(Ar),lazy:{},string:n(Nr),text:n(Pr)};return t;function n(e){return n;function n(n){return Jr(t,e,n)}}}function Qr(e){for(;!Tn(e););return e}var $r=/[\0\t\n\r]/g;function ei(){let e=1,t=``,n=!0,r;return i;function i(i,a,o){let s=[],c,l,u,d,f;for(i=t+(typeof i==`string`?i.toString():new TextDecoder(a||void 0).decode(i)),u=0,t=``,n&&=(i.charCodeAt(0)===65279&&u++,void 0);u<i.length;){if($r.lastIndex=u,c=$r.exec(i),d=c&&c.index!==void 0?c.index:i.length,f=i.charCodeAt(d),!c){t=i.slice(u);break}if(f===10&&u===d&&r)s.push(-3),r=void 0;else switch(r&&=(s.push(-5),void 0),u<d&&(s.push(i.slice(u,d)),e+=d-u),f){case 0:s.push(65533),e++;break;case 9:for(l=Math.ceil(e/4)*4,s.push(-2);e++<l;)s.push(-1);break;case 10:s.push(-4),e=1;break;default:r=!0,e=1}u=d+1}return o&&(r&&s.push(-5),t&&s.push(t),s.push(null)),s}}var ti=/\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;function ni(e){return e.replace(ti,ri)}function ri(e,t,n){if(t)return t;if(n.charCodeAt(0)===35){let e=n.charCodeAt(1),t=e===120||e===88;return At(n.slice(t?2:1),t?16:10)}return Tt(n)||e}var ii={}.hasOwnProperty;function ai(e,t,n){return t&&typeof t==`object`&&(n=t,t=void 0),oi(n)(Qr(Zr(n).document().write(ei()(e,t,!0))))}function oi(e){let t={transforms:[],canContainEols:[`emphasis`,`fragment`,`heading`,`paragraph`,`strong`],enter:{autolink:a(ge),autolinkProtocol:T,autolinkEmail:T,atxHeading:a(fe),blockQuote:a(L),characterEscape:T,characterReference:T,codeFenced:a(R),codeFencedFenceInfo:o,codeFencedFenceMeta:o,codeIndented:a(R,o),codeText:a(le,o),codeTextData:T,data:T,codeFlowValue:T,definition:a(ue),definitionDestinationString:o,definitionLabelString:o,definitionTitleString:o,emphasis:a(de),hardBreakEscape:a(pe),hardBreakTrailing:a(pe),htmlFlow:a(me,o),htmlFlowData:T,htmlText:a(me,o),htmlTextData:T,image:a(he),label:o,link:a(ge),listItem:a(ve),listItemValue:f,listOrdered:a(_e,d),listUnordered:a(_e),paragraph:a(ye),reference:oe,referenceString:o,resourceDestinationString:o,resourceTitleString:o,setextHeading:a(fe),strong:a(be),thematicBreak:a(Se)},exit:{atxHeading:c(),atxHeadingSequence:x,autolink:c(),autolinkEmail:ce,autolinkProtocol:I,blockQuote:c(),characterEscapeValue:E,characterReferenceMarkerHexadecimal:P,characterReferenceMarkerNumeric:P,characterReferenceValue:se,characterReference:F,codeFenced:c(g),codeFencedFence:h,codeFencedFenceInfo:p,codeFencedFenceMeta:m,codeFlowValue:E,codeIndented:c(_),codeText:c(re),codeTextData:E,data:E,definition:c(),definitionDestinationString:b,definitionLabelString:v,definitionTitleString:y,emphasis:c(),hardBreakEscape:c(D),hardBreakTrailing:c(D),htmlFlow:c(te),htmlFlowData:E,htmlText:c(ne),htmlTextData:E,image:c(k),label:ie,labelText:A,lineEnding:ee,link:c(O),listItem:c(),listOrdered:c(),listUnordered:c(),paragraph:c(),referenceString:N,resourceDestinationString:j,resourceTitleString:M,resource:ae,setextHeading:c(w),setextHeadingLineSequence:C,setextHeadingText:S,strong:c(),thematicBreak:c()}};ci(t,(e||{}).mdastExtensions||[]);let n={};return r;function r(e){let r={type:`root`,children:[]},a={stack:[r],tokenStack:[],config:t,enter:s,exit:l,buffer:o,resume:u,data:n},c=[],d=-1;for(;++d<e.length;)(e[d][1].type===`listOrdered`||e[d][1].type===`listUnordered`)&&(e[d][0]===`enter`?c.push(d):d=i(e,c.pop(),d));for(d=-1;++d<e.length;){let n=t[e[d][0]];ii.call(n,e[d][1].type)&&n[e[d][1].type].call(Object.assign({sliceSerialize:e[d][2].sliceSerialize},a),e[d][1])}if(a.tokenStack.length>0){let e=a.tokenStack[a.tokenStack.length-1];(e[1]||ui).call(a,void 0,e[0])}for(r.position={start:si(e.length>0?e[0][1].start:{line:1,column:1,offset:0}),end:si(e.length>0?e[e.length-2][1].end:{line:1,column:1,offset:0})},d=-1;++d<t.transforms.length;)r=t.transforms[d](r)||r;return r}function i(e,t,n){let r=t-1,i=-1,a=!1,o,s,c,l;for(;++r<=n;){let t=e[r];switch(t[1].type){case`listUnordered`:case`listOrdered`:case`blockQuote`:t[0]===`enter`?i++:i--,l=void 0;break;case`lineEndingBlank`:t[0]===`enter`&&(o&&!l&&!i&&!c&&(c=r),l=void 0);break;case`linePrefix`:case`listItemValue`:case`listItemMarker`:case`listItemPrefix`:case`listItemPrefixWhitespace`:break;default:l=void 0}if(!i&&t[0]===`enter`&&t[1].type===`listItemPrefix`||i===-1&&t[0]===`exit`&&(t[1].type===`listUnordered`||t[1].type===`listOrdered`)){if(o){let i=r;for(s=void 0;i--;){let t=e[i];if(t[1].type===`lineEnding`||t[1].type===`lineEndingBlank`){if(t[0]===`exit`)continue;s&&(e[s][1].type=`lineEndingBlank`,a=!0),t[1].type=`lineEnding`,s=i}else if(t[1].type!==`linePrefix`&&t[1].type!==`blockQuotePrefix`&&t[1].type!==`blockQuotePrefixWhitespace`&&t[1].type!==`blockQuoteMarker`&&t[1].type!==`listItemIndent`)break}c&&(!s||c<s)&&(o._spread=!0),o.end=Object.assign({},s?e[s][1].start:t[1].end),e.splice(s||r,0,[`exit`,o,t[2]]),r++,n++}if(t[1].type===`listItemPrefix`){let i={type:`listItem`,_spread:!1,start:Object.assign({},t[1].start),end:void 0};o=i,e.splice(r,0,[`enter`,i,t[2]]),r++,n++,c=void 0,l=!0}}}return e[t][1]._spread=a,n}function a(e,t){return n;function n(n){s.call(this,e(n),n),t&&t.call(this,n)}}function o(){this.stack.push({type:`fragment`,children:[]})}function s(e,t,n){this.stack[this.stack.length-1].children.push(e),this.stack.push(e),this.tokenStack.push([t,n||void 0]),e.position={start:si(t.start),end:void 0}}function c(e){return t;function t(t){e&&e.call(this,t),l.call(this,t)}}function l(e,t){let n=this.stack.pop(),r=this.tokenStack.pop();if(r)r[0].type!==e.type&&(t?t.call(this,e,r[0]):(r[1]||ui).call(this,e,r[0]));else throw Error("Cannot close `"+e.type+"` ("+ze({start:e.start,end:e.end})+`): it’s not open`);n.position.end=si(e.end)}function u(){return bt(this.stack.pop())}function d(){this.data.expectingFirstListItemValue=!0}function f(e){if(this.data.expectingFirstListItemValue){let t=this.stack[this.stack.length-2];t.start=Number.parseInt(this.sliceSerialize(e),10),this.data.expectingFirstListItemValue=void 0}}function p(){let e=this.resume(),t=this.stack[this.stack.length-1];t.lang=e}function m(){let e=this.resume(),t=this.stack[this.stack.length-1];t.meta=e}function h(){this.data.flowCodeInside||(this.buffer(),this.data.flowCodeInside=!0)}function g(){let e=this.resume(),t=this.stack[this.stack.length-1];t.value=e.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g,``),this.data.flowCodeInside=void 0}function _(){let e=this.resume(),t=this.stack[this.stack.length-1];t.value=e.replace(/(\r?\n|\r)$/g,``)}function v(e){let t=this.resume(),n=this.stack[this.stack.length-1];n.label=t,n.identifier=H(this.sliceSerialize(e)).toLowerCase()}function y(){let e=this.resume(),t=this.stack[this.stack.length-1];t.title=e}function b(){let e=this.resume(),t=this.stack[this.stack.length-1];t.url=e}function x(e){let t=this.stack[this.stack.length-1];t.depth||=this.sliceSerialize(e).length}function S(){this.data.setextHeadingSlurpLineEnding=!0}function C(e){let t=this.stack[this.stack.length-1];t.depth=this.sliceSerialize(e).codePointAt(0)===61?1:2}function w(){this.data.setextHeadingSlurpLineEnding=void 0}function T(e){let t=this.stack[this.stack.length-1].children,n=t[t.length-1];(!n||n.type!==`text`)&&(n=xe(),n.position={start:si(e.start),end:void 0},t.push(n)),this.stack.push(n)}function E(e){let t=this.stack.pop();t.value+=this.sliceSerialize(e),t.position.end=si(e.end)}function ee(e){let n=this.stack[this.stack.length-1];if(this.data.atHardBreak){let t=n.children[n.children.length-1];t.position.end=si(e.end),this.data.atHardBreak=void 0;return}!this.data.setextHeadingSlurpLineEnding&&t.canContainEols.includes(n.type)&&(T.call(this,e),E.call(this,e))}function D(){this.data.atHardBreak=!0}function te(){let e=this.resume(),t=this.stack[this.stack.length-1];t.value=e}function ne(){let e=this.resume(),t=this.stack[this.stack.length-1];t.value=e}function re(){let e=this.resume(),t=this.stack[this.stack.length-1];t.value=e}function O(){let e=this.stack[this.stack.length-1];if(this.data.inReference){let t=this.data.referenceType||`shortcut`;e.type+=`Reference`,e.referenceType=t,delete e.url,delete e.title}else delete e.identifier,delete e.label;this.data.referenceType=void 0}function k(){let e=this.stack[this.stack.length-1];if(this.data.inReference){let t=this.data.referenceType||`shortcut`;e.type+=`Reference`,e.referenceType=t,delete e.url,delete e.title}else delete e.identifier,delete e.label;this.data.referenceType=void 0}function A(e){let t=this.sliceSerialize(e),n=this.stack[this.stack.length-2];n.label=ni(t),n.identifier=H(t).toLowerCase()}function ie(){let e=this.stack[this.stack.length-1],t=this.resume(),n=this.stack[this.stack.length-1];this.data.inReference=!0,n.type===`link`?n.children=e.children:n.alt=t}function j(){let e=this.resume(),t=this.stack[this.stack.length-1];t.url=e}function M(){let e=this.resume(),t=this.stack[this.stack.length-1];t.title=e}function ae(){this.data.inReference=void 0}function oe(){this.data.referenceType=`collapsed`}function N(e){let t=this.resume(),n=this.stack[this.stack.length-1];n.label=t,n.identifier=H(this.sliceSerialize(e)).toLowerCase(),this.data.referenceType=`full`}function P(e){this.data.characterReferenceType=e.type}function se(e){let t=this.sliceSerialize(e),n=this.data.characterReferenceType,r;n?(r=At(t,n===`characterReferenceMarkerNumeric`?10:16),this.data.characterReferenceType=void 0):r=Tt(t);let i=this.stack[this.stack.length-1];i.value+=r}function F(e){let t=this.stack.pop();t.position.end=si(e.end)}function I(e){E.call(this,e);let t=this.stack[this.stack.length-1];t.url=this.sliceSerialize(e)}function ce(e){E.call(this,e);let t=this.stack[this.stack.length-1];t.url=`mailto:`+this.sliceSerialize(e)}function L(){return{type:`blockquote`,children:[]}}function R(){return{type:`code`,lang:null,meta:null,value:``}}function le(){return{type:`inlineCode`,value:``}}function ue(){return{type:`definition`,identifier:``,label:null,title:null,url:``}}function de(){return{type:`emphasis`,children:[]}}function fe(){return{type:`heading`,depth:0,children:[]}}function pe(){return{type:`break`}}function me(){return{type:`html`,value:``}}function he(){return{type:`image`,title:null,url:``,alt:null}}function ge(){return{type:`link`,title:null,url:``,children:[]}}function _e(e){return{type:`list`,ordered:e.type===`listOrdered`,start:null,spread:e._spread,children:[]}}function ve(e){return{type:`listItem`,spread:e._spread,checked:null,children:[]}}function ye(){return{type:`paragraph`,children:[]}}function be(){return{type:`strong`,children:[]}}function xe(){return{type:`text`,value:``}}function Se(){return{type:`thematicBreak`}}}function si(e){return{line:e.line,column:e.column,offset:e.offset}}function ci(e,t){let n=-1;for(;++n<t.length;){let r=t[n];Array.isArray(r)?ci(e,r):li(e,r)}}function li(e,t){let n;for(n in t)if(ii.call(t,n))switch(n){case`canContainEols`:{let r=t[n];r&&e[n].push(...r);break}case`transforms`:{let r=t[n];r&&e[n].push(...r);break}case`enter`:case`exit`:{let r=t[n];r&&Object.assign(e[n],r);break}}}function ui(e,t){throw Error(e?"Cannot close `"+e.type+"` ("+ze({start:e.start,end:e.end})+"): a different token (`"+t.type+"`, "+ze({start:t.start,end:t.end})+`) is open`:"Cannot close document, a token (`"+t.type+"`, "+ze({start:t.start,end:t.end})+`) is still open`)}function di(e){let t=this;t.parser=n;function n(n){return ai(n,{...t.data(`settings`),...e,extensions:t.data(`micromarkExtensions`)||[],mdastExtensions:t.data(`fromMarkdownExtensions`)||[]})}}function fi(e,t){let n={type:`element`,tagName:`blockquote`,properties:{},children:e.wrap(e.all(t),!0)};return e.patch(t,n),e.applyData(t,n)}function pi(e,t){let n={type:`element`,tagName:`br`,properties:{},children:[]};return e.patch(t,n),[e.applyData(t,n),{type:`text`,value:`
`}]}function mi(e,t){let n=t.value?t.value+`
`:``,r={},i=t.lang?t.lang.split(/\s+/):[];i.length>0&&(r.className=[`language-`+i[0]]);let a={type:`element`,tagName:`code`,properties:r,children:[{type:`text`,value:n}]};return t.meta&&(a.data={meta:t.meta}),e.patch(t,a),a=e.applyData(t,a),a={type:`element`,tagName:`pre`,properties:{},children:[a]},e.patch(t,a),a}function hi(e,t){let n={type:`element`,tagName:`del`,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function gi(e,t){let n={type:`element`,tagName:`em`,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function _i(e,t){let n=typeof e.options.clobberPrefix==`string`?e.options.clobberPrefix:`user-content-`,r=String(t.identifier).toUpperCase(),i=zt(r.toLowerCase()),a=e.footnoteOrder.indexOf(r),o,s=e.footnoteCounts.get(r);s===void 0?(s=0,e.footnoteOrder.push(r),o=e.footnoteOrder.length):o=a+1,s+=1,e.footnoteCounts.set(r,s);let c={type:`element`,tagName:`a`,properties:{href:`#`+n+`fn-`+i,id:n+`fnref-`+i+(s>1?`-`+s:``),dataFootnoteRef:!0,ariaDescribedBy:[`footnote-label`]},children:[{type:`text`,value:String(o)}]};e.patch(t,c);let l={type:`element`,tagName:`sup`,properties:{},children:[c]};return e.patch(t,l),e.applyData(t,l)}function vi(e,t){let n={type:`element`,tagName:`h`+t.depth,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function yi(e,t){if(e.options.allowDangerousHtml){let n={type:`raw`,value:t.value};return e.patch(t,n),e.applyData(t,n)}}function bi(e,t){let n=t.referenceType,r=`]`;if(n===`collapsed`?r+=`[]`:n===`full`&&(r+=`[`+(t.label||t.identifier)+`]`),t.type===`imageReference`)return[{type:`text`,value:`![`+t.alt+r}];let i=e.all(t),a=i[0];a&&a.type===`text`?a.value=`[`+a.value:i.unshift({type:`text`,value:`[`});let o=i[i.length-1];return o&&o.type===`text`?o.value+=r:i.push({type:`text`,value:r}),i}function xi(e,t){let n=String(t.identifier).toUpperCase(),r=e.definitionById.get(n);if(!r)return bi(e,t);let i={src:zt(r.url||``),alt:t.alt};r.title!==null&&r.title!==void 0&&(i.title=r.title);let a={type:`element`,tagName:`img`,properties:i,children:[]};return e.patch(t,a),e.applyData(t,a)}function Si(e,t){let n={src:zt(t.url)};t.alt!==null&&t.alt!==void 0&&(n.alt=t.alt),t.title!==null&&t.title!==void 0&&(n.title=t.title);let r={type:`element`,tagName:`img`,properties:n,children:[]};return e.patch(t,r),e.applyData(t,r)}function Ci(e,t){let n={type:`text`,value:t.value.replace(/\r?\n|\r/g,` `)};e.patch(t,n);let r={type:`element`,tagName:`code`,properties:{},children:[n]};return e.patch(t,r),e.applyData(t,r)}function wi(e,t){let n=String(t.identifier).toUpperCase(),r=e.definitionById.get(n);if(!r)return bi(e,t);let i={href:zt(r.url||``)};r.title!==null&&r.title!==void 0&&(i.title=r.title);let a={type:`element`,tagName:`a`,properties:i,children:e.all(t)};return e.patch(t,a),e.applyData(t,a)}function Ti(e,t){let n={href:zt(t.url)};t.title!==null&&t.title!==void 0&&(n.title=t.title);let r={type:`element`,tagName:`a`,properties:n,children:e.all(t)};return e.patch(t,r),e.applyData(t,r)}function Ei(e,t,n){let r=e.all(t),i=n?Di(n):Oi(t),a={},o=[];if(typeof t.checked==`boolean`){let e=r[0],n;e&&e.type===`element`&&e.tagName===`p`?n=e:(n={type:`element`,tagName:`p`,properties:{},children:[]},r.unshift(n)),n.children.length>0&&n.children.unshift({type:`text`,value:` `}),n.children.unshift({type:`element`,tagName:`input`,properties:{type:`checkbox`,checked:t.checked,disabled:!0},children:[]}),a.className=[`task-list-item`]}let s=-1;for(;++s<r.length;){let e=r[s];(i||s!==0||e.type!==`element`||e.tagName!==`p`)&&o.push({type:`text`,value:`
`}),e.type===`element`&&e.tagName===`p`&&!i?o.push(...e.children):o.push(e)}let c=r[r.length-1];c&&(i||c.type!==`element`||c.tagName!==`p`)&&o.push({type:`text`,value:`
`});let l={type:`element`,tagName:`li`,properties:a,children:o};return e.patch(t,l),e.applyData(t,l)}function Di(e){let t=!1;if(e.type===`list`){t=e.spread||!1;let n=e.children,r=-1;for(;!t&&++r<n.length;)t=Oi(n[r])}return t}function Oi(e){return e.spread??e.children.length>1}function ki(e,t){let n={},r=e.all(t),i=-1;for(typeof t.start==`number`&&t.start!==1&&(n.start=t.start);++i<r.length;){let e=r[i];if(e.type===`element`&&e.tagName===`li`&&e.properties&&Array.isArray(e.properties.className)&&e.properties.className.includes(`task-list-item`)){n.className=[`contains-task-list`];break}}let a={type:`element`,tagName:t.ordered?`ol`:`ul`,properties:n,children:e.wrap(r,!0)};return e.patch(t,a),e.applyData(t,a)}function Ai(e,t){let n={type:`element`,tagName:`p`,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function ji(e,t){let n={type:`root`,children:e.wrap(e.all(t))};return e.patch(t,n),e.applyData(t,n)}function Mi(e,t){let n={type:`element`,tagName:`strong`,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}function Ni(e,t){let n=e.all(t),r=n.shift(),i=[];if(r){let n={type:`element`,tagName:`thead`,properties:{},children:e.wrap([r],!0)};e.patch(t.children[0],n),i.push(n)}if(n.length>0){let r={type:`element`,tagName:`tbody`,properties:{},children:e.wrap(n,!0)},a=Ie(t.children[1]),o=Fe(t.children[t.children.length-1]);a&&o&&(r.position={start:a,end:o}),i.push(r)}let a={type:`element`,tagName:`table`,properties:{},children:e.wrap(i,!0)};return e.patch(t,a),e.applyData(t,a)}function Pi(e,t,n){let r=n?n.children:void 0,i=(r?r.indexOf(t):1)===0?`th`:`td`,a=n&&n.type===`table`?n.align:void 0,o=a?a.length:t.children.length,s=-1,c=[];for(;++s<o;){let n=t.children[s],r={},o=a?a[s]:void 0;o&&(r.align=o);let l={type:`element`,tagName:i,properties:r,children:[]};n&&(l.children=e.all(n),e.patch(n,l),l=e.applyData(n,l)),c.push(l)}let l={type:`element`,tagName:`tr`,properties:{},children:e.wrap(c,!0)};return e.patch(t,l),e.applyData(t,l)}function Fi(e,t){let n={type:`element`,tagName:`td`,properties:{},children:e.all(t)};return e.patch(t,n),e.applyData(t,n)}var Ii=9,Li=32;function Ri(e){let t=String(e),n=/\r?\n|\r/g,r=n.exec(t),i=0,a=[];for(;r;)a.push(zi(t.slice(i,r.index),i>0,!0),r[0]),i=r.index+r[0].length,r=n.exec(t);return a.push(zi(t.slice(i),i>0,!1)),a.join(``)}function zi(e,t,n){let r=0,i=e.length;if(t){let t=e.codePointAt(r);for(;t===Ii||t===Li;)r++,t=e.codePointAt(r)}if(n){let t=e.codePointAt(i-1);for(;t===Ii||t===Li;)i--,t=e.codePointAt(i-1)}return i>r?e.slice(r,i):``}function Bi(e,t){let n={type:`text`,value:Ri(String(t.value))};return e.patch(t,n),e.applyData(t,n)}function Vi(e,t){let n={type:`element`,tagName:`hr`,properties:{},children:[]};return e.patch(t,n),e.applyData(t,n)}var Hi={blockquote:fi,break:pi,code:mi,delete:hi,emphasis:gi,footnoteReference:_i,heading:vi,html:yi,imageReference:xi,image:Si,inlineCode:Ci,linkReference:wi,link:Ti,listItem:Ei,list:ki,paragraph:Ai,root:ji,strong:Mi,table:Ni,tableCell:Fi,tableRow:Pi,text:Bi,thematicBreak:Vi,toml:Ui,yaml:Ui,definition:Ui,footnoteDefinition:Ui};function Ui(){}var{defineProperty:Wi}=Object,Gi=typeof self==`object`?self:globalThis,Ki=(e,t)=>{switch(e){case`Function`:case`SharedWorker`:case`Worker`:case`eval`:case`setInterval`:case`setTimeout`:throw TypeError(`unable to deserialize `+e)}return new Gi[e](t)},qi=(e,t)=>{let n=(t,n)=>(e.set(n,t),t),r=i=>{if(e.has(i))return e.get(i);let[a,o]=t[i];switch(a){case 0:case-1:return n(o,i);case 1:{let e=n([],i);for(let t of o)e.push(r(t));return e}case 2:{let e=n({},i);for(let[t,n]of o){let i=r(t),a=r(n);i===`__proto__`?Wi(e,i,{value:a,configurable:!0,enumerable:!0,writable:!0}):e[i]=a}return e}case 3:return n(new Date(o),i);case 4:{let{source:e,flags:t}=o;return n(new RegExp(e,t),i)}case 5:{let e=n(new Map,i);for(let[t,n]of o)e.set(r(t),r(n));return e}case 6:{let e=n(new Set,i);for(let t of o)e.add(r(t));return e}case 7:{let{name:e,message:t}=o;return n(typeof Gi[e]==`function`?Ki(e,t):Error(t),i)}case 8:return n(BigInt(o),i);case`BigInt`:return n(Object(BigInt(o)),i);case`ArrayBuffer`:return n(new Uint8Array(o).buffer,o);case`DataView`:{let{buffer:e}=new Uint8Array(o);return n(new DataView(e),o)}case`-0`:return-0}return n(Ki(a,o),i)};return r},Ji=e=>qi(new Map,e)(0),Yi=``,{toString:Xi}={},{keys:Zi,is:Qi}=Object,$i=e=>{let t=typeof e;if(t!==`object`||!e)return[0,t];let n=Xi.call(e).slice(8,-1);switch(n){case`Array`:return[1,Yi];case`Object`:return[2,Yi];case`Date`:return[3,Yi];case`RegExp`:return[4,Yi];case`Map`:return[5,Yi];case`Set`:return[6,Yi];case`DataView`:return[1,n]}return n.includes(`Array`)?[1,n]:e instanceof Error?[7,e.name||`Error`]:[2,n]},ea=([e,t])=>e===0&&(t===`function`||t===`symbol`),ta=(e,t,n,r)=>{let i=(e,t)=>{let i=r.push(e)-1;return n.set(t,i),i},a=o=>{if(n.has(o))return n.get(o);let[s,c]=$i(o);switch(s){case 0:{let t=o;switch(c){case`bigint`:s=8,t=o.toString();break;case`number`:if(!o&&Qi(o,-0))return r.push([`-0`])-1;break;case`function`:case`symbol`:if(e)throw TypeError(`unable to serialize `+c);t=null;break;case`undefined`:return i([-1],o)}return i([s,t],o)}case 1:{if(c){let e=o;return c===`DataView`?e=new Uint8Array(o.buffer):c===`ArrayBuffer`&&(e=new Uint8Array(o)),i([c,[...e]],o)}let e=[],t=i([s,e],o);for(let t of o)e.push(a(t));return t}case 2:{if(c)switch(c){case`BigInt`:return i([c,o.toString()],o);case`Boolean`:case`Number`:case`String`:return i([c,o.valueOf()],o)}if(t&&`toJSON`in o)return a(o.toJSON());let n=[],r=i([s,n],o);for(let t of Zi(o))(e||!ea($i(o[t])))&&n.push([a(t),a(o[t])]);return r}case 3:return i([s,isNaN(o.getTime())?Yi:o.toISOString()],o);case 4:{let{source:e,flags:t}=o;return i([s,{source:e,flags:t}],o)}case 5:{let t=[],n=i([s,t],o);for(let[n,r]of o)(e||!(ea($i(n))||ea($i(r))))&&t.push([a(n),a(r)]);return n}case 6:{let t=[],n=i([s,t],o);for(let n of o)(e||!ea($i(n)))&&t.push(a(n));return n}}let{message:l}=o;return i([s,{name:c,message:l}],o)};return a},na=(e,{json:t,lossy:n}={})=>{let r=[];return ta(!(t||n),!!t,new Map,r)(e),r},ra=typeof structuredClone==`function`?(e,t)=>t&&(`json`in t||`lossy`in t)?Ji(na(e,t)):structuredClone(e):(e,t)=>Ji(na(e,t));function ia(e,t){let n=[{type:`text`,value:`↩`}];return t>1&&n.push({type:`element`,tagName:`sup`,properties:{},children:[{type:`text`,value:String(t)}]}),n}function aa(e,t){return`Back to reference `+(e+1)+(t>1?`-`+t:``)}function oa(e){let t=typeof e.options.clobberPrefix==`string`?e.options.clobberPrefix:`user-content-`,n=e.options.footnoteBackContent||ia,r=e.options.footnoteBackLabel||aa,i=e.options.footnoteLabel||`Footnotes`,a=e.options.footnoteLabelTagName||`h2`,o=e.options.footnoteLabelProperties||{className:[`sr-only`]},s=[],c=-1;for(;++c<e.footnoteOrder.length;){let i=e.footnoteById.get(e.footnoteOrder[c]);if(!i)continue;let a=e.all(i),o=String(i.identifier).toUpperCase(),l=zt(o.toLowerCase()),u=0,d=[],f=e.footnoteCounts.get(o);for(;f!==void 0&&++u<=f;){d.length>0&&d.push({type:`text`,value:` `});let e=typeof n==`string`?n:n(c,u);typeof e==`string`&&(e={type:`text`,value:e}),d.push({type:`element`,tagName:`a`,properties:{href:`#`+t+`fnref-`+l+(u>1?`-`+u:``),dataFootnoteBackref:``,ariaLabel:typeof r==`string`?r:r(c,u),className:[`data-footnote-backref`]},children:Array.isArray(e)?e:[e]})}let p=a[a.length-1];if(p&&p.type===`element`&&p.tagName===`p`){let e=p.children[p.children.length-1];e&&e.type===`text`?e.value+=` `:p.children.push({type:`text`,value:` `}),p.children.push(...d)}else a.push(...d);let m={type:`element`,tagName:`li`,properties:{id:t+`fn-`+l},children:e.wrap(a,!0)};e.patch(i,m),s.push(m)}if(s.length!==0)return{type:`element`,tagName:`section`,properties:{dataFootnotes:!0,className:[`footnotes`]},children:[{type:`element`,tagName:a,properties:{...ra(o),id:`footnote-label`},children:[{type:`text`,value:i}]},{type:`text`,value:`
`},{type:`element`,tagName:`ol`,properties:{},children:e.wrap(s,!0)},{type:`text`,value:`
`}]}}var sa=(function(e){if(e==null)return fa;if(typeof e==`function`)return da(e);if(typeof e==`object`)return Array.isArray(e)?ca(e):la(e);if(typeof e==`string`)return ua(e);throw Error(`Expected function, string, or object as test`)});function ca(e){let t=[],n=-1;for(;++n<e.length;)t[n]=sa(e[n]);return da(r);function r(...e){let n=-1;for(;++n<t.length;)if(t[n].apply(this,e))return!0;return!1}}function la(e){let t=e;return da(n);function n(n){let r=n,i;for(i in e)if(r[i]!==t[i])return!1;return!0}}function ua(e){return da(t);function t(t){return t&&t.type===e}}function da(e){return t;function t(t,n,r){return!!(pa(t)&&e.call(this,t,typeof n==`number`?n:void 0,r||void 0))}}function fa(){return!0}function pa(e){return typeof e==`object`&&!!e&&`type`in e}function ma(e){return e}var ha=[];function ga(e,t,n,r){let i;typeof t==`function`&&typeof n!=`function`?(r=n,n=t):i=t;let a=sa(i),o=r?-1:1;s(e,void 0,[])();function s(e,i,c){let l=e&&typeof e==`object`?e:{};if(typeof l.type==`string`){let t=typeof l.tagName==`string`?l.tagName:typeof l.name==`string`?l.name:void 0;Object.defineProperty(u,"name",{value:`node (`+ma(e.type+(t?`<`+t+`>`:``))+`)`})}return u;function u(){let l=ha,u,d,f;if((!t||a(e,i,c[c.length-1]||void 0))&&(l=_a(n(e,c)),l[0]===!1))return l;if(`children`in e&&e.children){let t=e;if(t.children&&l[0]!==`skip`)for(d=(r?t.children.length:-1)+o,f=c.concat(t);d>-1&&d<t.children.length;){let e=t.children[d];if(u=s(e,d,f)(),u[0]===!1)return u;d=typeof u[1]==`number`?u[1]:d+o}}return l}}}function _a(e){return Array.isArray(e)?e:typeof e==`number`?[!0,e]:e==null?ha:[e]}function va(e,t,n,r){let i,a,o;typeof t==`function`&&typeof n!=`function`?(a=void 0,o=t,i=n):(a=t,o=n,i=r),ga(e,a,s,i);function s(e,t){let n=t[t.length-1],r=n?n.children.indexOf(e):void 0;return o(e,r,n)}}var ya={}.hasOwnProperty,ba={};function xa(e,t){let n=t||ba,r=new Map,i=new Map,a={all:s,applyData:Ca,definitionById:r,footnoteById:i,footnoteCounts:new Map,footnoteOrder:[],handlers:{...Hi,...n.handlers},one:o,options:n,patch:Sa,wrap:Ta};return va(e,function(e){if(e.type===`definition`||e.type===`footnoteDefinition`){let t=e.type===`definition`?r:i,n=String(e.identifier).toUpperCase();t.has(n)||t.set(n,e)}}),a;function o(e,t){let n=e.type,r=a.handlers[n];if(ya.call(a.handlers,n)&&r)return r(a,e,t);if(a.options.passThrough&&a.options.passThrough.includes(n)){if(`children`in e){let{children:t,...n}=e,r=ra(n);return r.children=a.all(e),r}return ra(e)}return(a.options.unknownHandler||wa)(a,e,t)}function s(e){let t=[];if(`children`in e){let n=e.children,r=-1;for(;++r<n.length;){let i=a.one(n[r],e);if(i){if(r&&n[r-1].type===`break`&&(!Array.isArray(i)&&i.type===`text`&&(i.value=Ea(i.value)),!Array.isArray(i)&&i.type===`element`)){let e=i.children[0];e&&e.type===`text`&&(e.value=Ea(e.value))}Array.isArray(i)?t.push(...i):t.push(i)}}}return t}}function Sa(e,t){e.position&&(t.position=Re(e))}function Ca(e,t){let n=t;if(e&&e.data){let t=e.data.hName,r=e.data.hChildren,i=e.data.hProperties;typeof t==`string`&&(n.type===`element`?n.tagName=t:n={type:`element`,tagName:t,properties:{},children:`children`in n?n.children:[n]}),n.type===`element`&&i&&Object.assign(n.properties,ra(i)),`children`in n&&n.children&&r!=null&&(n.children=r)}return n}function wa(e,t){let n=t.data||{},r=`value`in t&&!(ya.call(n,`hProperties`)||ya.call(n,`hChildren`))?{type:`text`,value:t.value}:{type:`element`,tagName:`div`,properties:{},children:e.all(t)};return e.patch(t,r),e.applyData(t,r)}function Ta(e,t){let n=[],r=-1;for(t&&n.push({type:`text`,value:`
`});++r<e.length;)r&&n.push({type:`text`,value:`
`}),n.push(e[r]);return t&&e.length>0&&n.push({type:`text`,value:`
`}),n}function Ea(e){let t=0,n=e.charCodeAt(t);for(;n===9||n===32;)t++,n=e.charCodeAt(t);return e.slice(t)}function Da(e,t){let n=xa(e,t),r=n.one(e,void 0),i=oa(n),a=Array.isArray(r)?{type:`root`,children:r}:r||{type:`root`,children:[]};return i&&(`children`in a,a.children.push({type:`text`,value:`
`},i)),a}function Oa(e,t){return e&&`run`in e?async function(n,r){let i=Da(n,{file:r,...t});await e.run(i,r)}:function(n,r){return Da(n,{file:r,...e||t})}}function ka(e){if(e)throw e}var Aa=t(((e,t)=>{var n=Object.prototype.hasOwnProperty,r=Object.prototype.toString,i=Object.defineProperty,a=Object.getOwnPropertyDescriptor,o=function(e){return typeof Array.isArray==`function`?Array.isArray(e):r.call(e)===`[object Array]`},s=function(e){if(!e||r.call(e)!==`[object Object]`)return!1;var t=n.call(e,`constructor`),i=e.constructor&&e.constructor.prototype&&n.call(e.constructor.prototype,`isPrototypeOf`);if(e.constructor&&!t&&!i)return!1;for(var a in e);return a===void 0||n.call(e,a)},c=function(e,t){i&&t.name===`__proto__`?i(e,t.name,{enumerable:!0,configurable:!0,value:t.newValue,writable:!0}):e[t.name]=t.newValue},l=function(e,t){if(t===`__proto__`){if(!n.call(e,t))return;if(a)return a(e,t).value}return e[t]};t.exports=function e(){var t,n,r,i,a,u,d=arguments[0],f=1,p=arguments.length,m=!1;for(typeof d==`boolean`&&(m=d,d=arguments[1]||{},f=2),(d==null||typeof d!=`object`&&typeof d!=`function`)&&(d={});f<p;++f)if(t=arguments[f],t!=null)for(n in t)r=l(d,n),i=l(t,n),d!==i&&(m&&i&&(s(i)||(a=o(i)))?(a?(a=!1,u=r&&o(r)?r:[]):u=r&&s(r)?r:{},c(d,{name:n,newValue:e(m,u,i)})):i!==void 0&&c(d,{name:n,newValue:i}));return d}}));function ja(e){if(typeof e!=`object`||!e)return!1;let t=Object.getPrototypeOf(e);return(t===null||t===Object.prototype||Object.getPrototypeOf(t)===null)&&!(Symbol.toStringTag in e)&&!(Symbol.iterator in e)}function Ma(){let e=[],t={run:n,use:r};return t;function n(...t){let n=-1,r=t.pop();if(typeof r!=`function`)throw TypeError(`Expected function as last argument, not `+r);i(null,...t);function i(a,...o){let s=e[++n],c=-1;if(a){r(a);return}for(;++c<t.length;)(o[c]===null||o[c]===void 0)&&(o[c]=t[c]);t=o,s?Na(s,i)(...o):r(null,...o)}}function r(n){if(typeof n!=`function`)throw TypeError("Expected `middelware` to be a function, not "+n);return e.push(n),t}}function Na(e,t){let n;return r;function r(...t){let r=e.length>t.length,o;r&&t.push(i);try{o=e.apply(this,t)}catch(e){let t=e;if(r&&n)throw t;return i(t)}r||(o&&o.then&&typeof o.then==`function`?o.then(a,i):o instanceof Error?i(o):a(o))}function i(e,...r){n||(n=!0,t(e,...r))}function a(e){i(null,e)}}var X={basename:Pa,dirname:Fa,extname:Ia,join:La,sep:`/`};function Pa(e,t){if(t!==void 0&&typeof t!=`string`)throw TypeError(`"ext" argument must be a string`);Ba(e);let n=0,r=-1,i=e.length,a;if(t===void 0||t.length===0||t.length>e.length){for(;i--;)if(e.codePointAt(i)===47){if(a){n=i+1;break}}else r<0&&(a=!0,r=i+1);return r<0?``:e.slice(n,r)}if(t===e)return``;let o=-1,s=t.length-1;for(;i--;)if(e.codePointAt(i)===47){if(a){n=i+1;break}}else o<0&&(a=!0,o=i+1),s>-1&&(e.codePointAt(i)===t.codePointAt(s--)?s<0&&(r=i):(s=-1,r=o));return n===r?r=o:r<0&&(r=e.length),e.slice(n,r)}function Fa(e){if(Ba(e),e.length===0)return`.`;let t=-1,n=e.length,r;for(;--n;)if(e.codePointAt(n)===47){if(r){t=n;break}}else r||=!0;return t<0?e.codePointAt(0)===47?`/`:`.`:t===1&&e.codePointAt(0)===47?`//`:e.slice(0,t)}function Ia(e){Ba(e);let t=e.length,n=-1,r=0,i=-1,a=0,o;for(;t--;){let s=e.codePointAt(t);if(s===47){if(o){r=t+1;break}continue}n<0&&(o=!0,n=t+1),s===46?i<0?i=t:a!==1&&(a=1):i>-1&&(a=-1)}return i<0||n<0||a===0||a===1&&i===n-1&&i===r+1?``:e.slice(i,n)}function La(...e){let t=-1,n;for(;++t<e.length;)Ba(e[t]),e[t]&&(n=n===void 0?e[t]:n+`/`+e[t]);return n===void 0?`.`:Ra(n)}function Ra(e){Ba(e);let t=e.codePointAt(0)===47,n=za(e,!t);return n.length===0&&!t&&(n=`.`),n.length>0&&e.codePointAt(e.length-1)===47&&(n+=`/`),t?`/`+n:n}function za(e,t){let n=``,r=0,i=-1,a=0,o=-1,s,c;for(;++o<=e.length;){if(o<e.length)s=e.codePointAt(o);else if(s===47)break;else s=47;if(s===47){if(i!==o-1&&a!==1){if(i!==o-1&&a===2){if(n.length<2||r!==2||n.codePointAt(n.length-1)!==46||n.codePointAt(n.length-2)!==46){if(n.length>2){if(c=n.lastIndexOf(`/`),c!==n.length-1){c<0?(n=``,r=0):(n=n.slice(0,c),r=n.length-1-n.lastIndexOf(`/`)),i=o,a=0;continue}}else if(n.length>0){n=``,r=0,i=o,a=0;continue}}t&&(n=n.length>0?n+`/..`:`..`,r=2)}else n.length>0?n+=`/`+e.slice(i+1,o):n=e.slice(i+1,o),r=o-i-1}i=o,a=0}else s===46&&a>-1?a++:a=-1}return n}function Ba(e){if(typeof e!=`string`)throw TypeError(`Path must be a string. Received `+JSON.stringify(e))}var Va={cwd:Ha};function Ha(){return`/`}function Ua(e){return!!(typeof e==`object`&&e&&`href`in e&&e.href&&`protocol`in e&&e.protocol&&e.auth===void 0)}function Wa(e){if(typeof e==`string`)e=new URL(e);else if(!Ua(e)){let t=TypeError('The "path" argument must be of type string or an instance of URL. Received `'+e+"`");throw t.code=`ERR_INVALID_ARG_TYPE`,t}if(e.protocol!==`file:`){let e=TypeError(`The URL must be of scheme file`);throw e.code=`ERR_INVALID_URL_SCHEME`,e}return Ga(e)}function Ga(e){if(e.hostname!==``){let e=TypeError(`File URL host must be "localhost" or empty on darwin`);throw e.code=`ERR_INVALID_FILE_URL_HOST`,e}let t=e.pathname,n=-1;for(;++n<t.length;)if(t.codePointAt(n)===37&&t.codePointAt(n+1)===50){let e=t.codePointAt(n+2);if(e===70||e===102){let e=TypeError(`File URL path must not include encoded / characters`);throw e.code=`ERR_INVALID_FILE_URL_PATH`,e}}return decodeURIComponent(t)}var Ka=[`history`,`path`,`basename`,`stem`,`extname`,`dirname`],qa=class{constructor(e){let t;t=e?Ua(e)?{path:e}:typeof e==`string`||Za(e)?{value:e}:e:{},this.cwd=`cwd`in t?``:Va.cwd(),this.data={},this.history=[],this.messages=[],this.value,this.map,this.result,this.stored;let n=-1;for(;++n<Ka.length;){let e=Ka[n];e in t&&t[e]!==void 0&&t[e]!==null&&(this[e]=e===`history`?[...t[e]]:t[e])}let r;for(r in t)Ka.includes(r)||(this[r]=t[r])}get basename(){return typeof this.path==`string`?X.basename(this.path):void 0}set basename(e){Ya(e,`basename`),Ja(e,`basename`),this.path=X.join(this.dirname||``,e)}get dirname(){return typeof this.path==`string`?X.dirname(this.path):void 0}set dirname(e){Xa(this.basename,`dirname`),this.path=X.join(e||``,this.basename)}get extname(){return typeof this.path==`string`?X.extname(this.path):void 0}set extname(e){if(Ja(e,`extname`),Xa(this.dirname,`extname`),e){if(e.codePointAt(0)!==46)throw Error("`extname` must start with `.`");if(e.includes(`.`,1))throw Error("`extname` cannot contain multiple dots")}this.path=X.join(this.dirname,this.stem+(e||``))}get path(){return this.history[this.history.length-1]}set path(e){Ua(e)&&(e=Wa(e)),Ya(e,`path`),this.path!==e&&this.history.push(e)}get stem(){return typeof this.path==`string`?X.basename(this.path,this.extname):void 0}set stem(e){Ya(e,`stem`),Ja(e,`stem`),this.path=X.join(this.dirname||``,e+(this.extname||``))}fail(e,t,n){let r=this.message(e,t,n);throw r.fatal=!0,r}info(e,t,n){let r=this.message(e,t,n);return r.fatal=void 0,r}message(e,t,n){let r=new z(e,t,n);return this.path&&(r.name=this.path+`:`+r.name,r.file=this.path),r.fatal=!1,this.messages.push(r),r}toString(e){return this.value===void 0?``:typeof this.value==`string`?this.value:new TextDecoder(e||void 0).decode(this.value)}};function Ja(e,t){if(e&&e.includes(X.sep))throw Error("`"+t+"` cannot be a path: did not expect `"+X.sep+"`")}function Ya(e,t){if(!e)throw Error("`"+t+"` cannot be empty")}function Xa(e,t){if(!e)throw Error("Setting `"+t+"` requires `path` to be set too")}function Za(e){return!!(e&&typeof e==`object`&&`byteLength`in e&&`byteOffset`in e)}var Qa=(function(e){let t=this.constructor.prototype,n=t[e],r=function(){return n.apply(r,arguments)};return Object.setPrototypeOf(r,t),r}),$a=s(Aa(),1),eo={}.hasOwnProperty,to=new class e extends Qa{constructor(){super(`copy`),this.Compiler=void 0,this.Parser=void 0,this.attachers=[],this.compiler=void 0,this.freezeIndex=-1,this.frozen=void 0,this.namespace={},this.parser=void 0,this.transformers=Ma()}copy(){let t=new e,n=-1;for(;++n<this.attachers.length;){let e=this.attachers[n];t.use(...e)}return t.data((0,$a.default)(!0,{},this.namespace)),t}data(e,t){return typeof e==`string`?arguments.length===2?(io(`data`,this.frozen),this.namespace[e]=t,this):eo.call(this.namespace,e)&&this.namespace[e]||void 0:e?(io(`data`,this.frozen),this.namespace=e,this):this.namespace}freeze(){if(this.frozen)return this;let e=this;for(;++this.freezeIndex<this.attachers.length;){let[t,...n]=this.attachers[this.freezeIndex];if(n[0]===!1)continue;n[0]===!0&&(n[0]=void 0);let r=t.call(e,...n);typeof r==`function`&&this.transformers.use(r)}return this.frozen=!0,this.freezeIndex=1/0,this}parse(e){this.freeze();let t=so(e),n=this.parser||this.Parser;return no(`parse`,n),n(String(t),t)}process(e,t){let n=this;return this.freeze(),no(`process`,this.parser||this.Parser),ro(`process`,this.compiler||this.Compiler),t?r(void 0,t):new Promise(r);function r(r,i){let a=so(e),o=n.parse(a);n.run(o,a,function(e,t,r){if(e||!t||!r)return s(e);let i=t,a=n.stringify(i,r);lo(a)?r.value=a:r.result=a,s(e,r)});function s(e,n){e||!n?i(e):r?r(n):t(void 0,n)}}}processSync(e){let t=!1,n;return this.freeze(),no(`processSync`,this.parser||this.Parser),ro(`processSync`,this.compiler||this.Compiler),this.process(e,r),oo(`processSync`,`process`,t),n;function r(e,r){t=!0,ka(e),n=r}}run(e,t,n){ao(e),this.freeze();let r=this.transformers;return!n&&typeof t==`function`&&(n=t,t=void 0),n?i(void 0,n):new Promise(i);function i(i,a){let o=so(t);r.run(e,o,s);function s(t,r,o){let s=r||e;t?a(t):i?i(s):n(void 0,s,o)}}}runSync(e,t){let n=!1,r;return this.run(e,t,i),oo(`runSync`,`run`,n),r;function i(e,t){ka(e),r=t,n=!0}}stringify(e,t){this.freeze();let n=so(t),r=this.compiler||this.Compiler;return ro(`stringify`,r),ao(e),r(e,n)}use(e,...t){let n=this.attachers,r=this.namespace;if(io(`use`,this.frozen),e!=null){if(typeof e==`function`)s(e,t);else if(typeof e==`object`)Array.isArray(e)?o(e):a(e);else throw TypeError("Expected usable value, not `"+e+"`")}return this;function i(e){if(typeof e==`function`)s(e,[]);else if(typeof e==`object`){if(Array.isArray(e)){let[t,...n]=e;s(t,n)}else a(e)}else throw TypeError("Expected usable value, not `"+e+"`")}function a(e){if(!(`plugins`in e)&&!(`settings`in e))throw Error("Expected usable value but received an empty preset, which is probably a mistake: presets typically come with `plugins` and sometimes with `settings`, but this has neither");o(e.plugins),e.settings&&(r.settings=(0,$a.default)(!0,r.settings,e.settings))}function o(e){let t=-1;if(e!=null){if(Array.isArray(e))for(;++t<e.length;){let n=e[t];i(n)}else throw TypeError("Expected a list of plugins, not `"+e+"`")}}function s(e,t){let r=-1,i=-1;for(;++r<n.length;)if(n[r][0]===e){i=r;break}if(i===-1)n.push([e,...t]);else if(t.length>0){let[r,...a]=t,o=n[i][1];ja(o)&&ja(r)&&(r=(0,$a.default)(!0,o,r)),n[i]=[e,r,...a]}}}}().freeze();function no(e,t){if(typeof t!=`function`)throw TypeError("Cannot `"+e+"` without `parser`")}function ro(e,t){if(typeof t!=`function`)throw TypeError("Cannot `"+e+"` without `compiler`")}function io(e,t){if(t)throw Error("Cannot call `"+e+"` on a frozen processor.\nCreate a new processor first, by calling it: use `processor()` instead of `processor`.")}function ao(e){if(!ja(e)||typeof e.type!=`string`)throw TypeError("Expected node, got `"+e+"`")}function oo(e,t,n){if(!n)throw Error("`"+e+"` finished async. Use `"+t+"` instead")}function so(e){return co(e)?e:new qa(e)}function co(e){return!!(e&&typeof e==`object`&&`message`in e&&`messages`in e)}function lo(e){return typeof e==`string`||uo(e)}function uo(e){return!!(e&&typeof e==`object`&&`byteLength`in e&&`byteOffset`in e)}var Z=n(),fo=a(),po=[],mo={allowDangerousHtml:!0},ho=/^(https?|ircs?|mailto|xmpp)$/i,go=[{from:`astPlugins`,id:`remove-buggy-html-in-markdown-parser`},{from:`allowDangerousHtml`,id:`remove-buggy-html-in-markdown-parser`},{from:`allowNode`,id:`replace-allownode-allowedtypes-and-disallowedtypes`,to:`allowElement`},{from:`allowedTypes`,id:`replace-allownode-allowedtypes-and-disallowedtypes`,to:`allowedElements`},{from:`className`,id:`remove-classname`},{from:`disallowedTypes`,id:`replace-allownode-allowedtypes-and-disallowedtypes`,to:`disallowedElements`},{from:`escapeHtml`,id:`remove-buggy-html-in-markdown-parser`},{from:`includeElementIndex`,id:`#remove-includeelementindex`},{from:`includeNodeIndex`,id:`change-includenodeindex-to-includeelementindex`},{from:`linkTarget`,id:`remove-linktarget`},{from:`plugins`,id:`change-plugins-to-remarkplugins`,to:`remarkPlugins`},{from:`rawSourcePos`,id:`#remove-rawsourcepos`},{from:`renderers`,id:`change-renderers-to-components`,to:`components`},{from:`source`,id:`change-source-to-children`,to:`children`},{from:`sourcePos`,id:`#remove-sourcepos`},{from:`transformImageUri`,id:`#add-urltransform`,to:`urlTransform`},{from:`transformLinkUri`,id:`#add-urltransform`,to:`urlTransform`}];function _o(e){let t=vo(e),n=yo(e);return bo(t.runSync(t.parse(n),n),e)}function vo(e){let t=e.rehypePlugins||po,n=e.remarkPlugins||po,r=e.remarkRehypeOptions?{...e.remarkRehypeOptions,...mo}:mo;return to().use(di).use(n).use(Oa,r).use(t)}function yo(e){let t=e.children||``,n=new qa;return typeof t==`string`?n.value=t:``+t,n}function bo(e,t){let n=t.allowedElements,r=t.allowElement,i=t.components,a=t.disallowedElements,o=t.skipHtml,s=t.unwrapDisallowed,c=t.urlTransform||xo;for(let e of go)Object.hasOwn(t,e.from)&&``+e.from+(e.to?"use `"+e.to+"` instead":`remove it`)+e.id;return va(e,l),Xe(e,{Fragment:Z.Fragment,components:i,ignoreInvalidStyle:!0,jsx:Z.jsx,jsxs:Z.jsxs,passKeys:!0,passNode:!0});function l(e,t,i){if(e.type===`raw`&&i&&typeof t==`number`)return o?i.children.splice(t,1):i.children[t]={type:`text`,value:e.value},t;if(e.type===`element`){let t;for(t in vt)if(Object.hasOwn(vt,t)&&Object.hasOwn(e.properties,t)){let n=e.properties[t],r=vt[t];(r===null||r.includes(e.tagName))&&(e.properties[t]=c(String(n||``),t,e))}}if(e.type===`element`){let o=n?!n.includes(e.tagName):a?a.includes(e.tagName):!1;if(!o&&r&&typeof t==`number`&&(o=!r(e,t,i)),o&&i&&typeof t==`number`)return s&&e.children?i.children.splice(t,1,...e.children):i.children.splice(t,1),t}}}function xo(e){let t=e.indexOf(`:`),n=e.indexOf(`?`),r=e.indexOf(`#`),i=e.indexOf(`/`);return t===-1||i!==-1&&t>i||n!==-1&&t>n||r!==-1&&t>r||ho.test(e.slice(0,t))?e:``}function So(e,t){let n=String(e);if(typeof t!=`string`)throw TypeError(`Expected character`);let r=0,i=n.indexOf(t);for(;i!==-1;)r++,i=n.indexOf(t,i+t.length);return r}function Co(e){if(typeof e!=`string`)throw TypeError(`Expected a string`);return e.replace(/[|\\{}()[\]^$+*?.]/g,`\\$&`).replace(/-/g,`\\x2d`)}function wo(e,t,n){let r=sa((n||{}).ignore||[]),i=To(t),a=-1;for(;++a<i.length;)ga(e,`text`,o);function o(e,t){let n=-1,i;for(;++n<t.length;){let e=t[n],a=i?i.children:void 0;if(r(e,a?a.indexOf(e):void 0,i))return;i=e}if(i)return s(e,t)}function s(e,t){let n=t[t.length-1],r=i[a][0],o=i[a][1],s=0,c=n.children.indexOf(e),l=!1,u=[];r.lastIndex=0;let d=r.exec(e.value);for(;d;){let n=d.index,i={index:d.index,input:d.input,stack:[...t,e]},a=o(...d,i);if(typeof a==`string`&&(a=a.length>0?{type:`text`,value:a}:void 0),a===!1?r.lastIndex=n+1:(s!==n&&u.push({type:`text`,value:e.value.slice(s,n)}),Array.isArray(a)?u.push(...a):a&&u.push(a),s=n+d[0].length,l=!0),!r.global)break;d=r.exec(e.value)}return l?(s<e.value.length&&u.push({type:`text`,value:e.value.slice(s)}),n.children.splice(c,1,...u)):u=[e],c+u.length}}function To(e){let t=[];if(!Array.isArray(e))throw TypeError(`Expected find and replace tuple or list of tuples`);let n=!e[0]||Array.isArray(e[0])?e:[e],r=-1;for(;++r<n.length;){let e=n[r];t.push([Eo(e[0]),Do(e[1])])}return t}function Eo(e){return typeof e==`string`?new RegExp(Co(e),`g`):e}function Do(e){return typeof e==`function`?e:function(){return e}}var Oo=`phrasing`,ko=[`autolink`,`link`,`image`,`label`];function Ao(){return{transforms:[Ro],enter:{literalAutolink:Mo,literalAutolinkEmail:No,literalAutolinkHttp:No,literalAutolinkWww:No},exit:{literalAutolink:Lo,literalAutolinkEmail:Io,literalAutolinkHttp:Po,literalAutolinkWww:Fo}}}function jo(){return{unsafe:[{character:`@`,before:`[+\\-.\\w]`,after:`[\\-.\\w]`,inConstruct:Oo,notInConstruct:ko},{character:`.`,before:`[Ww]`,after:`[\\-.\\w]`,inConstruct:Oo,notInConstruct:ko},{character:`:`,before:`[ps]`,after:`\\/`,inConstruct:Oo,notInConstruct:ko}]}}function Mo(e){this.enter({type:`link`,title:null,url:``,children:[]},e)}function No(e){this.config.enter.autolinkProtocol.call(this,e)}function Po(e){this.config.exit.autolinkProtocol.call(this,e)}function Fo(e){this.config.exit.data.call(this,e);let t=this.stack[this.stack.length-1];t.type,t.url=`http://`+this.sliceSerialize(e)}function Io(e){this.config.exit.autolinkEmail.call(this,e)}function Lo(e){this.exit(e)}function Ro(e){wo(e,[[/(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/gi,zo],[/(?<=^|\s|\p{P}|\p{S})([-.\w+]+)@([-\w]+(?:\.[-\w]+)+)/gu,Bo]],{ignore:[`link`,`linkReference`]})}function zo(e,t,n,r,i){let a=``;if(!Uo(i)||(/^w/i.test(t)&&(n=t+n,t=``,a=`http://`),!Vo(n)))return!1;let o=Ho(n+r);if(!o[0])return!1;let s={type:`link`,title:null,url:a+t+o[0],children:[{type:`text`,value:t+o[0]}]};return o[1]?[s,{type:`text`,value:o[1]}]:s}function Bo(e,t,n,r){return!Uo(r,!0)||/[-\d_]$/.test(n)?!1:{type:`link`,title:null,url:`mailto:`+t+`@`+n,children:[{type:`text`,value:t+`@`+n}]}}function Vo(e){let t=e.split(`.`);return!(t.length<2||t[t.length-1]&&(/_/.test(t[t.length-1])||!/[a-zA-Z\d]/.test(t[t.length-1]))||t[t.length-2]&&(/_/.test(t[t.length-2])||!/[a-zA-Z\d]/.test(t[t.length-2])))}function Ho(e){let t=/[!"&'),.:;<>?\]}]+$/.exec(e);if(!t)return[e,void 0];e=e.slice(0,t.index);let n=t[0],r=n.indexOf(`)`),i=So(e,`(`),a=So(e,`)`);for(;r!==-1&&i>a;)e+=n.slice(0,r+1),n=n.slice(r+1),r=n.indexOf(`)`),a++;return[e,n]}function Uo(e,t){let n=e.input.charCodeAt(e.index-1);return(e.index===0||Lt(n)||It(n))&&(!t||n!==47)}$o.peek=Qo;function Wo(){this.buffer()}function Go(e){this.enter({type:`footnoteReference`,identifier:``,label:``},e)}function Ko(){this.buffer()}function qo(e){this.enter({type:`footnoteDefinition`,identifier:``,label:``,children:[]},e)}function Jo(e){let t=this.resume(),n=this.stack[this.stack.length-1];n.type,n.identifier=H(this.sliceSerialize(e)).toLowerCase(),n.label=t}function Yo(e){this.exit(e)}function Xo(e){let t=this.resume(),n=this.stack[this.stack.length-1];n.type,n.identifier=H(this.sliceSerialize(e)).toLowerCase(),n.label=t}function Zo(e){this.exit(e)}function Qo(){return`[`}function $o(e,t,n,r){let i=n.createTracker(r),a=i.move(`[^`),o=n.enter(`footnoteReference`),s=n.enter(`reference`);return a+=i.move(n.safe(n.associationId(e),{after:`]`,before:a})),s(),o(),a+=i.move(`]`),a}function es(){return{enter:{gfmFootnoteCallString:Wo,gfmFootnoteCall:Go,gfmFootnoteDefinitionLabelString:Ko,gfmFootnoteDefinition:qo},exit:{gfmFootnoteCallString:Jo,gfmFootnoteCall:Yo,gfmFootnoteDefinitionLabelString:Xo,gfmFootnoteDefinition:Zo}}}function ts(e){let t=!1;return e&&e.firstLineBlank&&(t=!0),{handlers:{footnoteDefinition:n,footnoteReference:$o},unsafe:[{character:`[`,inConstruct:[`label`,`phrasing`,`reference`]}]};function n(e,n,r,i){let a=r.createTracker(i),o=a.move(`[^`),s=r.enter(`footnoteDefinition`),c=r.enter(`label`);return o+=a.move(r.safe(r.associationId(e),{before:o,after:`]`})),c(),o+=a.move(`]:`),e.children&&e.children.length>0&&(a.shift(4),o+=a.move((t?`
`:` `)+r.indentLines(r.containerFlow(e,a.current()),t?rs:ns))),s(),o}}function ns(e,t,n){return t===0?e:rs(e,t,n)}function rs(e,t,n){return(n?``:`    `)+e}var is=[`autolink`,`destinationLiteral`,`destinationRaw`,`reference`,`titleQuote`,`titleApostrophe`];ls.peek=us;function as(){return{canContainEols:[`delete`],enter:{strikethrough:ss},exit:{strikethrough:cs}}}function os(){return{unsafe:[{character:`~`,inConstruct:`phrasing`,notInConstruct:is}],handlers:{delete:ls}}}function ss(e){this.enter({type:`delete`,children:[]},e)}function cs(e){this.exit(e)}function ls(e,t,n,r){let i=n.createTracker(r),a=n.enter(`strikethrough`),o=i.move(`~~`);return o+=n.containerPhrasing(e,{...i.current(),before:o,after:`~`}),o+=i.move(`~~`),a(),o}function us(){return`~`}function ds(e){return e.length}function fs(e,t){let n=t||{},r=(n.align||[]).concat(),i=n.stringLength||ds,a=[],o=[],s=[],c=[],l=0,u=-1;for(;++u<e.length;){let t=[],r=[],a=-1;for(e[u].length>l&&(l=e[u].length);++a<e[u].length;){let o=ps(e[u][a]);if(n.alignDelimiters!==!1){let e=i(o);r[a]=e,(c[a]===void 0||e>c[a])&&(c[a]=e)}t.push(o)}o[u]=t,s[u]=r}let d=-1;if(typeof r==`object`&&`length`in r)for(;++d<l;)a[d]=ms(r[d]);else{let e=ms(r);for(;++d<l;)a[d]=e}d=-1;let f=[],p=[];for(;++d<l;){let e=a[d],t=``,r=``;e===99?(t=`:`,r=`:`):e===108?t=`:`:e===114&&(r=`:`);let i=n.alignDelimiters===!1?1:Math.max(1,c[d]-t.length-r.length),o=t+`-`.repeat(i)+r;n.alignDelimiters!==!1&&(i=t.length+i+r.length,i>c[d]&&(c[d]=i),p[d]=i),f[d]=o}o.splice(1,0,f),s.splice(1,0,p),u=-1;let m=[];for(;++u<o.length;){let e=o[u],t=s[u];d=-1;let r=[];for(;++d<l;){let i=e[d]||``,o=``,s=``;if(n.alignDelimiters!==!1){let e=c[d]-(t[d]||0),n=a[d];n===114?o=` `.repeat(e):n===99?e%2?(o=` `.repeat(e/2+.5),s=` `.repeat(e/2-.5)):(o=` `.repeat(e/2),s=o):s=` `.repeat(e)}n.delimiterStart!==!1&&!d&&r.push(`|`),n.padding!==!1&&(n.alignDelimiters!==!1||i!==``)&&(n.delimiterStart!==!1||d)&&r.push(` `),n.alignDelimiters!==!1&&r.push(o),r.push(i),n.alignDelimiters!==!1&&r.push(s),n.padding!==!1&&r.push(` `),(n.delimiterEnd!==!1||d!==l-1)&&r.push(`|`)}m.push(n.delimiterEnd===!1?r.join(``).replace(/ +$/,``):r.join(``))}return m.join(`
`)}function ps(e){return e==null?``:String(e)}function ms(e){let t=typeof e==`string`?e.codePointAt(0):0;return t===67||t===99?99:t===76||t===108?108:t===82||t===114?114:0}function hs(e,t,n,r){let i=n.enter(`blockquote`),a=n.createTracker(r);a.move(`> `),a.shift(2);let o=n.indentLines(n.containerFlow(e,a.current()),gs);return i(),o}function gs(e,t,n){return`>`+(n?``:` `)+e}function _s(e,t){return vs(e,t.inConstruct,!0)&&!vs(e,t.notInConstruct,!1)}function vs(e,t,n){if(typeof t==`string`&&(t=[t]),!t||t.length===0)return n;let r=-1;for(;++r<t.length;)if(e.includes(t[r]))return!0;return!1}function ys(e,t,n,r){let i=-1;for(;++i<n.unsafe.length;)if(n.unsafe[i].character===`
`&&_s(n.stack,n.unsafe[i]))return/[ \t]/.test(r.before)?``:` `;return`\\
`}function bs(e,t){let n=String(e),r=n.indexOf(t),i=r,a=0,o=0;if(typeof t!=`string`)throw TypeError(`Expected substring`);for(;r!==-1;)r===i?++a>o&&(o=a):a=1,i=r+t.length,r=n.indexOf(t,i);return o}function xs(e,t){return!!(t.options.fences===!1&&e.value&&!e.lang&&/[^ \r\n]/.test(e.value)&&!/^[\t ]*(?:[\r\n]|$)|(?:^|[\r\n])[\t ]*$/.test(e.value))}function Ss(e){let t=e.options.fence||"`";if(t!=="`"&&t!==`~`)throw Error("Cannot serialize code with `"+t+"` for `options.fence`, expected `` ` `` or `~`");return t}function Cs(e,t,n,r){let i=Ss(n),a=e.value||``,o=i==="`"?`GraveAccent`:`Tilde`;if(xs(e,n)){let e=n.enter(`codeIndented`),t=n.indentLines(a,ws);return e(),t}let s=n.createTracker(r),c=i.repeat(Math.max(bs(a,i)+1,3)),l=n.enter(`codeFenced`),u=s.move(c);if(e.lang){let t=n.enter(`codeFencedLang${o}`);u+=s.move(n.safe(e.lang,{before:u,after:` `,encode:["`"],...s.current()})),t()}if(e.lang&&e.meta){let t=n.enter(`codeFencedMeta${o}`);u+=s.move(` `),u+=s.move(n.safe(e.meta,{before:u,after:`
`,encode:["`"],...s.current()})),t()}return u+=s.move(`
`),a&&(u+=s.move(a+`
`)),u+=s.move(c),l(),u}function ws(e,t,n){return(n?``:`    `)+e}function Ts(e){let t=e.options.quote||`"`;if(t!==`"`&&t!==`'`)throw Error("Cannot serialize title with `"+t+"` for `options.quote`, expected `\"`, or `'`");return t}function Es(e,t,n,r){let i=Ts(n),a=i===`"`?`Quote`:`Apostrophe`,o=n.enter(`definition`),s=n.enter(`label`),c=n.createTracker(r),l=c.move(`[`);return l+=c.move(n.safe(n.associationId(e),{before:l,after:`]`,...c.current()})),l+=c.move(`]: `),s(),!e.url||/[\0- \u007F]/.test(e.url)?(s=n.enter(`destinationLiteral`),l+=c.move(`<`),l+=c.move(n.safe(e.url,{before:l,after:`>`,...c.current()})),l+=c.move(`>`)):(s=n.enter(`destinationRaw`),l+=c.move(n.safe(e.url,{before:l,after:e.title?` `:`
`,...c.current()}))),s(),e.title&&(s=n.enter(`title${a}`),l+=c.move(` `+i),l+=c.move(n.safe(e.title,{before:l,after:i,...c.current()})),l+=c.move(i),s()),o(),l}function Ds(e){let t=e.options.emphasis||`*`;if(t!==`*`&&t!==`_`)throw Error("Cannot serialize emphasis with `"+t+"` for `options.emphasis`, expected `*`, or `_`");return t}function Os(e){return`&#x`+e.toString(16).toUpperCase()+`;`}function ks(e,t,n){let r=Kt(e),i=Kt(t);return r===void 0?i===void 0?n===`_`?{inside:!0,outside:!0}:{inside:!1,outside:!1}:i===1?{inside:!0,outside:!0}:{inside:!1,outside:!0}:r===1?i===void 0?{inside:!1,outside:!1}:i===1?{inside:!0,outside:!0}:{inside:!1,outside:!1}:i===void 0?{inside:!1,outside:!1}:i===1?{inside:!0,outside:!1}:{inside:!1,outside:!1}}As.peek=js;function As(e,t,n,r){let i=Ds(n),a=n.enter(`emphasis`),o=n.createTracker(r),s=o.move(i),c=o.move(n.containerPhrasing(e,{after:i,before:s,...o.current()})),l=c.charCodeAt(0),u=ks(r.before.charCodeAt(r.before.length-1),l,i);u.inside&&(c=Os(l)+c.slice(1));let d=c.charCodeAt(c.length-1),f=ks(r.after.charCodeAt(0),d,i);f.inside&&(c=c.slice(0,-1)+Os(d));let p=o.move(i);return a(),n.attentionEncodeSurroundingInfo={after:f.outside,before:u.outside},s+c+p}function js(e,t,n){return n.options.emphasis||`*`}function Ms(e,t){let n=!1;return va(e,function(e){if(`value`in e&&/\r?\n|\r/.test(e.value)||e.type===`break`)return n=!0,!1}),!!((!e.depth||e.depth<3)&&bt(e)&&(t.options.setext||n))}function Ns(e,t,n,r){let i=Math.max(Math.min(6,e.depth||1),1),a=n.createTracker(r);if(Ms(e,n)){let t=n.enter(`headingSetext`),r=n.enter(`phrasing`),o=n.containerPhrasing(e,{...a.current(),before:`
`,after:`
`});return r(),t(),o+`
`+(i===1?`=`:`-`).repeat(o.length-(Math.max(o.lastIndexOf(`\r`),o.lastIndexOf(`
`))+1))}let o=`#`.repeat(i),s=n.enter(`headingAtx`),c=n.enter(`phrasing`);a.move(o+` `);let l=n.containerPhrasing(e,{before:`# `,after:`
`,...a.current()});return/^[\t ]/.test(l)&&(l=Os(l.charCodeAt(0))+l.slice(1)),l=l?o+` `+l:o,n.options.closeAtx&&(l+=` `+o),c(),s(),l}Ps.peek=Fs;function Ps(e){return e.value||``}function Fs(){return`<`}Is.peek=Ls;function Is(e,t,n,r){let i=Ts(n),a=i===`"`?`Quote`:`Apostrophe`,o=n.enter(`image`),s=n.enter(`label`),c=n.createTracker(r),l=c.move(`![`);return l+=c.move(n.safe(e.alt,{before:l,after:`]`,...c.current()})),l+=c.move(`](`),s(),!e.url&&e.title||/[\0- \u007F]/.test(e.url)?(s=n.enter(`destinationLiteral`),l+=c.move(`<`),l+=c.move(n.safe(e.url,{before:l,after:`>`,...c.current()})),l+=c.move(`>`)):(s=n.enter(`destinationRaw`),l+=c.move(n.safe(e.url,{before:l,after:e.title?` `:`)`,...c.current()}))),s(),e.title&&(s=n.enter(`title${a}`),l+=c.move(` `+i),l+=c.move(n.safe(e.title,{before:l,after:i,...c.current()})),l+=c.move(i),s()),l+=c.move(`)`),o(),l}function Ls(){return`!`}Rs.peek=zs;function Rs(e,t,n,r){let i=e.referenceType,a=n.enter(`imageReference`),o=n.enter(`label`),s=n.createTracker(r),c=s.move(`![`),l=n.safe(e.alt,{before:c,after:`]`,...s.current()});c+=s.move(l+`][`),o();let u=n.stack;n.stack=[],o=n.enter(`reference`);let d=n.safe(n.associationId(e),{before:c,after:`]`,...s.current()});return o(),n.stack=u,a(),i===`full`||!l||l!==d?c+=s.move(d+`]`):i===`shortcut`?c=c.slice(0,-1):c+=s.move(`]`),c}function zs(){return`!`}Bs.peek=Vs;function Bs(e,t,n){let r=e.value||``,i="`",a=-1;for(;RegExp("(^|[^`])"+i+"([^`]|$)").test(r);)i+="`";for(/[^ \r\n]/.test(r)&&(/^[ \r\n]/.test(r)&&/[ \r\n]$/.test(r)||/^`|`$/.test(r))&&(r=` `+r+` `);++a<n.unsafe.length;){let e=n.unsafe[a],t=n.compilePattern(e),i;if(e.atBreak)for(;i=t.exec(r);){let e=i.index;r.charCodeAt(e)===10&&r.charCodeAt(e-1)===13&&e--,r=r.slice(0,e)+` `+r.slice(i.index+1)}}return i+r+i}function Vs(){return"`"}function Hs(e,t){let n=bt(e);return!!(!t.options.resourceLink&&e.url&&!e.title&&e.children&&e.children.length===1&&e.children[0].type===`text`&&(n===e.url||`mailto:`+n===e.url)&&/^[a-z][a-z+.-]+:/i.test(e.url)&&!/[\0- <>\u007F]/.test(e.url))}Us.peek=Ws;function Us(e,t,n,r){let i=Ts(n),a=i===`"`?`Quote`:`Apostrophe`,o=n.createTracker(r),s,c;if(Hs(e,n)){let t=n.stack;n.stack=[],s=n.enter(`autolink`);let r=o.move(`<`);return r+=o.move(n.containerPhrasing(e,{before:r,after:`>`,...o.current()})),r+=o.move(`>`),s(),n.stack=t,r}s=n.enter(`link`),c=n.enter(`label`);let l=o.move(`[`);return l+=o.move(n.containerPhrasing(e,{before:l,after:`](`,...o.current()})),l+=o.move(`](`),c(),!e.url&&e.title||/[\0- \u007F]/.test(e.url)?(c=n.enter(`destinationLiteral`),l+=o.move(`<`),l+=o.move(n.safe(e.url,{before:l,after:`>`,...o.current()})),l+=o.move(`>`)):(c=n.enter(`destinationRaw`),l+=o.move(n.safe(e.url,{before:l,after:e.title?` `:`)`,...o.current()}))),c(),e.title&&(c=n.enter(`title${a}`),l+=o.move(` `+i),l+=o.move(n.safe(e.title,{before:l,after:i,...o.current()})),l+=o.move(i),c()),l+=o.move(`)`),s(),l}function Ws(e,t,n){return Hs(e,n)?`<`:`[`}Gs.peek=Ks;function Gs(e,t,n,r){let i=e.referenceType,a=n.enter(`linkReference`),o=n.enter(`label`),s=n.createTracker(r),c=s.move(`[`),l=n.containerPhrasing(e,{before:c,after:`]`,...s.current()});c+=s.move(l+`][`),o();let u=n.stack;n.stack=[],o=n.enter(`reference`);let d=n.safe(n.associationId(e),{before:c,after:`]`,...s.current()});return o(),n.stack=u,a(),i===`full`||!l||l!==d?c+=s.move(d+`]`):i===`shortcut`?c=c.slice(0,-1):c+=s.move(`]`),c}function Ks(){return`[`}function qs(e){let t=e.options.bullet||`*`;if(t!==`*`&&t!==`+`&&t!==`-`)throw Error("Cannot serialize items with `"+t+"` for `options.bullet`, expected `*`, `+`, or `-`");return t}function Js(e){let t=qs(e),n=e.options.bulletOther;if(!n)return t===`*`?`-`:`*`;if(n!==`*`&&n!==`+`&&n!==`-`)throw Error("Cannot serialize items with `"+n+"` for `options.bulletOther`, expected `*`, `+`, or `-`");if(n===t)throw Error("Expected `bullet` (`"+t+"`) and `bulletOther` (`"+n+"`) to be different");return n}function Ys(e){let t=e.options.bulletOrdered||`.`;if(t!==`.`&&t!==`)`)throw Error("Cannot serialize items with `"+t+"` for `options.bulletOrdered`, expected `.` or `)`");return t}function Xs(e){let t=e.options.rule||`*`;if(t!==`*`&&t!==`-`&&t!==`_`)throw Error("Cannot serialize rules with `"+t+"` for `options.rule`, expected `*`, `-`, or `_`");return t}function Zs(e,t,n,r){let i=n.enter(`list`),a=n.bulletCurrent,o=e.ordered?Ys(n):qs(n),s=e.ordered?o===`.`?`)`:`.`:Js(n),c=t&&n.bulletLastUsed?o===n.bulletLastUsed:!1;if(!e.ordered){let t=e.children?e.children[0]:void 0;if((o===`*`||o===`-`)&&t&&(!t.children||!t.children[0])&&n.stack[n.stack.length-1]===`list`&&n.stack[n.stack.length-2]===`listItem`&&n.stack[n.stack.length-3]===`list`&&n.stack[n.stack.length-4]===`listItem`&&n.indexStack[n.indexStack.length-1]===0&&n.indexStack[n.indexStack.length-2]===0&&n.indexStack[n.indexStack.length-3]===0&&(c=!0),Xs(n)===o&&t){let t=-1;for(;++t<e.children.length;){let n=e.children[t];if(n&&n.type===`listItem`&&n.children&&n.children[0]&&n.children[0].type===`thematicBreak`){c=!0;break}}}}c&&(o=s),n.bulletCurrent=o;let l=n.containerFlow(e,r);return n.bulletLastUsed=o,n.bulletCurrent=a,i(),l}function Qs(e){let t=e.options.listItemIndent||`one`;if(t!==`tab`&&t!==`one`&&t!==`mixed`)throw Error("Cannot serialize items with `"+t+"` for `options.listItemIndent`, expected `tab`, `one`, or `mixed`");return t}function $s(e,t,n,r){let i=Qs(n),a=n.bulletCurrent||qs(n);t&&t.type===`list`&&t.ordered&&(a=(typeof t.start==`number`&&t.start>-1?t.start:1)+(n.options.incrementListMarker===!1?0:t.children.indexOf(e))+a);let o=a.length+1;(i===`tab`||i===`mixed`&&(t&&t.type===`list`&&t.spread||e.spread))&&(o=Math.ceil(o/4)*4);let s=n.createTracker(r);s.move(a+` `.repeat(o-a.length)),s.shift(o);let c=n.enter(`listItem`),l=n.indentLines(n.containerFlow(e,s.current()),u);return c(),l;function u(e,t,n){return t?(n?``:` `.repeat(o))+e:(n?a:a+` `.repeat(o-a.length))+e}}function ec(e,t,n,r){let i=n.enter(`paragraph`),a=n.enter(`phrasing`),o=n.containerPhrasing(e,r);return a(),i(),o}var tc=sa([`break`,`delete`,`emphasis`,`footnote`,`footnoteReference`,`image`,`imageReference`,`inlineCode`,`inlineMath`,`link`,`linkReference`,`mdxJsxTextElement`,`mdxTextExpression`,`strong`,`text`,`textDirective`]);function nc(e,t,n,r){return(e.children.some(function(e){return tc(e)})?n.containerPhrasing:n.containerFlow).call(n,e,r)}function rc(e){let t=e.options.strong||`*`;if(t!==`*`&&t!==`_`)throw Error("Cannot serialize strong with `"+t+"` for `options.strong`, expected `*`, or `_`");return t}ic.peek=ac;function ic(e,t,n,r){let i=rc(n),a=n.enter(`strong`),o=n.createTracker(r),s=o.move(i+i),c=o.move(n.containerPhrasing(e,{after:i,before:s,...o.current()})),l=c.charCodeAt(0),u=ks(r.before.charCodeAt(r.before.length-1),l,i);u.inside&&(c=Os(l)+c.slice(1));let d=c.charCodeAt(c.length-1),f=ks(r.after.charCodeAt(0),d,i);f.inside&&(c=c.slice(0,-1)+Os(d));let p=o.move(i+i);return a(),n.attentionEncodeSurroundingInfo={after:f.outside,before:u.outside},s+c+p}function ac(e,t,n){return n.options.strong||`*`}function oc(e,t,n,r){return n.safe(e.value,r)}function sc(e){let t=e.options.ruleRepetition||3;if(t<3)throw Error("Cannot serialize rules with repetition `"+t+"` for `options.ruleRepetition`, expected `3` or more");return t}function cc(e,t,n){let r=(Xs(n)+(n.options.ruleSpaces?` `:``)).repeat(sc(n));return n.options.ruleSpaces?r.slice(0,-1):r}var lc={blockquote:hs,break:ys,code:Cs,definition:Es,emphasis:As,hardBreak:ys,heading:Ns,html:Ps,image:Is,imageReference:Rs,inlineCode:Bs,link:Us,linkReference:Gs,list:Zs,listItem:$s,paragraph:ec,root:nc,strong:ic,text:oc,thematicBreak:cc};function uc(){return{enter:{table:dc,tableData:hc,tableHeader:hc,tableRow:pc},exit:{codeText:gc,table:fc,tableData:mc,tableHeader:mc,tableRow:mc}}}function dc(e){let t=e._align;this.enter({type:`table`,align:t.map(function(e){return e===`none`?null:e}),children:[]},e),this.data.inTable=!0}function fc(e){this.exit(e),this.data.inTable=void 0}function pc(e){this.enter({type:`tableRow`,children:[]},e)}function mc(e){this.exit(e)}function hc(e){this.enter({type:`tableCell`,children:[]},e)}function gc(e){let t=this.resume();this.data.inTable&&(t=t.replace(/\\([\\|])/g,_c));let n=this.stack[this.stack.length-1];n.type,n.value=t,this.exit(e)}function _c(e,t){return t===`|`?t:e}function vc(e){let t=e||{},n=t.tableCellPadding,r=t.tablePipeAlign,i=t.stringLength,a=n?` `:`|`;return{unsafe:[{character:`\r`,inConstruct:`tableCell`},{character:`
`,inConstruct:`tableCell`},{atBreak:!0,character:`|`,after:`[	 :-]`},{character:`|`,inConstruct:`tableCell`},{atBreak:!0,character:`:`,after:`-`},{atBreak:!0,character:`-`,after:`[:|-]`}],handlers:{inlineCode:f,table:o,tableCell:c,tableRow:s}};function o(e,t,n,r){return l(u(e,n,r),e.align)}function s(e,t,n,r){let i=l([d(e,n,r)]);return i.slice(0,i.indexOf(`
`))}function c(e,t,n,r){let i=n.enter(`tableCell`),o=n.enter(`phrasing`),s=n.containerPhrasing(e,{...r,before:a,after:a});return o(),i(),s}function l(e,t){return fs(e,{align:t,alignDelimiters:r,padding:n,stringLength:i})}function u(e,t,n){let r=e.children,i=-1,a=[],o=t.enter(`table`);for(;++i<r.length;)a[i]=d(r[i],t,n);return o(),a}function d(e,t,n){let r=e.children,i=-1,a=[],o=t.enter(`tableRow`);for(;++i<r.length;)a[i]=c(r[i],e,t,n);return o(),a}function f(e,t,n){let r=lc.inlineCode(e,t,n);return n.stack.includes(`tableCell`)&&(r=r.replace(/\|/g,`\\$&`)),r}}function yc(){return{exit:{taskListCheckValueChecked:xc,taskListCheckValueUnchecked:xc,paragraph:Sc}}}function bc(){return{unsafe:[{atBreak:!0,character:`-`,after:`[:|-]`}],handlers:{listItem:Cc}}}function xc(e){let t=this.stack[this.stack.length-2];t.type,t.checked=e.type===`taskListCheckValueChecked`}function Sc(e){let t=this.stack[this.stack.length-2];if(t&&t.type===`listItem`&&typeof t.checked==`boolean`){let e=this.stack[this.stack.length-1];e.type;let n=e.children[0];if(n&&n.type===`text`){let r=t.children,i=-1,a;for(;++i<r.length;){let e=r[i];if(e.type===`paragraph`){a=e;break}}a===e&&(n.value=n.value.slice(1),n.value.length===0?e.children.shift():e.position&&n.position&&typeof n.position.start.offset==`number`&&(n.position.start.column++,n.position.start.offset++,e.position.start=Object.assign({},n.position.start)))}}this.exit(e)}function Cc(e,t,n,r){let i=e.children[0],a=typeof e.checked==`boolean`&&i&&i.type===`paragraph`,o=`[`+(e.checked?`x`:` `)+`] `,s=n.createTracker(r);a&&s.move(o);let c=lc.listItem(e,t,n,{...r,...s.current()});return a&&(c=c.replace(/^(?:[*+-]|\d+\.)([\r\n]| {1,3})/,l)),c;function l(e){return e+o}}function wc(){return[Ao(),es(),as(),uc(),yc()]}function Tc(e){return{extensions:[jo(),ts(e),os(),vc(e),bc()]}}var Ec={tokenize:Rc,partial:!0},Dc={tokenize:zc,partial:!0},Oc={tokenize:Bc,partial:!0},kc={tokenize:Vc,partial:!0},Ac={tokenize:Hc,partial:!0},jc={name:`wwwAutolink`,tokenize:Ic,previous:Uc},Mc={name:`protocolAutolink`,tokenize:Lc,previous:Wc},Q={name:`emailAutolink`,tokenize:Fc,previous:Gc},$={};function Nc(){return{text:$}}for(var Pc=48;Pc<123;)$[Pc]=Q,Pc++,Pc===58?Pc=65:Pc===91&&(Pc=97);$[43]=Q,$[45]=Q,$[46]=Q,$[95]=Q,$[72]=[Q,Mc],$[104]=[Q,Mc],$[87]=[Q,jc],$[119]=[Q,jc];function Fc(e,t,n){let r=this,i,a;return o;function o(t){return!Kc(t)||!Gc.call(r,r.previous)||qc(r.events)?n(t):(e.enter(`literalAutolink`),e.enter(`literalAutolinkEmail`),s(t))}function s(t){return Kc(t)?(e.consume(t),s):t===64?(e.consume(t),c):n(t)}function c(t){return t===46?e.check(Ac,u,l)(t):t===45||t===95||W(t)?(a=!0,e.consume(t),c):u(t)}function l(t){return e.consume(t),i=!0,c}function u(o){return a&&i&&U(r.previous)?(e.exit(`literalAutolinkEmail`),e.exit(`literalAutolink`),t(o)):n(o)}}function Ic(e,t,n){let r=this;return i;function i(t){return t!==87&&t!==119||!Uc.call(r,r.previous)||qc(r.events)?n(t):(e.enter(`literalAutolink`),e.enter(`literalAutolinkWww`),e.check(Ec,e.attempt(Dc,e.attempt(Oc,a),n),n)(t))}function a(n){return e.exit(`literalAutolinkWww`),e.exit(`literalAutolink`),t(n)}}function Lc(e,t,n){let r=this,i=``,a=!1;return o;function o(t){return(t===72||t===104)&&Wc.call(r,r.previous)&&!qc(r.events)?(e.enter(`literalAutolink`),e.enter(`literalAutolinkHttp`),i+=String.fromCodePoint(t),e.consume(t),s):n(t)}function s(t){if(U(t)&&i.length<5)return i+=String.fromCodePoint(t),e.consume(t),s;if(t===58){let n=i.toLowerCase();if(n===`http`||n===`https`)return e.consume(t),c}return n(t)}function c(t){return t===47?(e.consume(t),a?l:(a=!0,c)):n(t)}function l(t){return t===null||Mt(t)||K(t)||Lt(t)||It(t)?n(t):e.attempt(Dc,e.attempt(Oc,u),n)(t)}function u(n){return e.exit(`literalAutolinkHttp`),e.exit(`literalAutolink`),t(n)}}function Rc(e,t,n){let r=0;return i;function i(t){return(t===87||t===119)&&r<3?(r++,e.consume(t),i):t===46&&r===3?(e.consume(t),a):n(t)}function a(e){return e===null?n(e):t(e)}}function zc(e,t,n){let r,i,a;return o;function o(t){return t===46||t===95?e.check(kc,c,s)(t):t===null||K(t)||Lt(t)||t!==45&&It(t)?c(t):(a=!0,e.consume(t),o)}function s(t){return t===95?r=!0:(i=r,r=void 0),e.consume(t),o}function c(e){return i||r||!a?n(e):t(e)}}function Bc(e,t){let n=0,r=0;return i;function i(o){return o===40?(n++,e.consume(o),i):o===41&&r<n?a(o):o===33||o===34||o===38||o===39||o===41||o===42||o===44||o===46||o===58||o===59||o===60||o===63||o===93||o===95||o===126?e.check(kc,t,a)(o):o===null||K(o)||Lt(o)?t(o):(e.consume(o),i)}function a(t){return t===41&&r++,e.consume(t),i}}function Vc(e,t,n){return r;function r(o){return o===33||o===34||o===39||o===41||o===42||o===44||o===46||o===58||o===59||o===63||o===95||o===126?(e.consume(o),r):o===38?(e.consume(o),a):o===93?(e.consume(o),i):o===60||o===null||K(o)||Lt(o)?t(o):n(o)}function i(e){return e===null||e===40||e===91||K(e)||Lt(e)?t(e):r(e)}function a(e){return U(e)?o(e):n(e)}function o(t){return t===59?(e.consume(t),r):U(t)?(e.consume(t),o):n(t)}}function Hc(e,t,n){return r;function r(t){return e.consume(t),i}function i(e){return W(e)?n(e):t(e)}}function Uc(e){return e===null||e===40||e===42||e===95||e===91||e===93||e===126||K(e)}function Wc(e){return!U(e)}function Gc(e){return!(e===47||Kc(e))}function Kc(e){return e===43||e===45||e===46||e===95||W(e)}function qc(e){let t=e.length,n=!1;for(;t--;){let r=e[t][1];if((r.type===`labelLink`||r.type===`labelImage`)&&!r._balanced){n=!0;break}if(r._gfmAutolinkLiteralWalkedInto){n=!1;break}}return e.length>0&&!n&&(e[e.length-1][1]._gfmAutolinkLiteralWalkedInto=!0),n}var Jc={tokenize:nl,partial:!0};function Yc(){return{document:{91:{name:`gfmFootnoteDefinition`,tokenize:$c,continuation:{tokenize:el},exit:tl}},text:{91:{name:`gfmFootnoteCall`,tokenize:Qc},93:{name:`gfmPotentialFootnoteCall`,add:`after`,tokenize:Xc,resolveTo:Zc}}}}function Xc(e,t,n){let r=this,i=r.events.length,a=r.parser.gfmFootnotes||(r.parser.gfmFootnotes=[]),o;for(;i--;){let e=r.events[i][1];if(e.type===`labelImage`){o=e;break}if(e.type===`gfmFootnoteCall`||e.type===`labelLink`||e.type===`label`||e.type===`image`||e.type===`link`)break}return s;function s(i){if(!o||!o._balanced)return n(i);let s=H(r.sliceSerialize({start:o.end,end:r.now()}));return s.codePointAt(0)!==94||!a.includes(s.slice(1))?n(i):(e.enter(`gfmFootnoteCallLabelMarker`),e.consume(i),e.exit(`gfmFootnoteCallLabelMarker`),t(i))}}function Zc(e,t){let n=e.length;for(;n--;)if(e[n][1].type===`labelImage`&&e[n][0]===`enter`){e[n][1];break}e[n+1][1].type=`data`,e[n+3][1].type=`gfmFootnoteCallLabelMarker`;let r={type:`gfmFootnoteCall`,start:Object.assign({},e[n+3][1].start),end:Object.assign({},e[e.length-1][1].end)},i={type:`gfmFootnoteCallMarker`,start:Object.assign({},e[n+3][1].end),end:Object.assign({},e[n+3][1].end)};i.end.column++,i.end.offset++,i.end._bufferIndex++;let a={type:`gfmFootnoteCallString`,start:Object.assign({},i.end),end:Object.assign({},e[e.length-1][1].start)},o={type:`chunkString`,contentType:`string`,start:Object.assign({},a.start),end:Object.assign({},a.end)},s=[e[n+1],e[n+2],[`enter`,r,t],e[n+3],e[n+4],[`enter`,i,t],[`exit`,i,t],[`enter`,a,t],[`enter`,o,t],[`exit`,o,t],[`exit`,a,t],e[e.length-2],e[e.length-1],[`exit`,r,t]];return e.splice(n,e.length-n+1,...s),e}function Qc(e,t,n){let r=this,i=r.parser.gfmFootnotes||(r.parser.gfmFootnotes=[]),a=0,o;return s;function s(t){return e.enter(`gfmFootnoteCall`),e.enter(`gfmFootnoteCallLabelMarker`),e.consume(t),e.exit(`gfmFootnoteCallLabelMarker`),c}function c(t){return t===94?(e.enter(`gfmFootnoteCallMarker`),e.consume(t),e.exit(`gfmFootnoteCallMarker`),e.enter(`gfmFootnoteCallString`),e.enter(`chunkString`).contentType=`string`,l):n(t)}function l(s){if(a>999||s===93&&!o||s===null||s===91||K(s))return n(s);if(s===93){e.exit(`chunkString`);let a=e.exit(`gfmFootnoteCallString`);return i.includes(H(r.sliceSerialize(a)))?(e.enter(`gfmFootnoteCallLabelMarker`),e.consume(s),e.exit(`gfmFootnoteCallLabelMarker`),e.exit(`gfmFootnoteCall`),t):n(s)}return K(s)||(o=!0),a++,e.consume(s),s===92?u:l}function u(t){return t===91||t===92||t===93?(e.consume(t),a++,l):l(t)}}function $c(e,t,n){let r=this,i=r.parser.gfmFootnotes||(r.parser.gfmFootnotes=[]),a,o=0,s;return c;function c(t){return e.enter(`gfmFootnoteDefinition`)._container=!0,e.enter(`gfmFootnoteDefinitionLabel`),e.enter(`gfmFootnoteDefinitionLabelMarker`),e.consume(t),e.exit(`gfmFootnoteDefinitionLabelMarker`),l}function l(t){return t===94?(e.enter(`gfmFootnoteDefinitionMarker`),e.consume(t),e.exit(`gfmFootnoteDefinitionMarker`),e.enter(`gfmFootnoteDefinitionLabelString`),e.enter(`chunkString`).contentType=`string`,u):n(t)}function u(t){if(o>999||t===93&&!s||t===null||t===91||K(t))return n(t);if(t===93){e.exit(`chunkString`);let n=e.exit(`gfmFootnoteDefinitionLabelString`);return a=H(r.sliceSerialize(n)),e.enter(`gfmFootnoteDefinitionLabelMarker`),e.consume(t),e.exit(`gfmFootnoteDefinitionLabelMarker`),e.exit(`gfmFootnoteDefinitionLabel`),f}return K(t)||(s=!0),o++,e.consume(t),t===92?d:u}function d(t){return t===91||t===92||t===93?(e.consume(t),o++,u):u(t)}function f(t){return t===58?(e.enter(`definitionMarker`),e.consume(t),e.exit(`definitionMarker`),i.includes(a)||i.push(a),J(e,p,`gfmFootnoteDefinitionWhitespace`)):n(t)}function p(e){return t(e)}}function el(e,t,n){return e.check(en,t,e.attempt(Jc,t,n))}function tl(e){e.exit(`gfmFootnoteDefinition`)}function nl(e,t,n){let r=this;return J(e,i,`gfmFootnoteDefinitionIndent`,5);function i(e){let i=r.events[r.events.length-1];return i&&i[1].type===`gfmFootnoteDefinitionIndent`&&i[2].sliceSerialize(i[1],!0).length===4?t(e):n(e)}}function rl(e){let t=(e||{}).singleTilde,n={name:`strikethrough`,tokenize:i,resolveAll:r};return t??=!0,{text:{126:n},insideSpan:{null:[n]},attentionMarkers:{null:[126]}};function r(e,t){let n=-1;for(;++n<e.length;)if(e[n][0]===`enter`&&e[n][1].type===`strikethroughSequenceTemporary`&&e[n][1]._close){let r=n;for(;r--;)if(e[r][0]===`exit`&&e[r][1].type===`strikethroughSequenceTemporary`&&e[r][1]._open&&e[n][1].end.offset-e[n][1].start.offset===e[r][1].end.offset-e[r][1].start.offset){e[n][1].type=`strikethroughSequence`,e[r][1].type=`strikethroughSequence`;let i={type:`strikethrough`,start:Object.assign({},e[r][1].start),end:Object.assign({},e[n][1].end)},a={type:`strikethroughText`,start:Object.assign({},e[r][1].end),end:Object.assign({},e[n][1].start)},o=[[`enter`,i,t],[`enter`,e[r][1],t],[`exit`,e[r][1],t],[`enter`,a,t]],s=t.parser.constructs.insideSpan.null;s&&B(o,o.length,0,qt(s,e.slice(r+1,n),t)),B(o,o.length,0,[[`exit`,a,t],[`enter`,e[n][1],t],[`exit`,e[n][1],t],[`exit`,i,t]]),B(e,r-1,n-r+3,o),n=r+o.length-2;break}}for(n=-1;++n<e.length;)e[n][1].type===`strikethroughSequenceTemporary`&&(e[n][1].type=`data`);return e}function i(e,n,r){let i=this.previous,a=this.events,o=0;return s;function s(t){return i===126&&a[a.length-1][1].type!==`characterEscape`?r(t):(e.enter(`strikethroughSequenceTemporary`),c(t))}function c(a){let s=Kt(i);if(a===126)return o>1?r(a):(e.consume(a),o++,c);if(o<2&&!t)return r(a);let l=e.exit(`strikethroughSequenceTemporary`),u=Kt(a);return l._open=!u||u===2&&!!s,l._close=!s||s===2&&!!u,n(a)}}}var il=class{constructor(){this.map=[],this.index=new Map}add(e,t,n){al(this,e,t,n)}consume(e){if(this.map.sort(function(e,t){return e[0]-t[0]}),this.map.length===0)return;let t=this.map.length,n=[];for(;t>0;)--t,n.push(e.slice(this.map[t][0]+this.map[t][1]),this.map[t][2]),e.length=this.map[t][0];n.push(e.slice()),e.length=0;let r=n.pop();for(;r;){for(let t of r)e.push(t);r=n.pop()}this.map.length=0,this.index.clear()}};function al(e,t,n,r){if(n===0&&r.length===0)return;let i=e.index.get(t);if(i){i[1]+=n,i[2].push(...r);return}let a=[t,n,r];e.map.push(a),e.index.set(t,a)}function ol(e,t){let n=!1,r=[];for(;t<e.length;){let i=e[t];if(n){if(i[0]===`enter`)i[1].type===`tableContent`&&r.push(e[t+1][1].type===`tableDelimiterMarker`?`left`:`none`);else if(i[1].type===`tableContent`){if(e[t-1][1].type===`tableDelimiterMarker`){let e=r.length-1;r[e]=r[e]===`left`?`center`:`right`}}else if(i[1].type===`tableDelimiterRow`)break}else i[0]===`enter`&&i[1].type===`tableDelimiterRow`&&(n=!0);t+=1}return r}function sl(){return{flow:{null:{name:`table`,tokenize:cl,resolveAll:ll}}}}function cl(e,t,n){let r=this,i=0,a=0,o;return s;function s(e){let t=r.events.length-1;for(;t>-1;){let{type:e}=r.events[t][1];if(e===`lineEnding`||e===`linePrefix`)t--;else break}let i=t>-1?r.events[t][1].type:null,a=i===`tableHead`||i===`tableRow`?S:c;return a===S&&r.parser.lazy[r.now().line]?n(e):a(e)}function c(t){return e.enter(`tableHead`),e.enter(`tableRow`),l(t)}function l(e){return e===124?u(e):(o=!0,a+=1,u(e))}function u(t){return t===null?n(t):G(t)?a>1?(a=0,r.interrupt=!0,e.exit(`tableRow`),e.enter(`lineEnding`),e.consume(t),e.exit(`lineEnding`),p):n(t):q(t)?J(e,u,`whitespace`)(t):(a+=1,o&&(o=!1,i+=1),t===124?(e.enter(`tableCellDivider`),e.consume(t),e.exit(`tableCellDivider`),o=!0,u):(e.enter(`data`),d(t)))}function d(t){return t===null||t===124||K(t)?(e.exit(`data`),u(t)):(e.consume(t),t===92?f:d)}function f(t){return t===92||t===124?(e.consume(t),d):d(t)}function p(t){return r.interrupt=!1,r.parser.lazy[r.now().line]?n(t):(e.enter(`tableDelimiterRow`),o=!1,q(t)?J(e,m,`linePrefix`,r.parser.constructs.disable.null.includes(`codeIndented`)?void 0:4)(t):m(t))}function m(t){return t===45||t===58?g(t):t===124?(o=!0,e.enter(`tableCellDivider`),e.consume(t),e.exit(`tableCellDivider`),h):x(t)}function h(t){return q(t)?J(e,g,`whitespace`)(t):g(t)}function g(t){return t===58?(a+=1,o=!0,e.enter(`tableDelimiterMarker`),e.consume(t),e.exit(`tableDelimiterMarker`),_):t===45?(a+=1,_(t)):t===null||G(t)?b(t):x(t)}function _(t){return t===45?(e.enter(`tableDelimiterFiller`),v(t)):x(t)}function v(t){return t===45?(e.consume(t),v):t===58?(o=!0,e.exit(`tableDelimiterFiller`),e.enter(`tableDelimiterMarker`),e.consume(t),e.exit(`tableDelimiterMarker`),y):(e.exit(`tableDelimiterFiller`),y(t))}function y(t){return q(t)?J(e,b,`whitespace`)(t):b(t)}function b(n){return n===124?m(n):n===null||G(n)?!o||i!==a?x(n):(e.exit(`tableDelimiterRow`),e.exit(`tableHead`),t(n)):x(n)}function x(e){return n(e)}function S(t){return e.enter(`tableRow`),C(t)}function C(n){return n===124?(e.enter(`tableCellDivider`),e.consume(n),e.exit(`tableCellDivider`),C):n===null||G(n)?(e.exit(`tableRow`),t(n)):q(n)?J(e,C,`whitespace`)(n):(e.enter(`data`),w(n))}function w(t){return t===null||t===124||K(t)?(e.exit(`data`),C(t)):(e.consume(t),t===92?T:w)}function T(t){return t===92||t===124?(e.consume(t),w):w(t)}}function ll(e,t){let n=-1,r=!0,i=0,a=[0,0,0,0],o=[0,0,0,0],s=!1,c=0,l,u,d,f=new il;for(;++n<e.length;){let p=e[n],m=p[1];p[0]===`enter`?m.type===`tableHead`?(s=!1,c!==0&&(dl(f,t,c,l,u),u=void 0,c=0),l={type:`table`,start:Object.assign({},m.start),end:Object.assign({},m.end)},f.add(n,0,[[`enter`,l,t]])):m.type===`tableRow`||m.type===`tableDelimiterRow`?(r=!0,d=void 0,a=[0,0,0,0],o=[0,n+1,0,0],s&&(s=!1,u={type:`tableBody`,start:Object.assign({},m.start),end:Object.assign({},m.end)},f.add(n,0,[[`enter`,u,t]])),i=m.type===`tableDelimiterRow`?2:u?3:1):i&&(m.type===`data`||m.type===`tableDelimiterMarker`||m.type===`tableDelimiterFiller`)?(r=!1,o[2]===0&&(a[1]!==0&&(o[0]=o[1],d=ul(f,t,a,i,void 0,d),a=[0,0,0,0]),o[2]=n)):m.type===`tableCellDivider`&&(r?r=!1:(a[1]!==0&&(o[0]=o[1],d=ul(f,t,a,i,void 0,d)),a=o,o=[a[1],n,0,0])):m.type===`tableHead`?(s=!0,c=n):m.type===`tableRow`||m.type===`tableDelimiterRow`?(c=n,a[1]===0?o[1]!==0&&(d=ul(f,t,o,i,n,d)):(o[0]=o[1],d=ul(f,t,a,i,n,d)),i=0):i&&(m.type===`data`||m.type===`tableDelimiterMarker`||m.type===`tableDelimiterFiller`)&&(o[3]=n)}for(c!==0&&dl(f,t,c,l,u),f.consume(t.events),n=-1;++n<t.events.length;){let e=t.events[n];e[0]===`enter`&&e[1].type===`table`&&(e[1]._align=ol(t.events,n))}return e}function ul(e,t,n,r,i,a){let o=r===1?`tableHeader`:r===2?`tableDelimiter`:`tableData`;n[0]!==0&&(a.end=Object.assign({},fl(t.events,n[0])),e.add(n[0],0,[[`exit`,a,t]]));let s=fl(t.events,n[1]);if(a={type:o,start:Object.assign({},s),end:Object.assign({},s)},e.add(n[1],0,[[`enter`,a,t]]),n[2]!==0){let i=fl(t.events,n[2]),a=fl(t.events,n[3]),o={type:`tableContent`,start:Object.assign({},i),end:Object.assign({},a)};if(e.add(n[2],0,[[`enter`,o,t]]),r!==2){let r=t.events[n[2]],i=t.events[n[3]];if(r[1].end=Object.assign({},i[1].end),r[1].type=`chunkText`,r[1].contentType=`text`,n[3]>n[2]+1){let t=n[2]+1,r=n[3]-n[2]-1;e.add(t,r,[])}}e.add(n[3]+1,0,[[`exit`,o,t]])}return i!==void 0&&(a.end=Object.assign({},fl(t.events,i)),e.add(i,0,[[`exit`,a,t]]),a=void 0),a}function dl(e,t,n,r,i){let a=[],o=fl(t.events,n);i&&(i.end=Object.assign({},o),a.push([`exit`,i,t])),r.end=Object.assign({},o),a.push([`exit`,r,t]),e.add(n+1,0,a)}function fl(e,t){let n=e[t],r=n[0]===`enter`?`start`:`end`;return n[1][r]}var pl={name:`tasklistCheck`,tokenize:hl};function ml(){return{text:{91:pl}}}function hl(e,t,n){let r=this;return i;function i(t){return r.previous!==null||!r._gfmTasklistFirstContentOfListItem?n(t):(e.enter(`taskListCheck`),e.enter(`taskListCheckMarker`),e.consume(t),e.exit(`taskListCheckMarker`),a)}function a(t){return K(t)?(e.enter(`taskListCheckValueUnchecked`),e.consume(t),e.exit(`taskListCheckValueUnchecked`),o):t===88||t===120?(e.enter(`taskListCheckValueChecked`),e.consume(t),e.exit(`taskListCheckValueChecked`),o):n(t)}function o(t){return t===93?(e.enter(`taskListCheckMarker`),e.consume(t),e.exit(`taskListCheckMarker`),e.exit(`taskListCheck`),s):n(t)}function s(r){return G(r)?t(r):q(r)?e.check({tokenize:gl},t,n)(r):n(r)}}function gl(e,t,n){return J(e,r,`whitespace`);function r(e){return e===null?n(e):t(e)}}function _l(e){return Dt([Nc(),Yc(),rl(e),sl(),ml()])}var vl={};function yl(e){let t=this,n=e||vl,r=t.data(),i=r.micromarkExtensions||=[],a=r.fromMarkdownExtensions||=[],o=r.toMarkdownExtensions||=[];i.push(_l(n)),a.push(wc()),o.push(Tc(n))}var bl=Object.assign({"../../CONTRIBUTING.md":l,"../../SECURITY.md":u,"../../SUPPORT.md":d,"../../docs/API.md":f,"../../docs/ARCHITECTURE.md":p,"../../docs/CLOUD_RELATIONSHIP.md":m,"../../docs/CONFIGURATION.md":h,"../../docs/CONSOLE.md":g,"../../docs/DATA_AND_STORAGE.md":_,"../../docs/DEVELOPMENT.md":v,"../../docs/MIGRATION.md":y,"../../docs/OPEN_SOURCE.md":b,"../../docs/OPERATIONS.md":x,"../../docs/PRODUCT.md":S,"../../docs/README.md":C,"../../docs/RELEASES.md":w,"../../docs/SUPPLY_CONNECTOR.md":T}),xl=[[`README`,`入门`,`Getting started`,`使用指南`,`User guide`],[`CONSOLE`,`入门`,`Getting started`,`控制台工作区`,`Console workspace`],[`PRODUCT`,`入门`,`Getting started`,`产品定位与边界`,`Product scope`],[`API`,`网关`,`Gateway`,`API 接入参考`,`API reference`],[`CONFIGURATION`,`网关`,`Gateway`,`配置与路由`,`Configuration & routing`],[`OPERATIONS`,`网关`,`Gateway`,`运行与故障排查`,`Operations & troubleshooting`],[`DATA_AND_STORAGE`,`网关`,`Gateway`,`数据、备份与恢复`,`Data, backup & recovery`],[`SUPPLY_CONNECTOR`,`云端供给`,`Cloud supply`,`供给创建与 Cloud 对接`,`Supply & Cloud connection`],[`CLOUD_RELATIONSHIP`,`云端供给`,`Cloud supply`,`OSS 与 Cloud 的职责`,`OSS & Cloud responsibilities`],[`ARCHITECTURE`,`开发与支持`,`Development & support`,`系统架构`,`Architecture`],[`DEVELOPMENT`,`开发与支持`,`Development & support`,`本地开发`,`Local development`],[`RELEASES`,`开发与支持`,`Development & support`,`构建与发布`,`Builds & releases`],[`MIGRATION`,`开发与支持`,`Development & support`,`迁移说明`,`Migration`],[`OPEN_SOURCE`,`开发与支持`,`Development & support`,`开源政策`,`Open-source policy`],[`SECURITY`,`开发与支持`,`Development & support`,`安全与漏洞报告`,`Security`],[`SUPPORT`,`开发与支持`,`Development & support`,`获取帮助`,`Support`],[`CONTRIBUTING`,`开发与支持`,`Development & support`,`参与贡献`,`Contributing`]].map(([e,t,n,r,i])=>{let a=[`SECURITY`,`SUPPORT`,`CONTRIBUTING`].includes(e)?`${e}.md`:`docs/${e}.md`;return{id:e,groupCN:t,groupEN:n,titleCN:r,titleEN:i,path:a,content:bl[`../../${a}`]||``}});function Sl(){let[e=`README`,t=``]=window.location.hash.slice(1).replace(/^help\/?/,``).split(`?`);return{id:e||`README`,section:new URLSearchParams(t).get(`section`)||``}}function Cl(e){return e.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu,``).replace(/\s/g,`-`)}function wl(){return e=>{let t=new Map,n=e=>`value`in e?e.value:`children`in e?e.children.map(e=>n(e)).join(``):``,r=e=>{if(e.type===`heading`){let r=Cl(n(e)),i=t.get(r)||0;t.set(r,i+1),e.data={...e.data,hProperties:{...e.data?.hProperties,id:`help-${r}${i?`-${i}`:``}`}}}`children`in e&&e.children.forEach(e=>r(e))};r(e)}}function Tl(){let t=o(),[n,r]=(0,fo.useState)(Sl),[i,a]=(0,fo.useState)(``);(0,fo.useEffect)(()=>{let e=()=>{r(Sl()),a(``)};return window.addEventListener(`hashchange`,e),()=>window.removeEventListener(`hashchange`,e)},[]);let s=xl.find(e=>e.id===n.id);(0,fo.useEffect)(()=>{if(!n.section){document.querySelector(`.help-reading-header`)?.scrollIntoView({block:`nearest`});return}let e=requestAnimationFrame(()=>document.getElementById(`help-${n.section}`)?.scrollIntoView({block:`start`}));return()=>cancelAnimationFrame(e)},[n.id,n.section]);let l=xl.filter(e=>`${e.titleCN} ${e.titleEN} ${e.content}`.toLowerCase().includes(i.trim().toLowerCase())),u=[...new Set(xl.map(e=>t(e.groupCN,e.groupEN)))],d=(e,t,n)=>t===1?(0,Z.jsx)(`h2`,{id:n,children:e}):t===2?(0,Z.jsx)(`h3`,{id:n,children:e}):(0,Z.jsx)(`h4`,{id:n,children:e});return(0,Z.jsxs)(`section`,{className:`help-layout`,children:[(0,Z.jsxs)(`aside`,{className:`help-directory`,children:[(0,Z.jsxs)(`label`,{className:`help-search`,children:[(0,Z.jsx)(c,{size:16}),(0,Z.jsx)(`input`,{value:i,onChange:e=>a(e.target.value),placeholder:t(`搜索文档内容…`,`Search documentation…`),"aria-label":t(`搜索文档`,`Search documentation`)})]}),(0,Z.jsxs)(`nav`,{"aria-label":t(`文档分类`,`Documentation categories`),children:[u.map(e=>(0,Z.jsxs)(`section`,{children:[(0,Z.jsx)(`p`,{className:`help-group-title`,children:e}),l.filter(n=>t(n.groupCN,n.groupEN)===e).map(e=>(0,Z.jsx)(`a`,{href:`#help/${e.id}`,"aria-current":s?.id===e.id?`page`:void 0,children:t(e.titleCN,e.titleEN)},e.id))]},e)),l.length===0&&(0,Z.jsx)(`p`,{role:`status`,children:t(`没有匹配的文档，请换个关键词。`,`No documents match. Try another keyword.`)})]})]}),(0,Z.jsxs)(`div`,{className:`help-reading`,children:[(0,Z.jsxs)(`header`,{className:`help-reading-header`,children:[(0,Z.jsx)(e,{size:20}),(0,Z.jsxs)(`div`,{children:[(0,Z.jsx)(`strong`,{children:s?t(s.titleCN,s.titleEN):t(`文档未找到`,`Document not found`)}),(0,Z.jsx)(`p`,{children:t(`随 OSS 打包，可离线阅读；正文保留原文档语言。`,`Bundled with OSS for offline reading; guides retain their original language.`)})]})]}),s?.content?(0,Z.jsx)(`article`,{className:`help-article`,children:(0,Z.jsx)(_o,{remarkPlugins:[yl,wl],skipHtml:!0,components:{h1:({children:e,id:t})=>d(e,1,t),h2:({children:e,id:t})=>d(e,2,t),h3:({children:e,id:t})=>d(e,3,t),h4:({children:e,id:t})=>d(e,4,t),table:({children:e})=>(0,Z.jsx)(`div`,{className:`help-table-wrap`,children:(0,Z.jsx)(`table`,{children:e})}),a:({href:e,children:n})=>{if(!e)return(0,Z.jsx)(`span`,{children:n});if(/^(https?:|mailto:)/i.test(e))return(0,Z.jsx)(`a`,{href:e,target:`_blank`,rel:`noreferrer`,children:n});let r=new URL(e,`https://local-docs.invalid/${s.path}`),i=xl.find(e=>`/${e.path}`===r.pathname);return i?(0,Z.jsx)(`a`,{href:`#help/${i.id}${r.hash?`?section=${encodeURIComponent(decodeURIComponent(r.hash.slice(1)))}`:``}`,children:n}):(0,Z.jsx)(`span`,{title:t(`请在项目源码中查看此文件`,`See this file in the project source`),children:n})}},children:s.content})},s.id):(0,Z.jsxs)(`div`,{className:`workspace-empty`,children:[(0,Z.jsx)(`p`,{children:t(`这份文档未包含在当前版本中。`,`This document is not bundled in the current version.`)}),(0,Z.jsx)(`a`,{className:`panel-action`,href:`#help/README`,children:t(`返回使用指南`,`Open the user guide`)})]})]})]})}export{Tl as default};