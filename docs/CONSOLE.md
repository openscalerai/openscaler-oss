# OSS console workspace

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

Help routes support direct links such as `#help/API` and `#help/README?section=install-and-start`. The reader renders Markdown without raw HTML and bundles only public operator guides, security, support and contribution documents. The original document language is retained.
