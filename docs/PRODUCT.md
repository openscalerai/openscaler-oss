# OpenScaler product design

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
