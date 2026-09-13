import { useEffect, useRef, useState, type FormEvent } from "react";
import { useI18n } from "./i18n";
import { uiText } from "./ui-i18n";

type Offer = { id: string; model: string; providers: string[]; state: string; concurrency: number; request_budget: number; starts_at: string; ends_at: string };
type Receipt = { id: string; state: string; status: number };
type Snapshot = { enabled: boolean; disconnected: boolean; offers: Offer[] };
type Model = { id: string; provider: string; capabilities: string[]; available: boolean };
type Request = <T>(path: string, options?: RequestInit) => Promise<T>;

export function SupplyPanel({ request, models, mode = "offers", initialModel = "", startCreating = false, onDraftOpened }: { request: Request; models: Model[]; mode?: "offers" | "receipts"; initialModel?: string; startCreating?: boolean; onDraftOpened?: () => void }) {
  const { locale } = useI18n();
  const label = (cn: string, en: string) => uiText(locale, cn, en);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [credential, setCredential] = useState("");
  const [model, setModel] = useState(initialModel);
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(startCreating);
  const [step, setStep] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const [review, setReview] = useState<Record<string, string>>({});
  useEffect(() => { if (startCreating) { setCreating(true); setModel(initialModel); setSelected([]); setStep(0); onDraftOpened?.(); } }, [startCreating, initialModel]);
  const advance = () => {
    const form = formRef.current;
    if (!form) return;
    const inputs = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[data-step="${step}"] input, [data-step="${step}"] select, [data-step="${step}"] textarea`);
    for (const input of inputs) { if (!input.reportValidity()) return; }
    const values = new FormData(form);
    if (step === 0 && (!selected.length || !values.getAll("capabilities").length)) { setError(label("请选择专用端点及调用类型。", "Select dedicated endpoints and capabilities.")); return; }
    if (step === 2) {
      const start = new Date(String(values.get("starts_at"))).getTime();
      const end = new Date(String(values.get("ends_at"))).getTime();
      if (end <= Math.max(start, Date.now()) || end - start > 31 * 86400000) { setError(label("结束时间必须晚于开始时间和当前时间，且窗口最长31天。", "The end must follow the start and current time, with a window of at most 31 days.")); return; }
      setReview({ ...Object.fromEntries([...values.entries()].map(([key, value]) => [key, String(value)])), capabilities: values.getAll("capabilities").join(", ") });
    }
    setError(""); setStep(value => Math.min(value + 1, 3));
  };
  const [consent, setConsent] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<{ offer: string; items: Receipt[] } | null>(null);
  const [manifest, setManifest] = useState("");
  const refresh = async () => setSnapshot(await request<Snapshot>("/api/admin/supply"));
  useEffect(() => { let active = true; request<Snapshot>("/api/admin/supply").then(value => { if (active) setSnapshot(value); }).catch(e => { if (active) setError(String(e)); }); return () => { active = false; }; }, [request]);
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(""); try { await action(); await refresh(); } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); } };
  const change = (id: string, action: string, body = {}) => run(async () => { const result = await request<{ credential?: string }>(`/api/admin/supply/${encodeURIComponent(id)}/${action}`, { method: "POST", body: JSON.stringify(body) }); if (result.credential) setCredential(result.credential); setConsent(null); });
  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (step < 3) { advance(); return; } const data = new FormData(event.currentTarget);
    void run(async () => {
      const result = await request<{ credential: string }>("/api/admin/supply", { method: "POST", body: JSON.stringify({
        model, providers: selected, capabilities: data.getAll("capabilities"),
        operator: data.get("operator"), authorization_evidence: data.get("evidence"), region: data.get("region"), public_url: data.get("public_url"),
        starts_at: new Date(String(data.get("starts_at"))).toISOString(), ends_at: new Date(String(data.get("ends_at"))).toISOString(),
        concurrency: Number(data.get("concurrency")), rpm: Number(data.get("rpm")), request_budget: Number(data.get("budget")),
        input_per_million: Number(data.get("input_price")), output_per_million: Number(data.get("output_price"))
      }) }); setCredential(result.credential); setCreating(false); setStep(0);
    });
  };
  const eligible = models.filter(m => m.id === model && m.available);
  const capabilities = ["chat", "responses", "embeddings", "image", "rerank", "video", "speech", "transcription"];
  return <section className="supply-panel">
    <div className="supply-intro"><h2>{mode === "receipts" ? label("按供给核对请求", "Reconcile requests by offer") : label("本地供给管理", "Local supply management")}</h2><p>{label("只发布明确授权的模型服务。发布后，选定端点将专用于市场流量，不再参与私有路由。请为私有请求保留其他端点。", "Publish only authorized model services. Published endpoints are reserved for market traffic and removed from private routing. Keep separate endpoints for private requests.")}</p><p>{label("发布是启用本地供给入口，不代表已通过 Cloud 准入或获得订单。报价为 USD / 百万 Token；实际交易结算由 Cloud 管理。", "Publication enables the local supply endpoint; it does not approve Cloud onboarding or promise orders. Prices are USD per million tokens; Cloud owns trading and settlement.")}</p></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {!snapshot ? <p>{label("加载中…", "Loading…")}</p> : <>
      <div className="supply-toolbar">{mode === "offers" && snapshot.enabled && !creating && <button className="admin-action" disabled={busy} onClick={() => { setCreating(true); setStep(0); }}>{label("创建供给", "Create supply")}</button>}<strong className={`pill${!snapshot.enabled || snapshot.disconnected ? " neutral" : ""}`}>{!snapshot.enabled ? label("未启用", "Disabled") : snapshot.disconnected ? label("已断开，新请求已停止", "Disconnected — new requests blocked") : label("本地供给入口已启用", "Local supply admission enabled")}</strong><button className="panel-action" disabled={busy} onClick={() => void run(refresh)}>{label("刷新", "Refresh")}</button>{mode === "offers" && snapshot.enabled && <button className="panel-action" disabled={busy} onClick={() => void run(async () => { await request(`/api/admin/supply-control/${snapshot.disconnected ? "connect" : "disconnect"}`, { method: "POST" }); })}>{snapshot.disconnected ? label("恢复接单", "Resume admission") : label("断开全部供给", "Disconnect all supply")}</button>}</div>
      {!snapshot.enabled && <p className="supply-notice">{label("在 OSS 环境中设置 OPENSCALER_SUPPLY_ENABLED=true 后重启，方可创建和发布供给。", "Set OPENSCALER_SUPPLY_ENABLED=true in the OSS environment and restart to create and publish supply.")}</p>}
      {credential && <div className="supply-secret" role="status"><strong>{label("专用凭据仅显示一次，请安全保存；不会写入浏览器存储。", "Save this dedicated credential securely. It is shown once and is not saved in browser storage.")}</strong><code>{credential}</code><button className="panel-action" onClick={() => setCredential("")}>{label("已保存，隐藏", "Saved — hide")}</button></div>}
      {mode === "offers" && creating && snapshot.enabled && <form ref={formRef} noValidate onSubmit={create}><fieldset disabled={busy}><div className="workspace-toolbar"><h2>{label("创建供给草稿", "Create supply draft")}</h2><button type="button" className="panel-action" onClick={() => setCreating(false)}>{label("取消", "Cancel")}</button></div>
      <ol className="supply-steps">{[label("模型与端点", "Model & endpoints"), label("来源与授权", "Source & authorization"), label("容量与报价", "Capacity & pricing"), label("确认草稿", "Review draft")].map((title, i) => <li key={title} aria-current={step === i ? "step" : undefined}><span>{i + 1}</span>{title}</li>)}</ol>
      <div data-step="0" hidden={step !== 0}>
        <label>{label("精确模型", "Exact model")}<select required value={model} onChange={e => { setModel(e.target.value); setSelected([]); }}><option value="">{label("选择模型", "Select model")}</option>{[...new Set(models.filter(m => m.available).map(m => m.id))].map(id => <option key={id}>{id}</option>)}</select></label>
        {!models.some(m => m.available) && <p className="supply-notice">{label("还没有可用模型，请先在服务接入中配置推理服务。", "No available models. Configure an inference service under Service connections first.")}</p>}
        <fieldset><legend>{label("专用端点", "Dedicated endpoints")}</legend>{eligible.map(m => <label className="supply-check" key={m.provider}><input type="checkbox" checked={selected.includes(m.provider)} onChange={e => setSelected(e.target.checked ? [...selected, m.provider] : selected.filter(id => id !== m.provider))} />{m.provider}</label>)}</fieldset>
        <fieldset key={`${model}-${selected.join(",")}`}><legend>{label("允许的调用类型", "Allowed API capabilities")}</legend>{capabilities.map(cap => <label className="supply-check" key={cap}><input name="capabilities" type="checkbox" value={cap} disabled={!selected.length || !selected.every(id => eligible.some(m => m.provider === id && m.capabilities.includes(cap)))} />{cap}</label>)}</fieldset>
      </div>
      <div data-step="1" hidden={step !== 1}><div className="supply-grid">
        <label>{label("实际运营方", "Service operator")}<input name="operator" required maxLength={256} /></label>
        <label>{label("公开 HTTPS 地址", "Public HTTPS origin")}<input name="public_url" type="url" pattern="https://.*" placeholder="https://inference.example.com" required /></label>
        <label>{label("服务地域（声明）", "Service region (declared)")}<input name="region" required maxLength={128} /></label>
      </div><label>{label("供给授权依据（不要填写上游密钥）", "Authorization evidence (never include upstream keys)")}<textarea name="evidence" required maxLength={4096} /></label></div>
      <div data-step="2" hidden={step !== 2}><p>{label("报价单位：USD / 百万 Token。", "Prices are USD per million tokens.")}</p><div className="supply-grid">
        <label>{label("开始时间", "Starts at")}<input name="starts_at" type="datetime-local" required /></label><label>{label("结束时间（最长31天）", "Ends at (up to 31 days)")}<input name="ends_at" type="datetime-local" required /></label>
        <label>{label("并发上限", "Concurrency limit")}<input name="concurrency" type="number" defaultValue={1} min={1} max={1024} required /></label><label>{label("每分钟请求", "Requests per minute")}<input name="rpm" type="number" defaultValue={30} min={1} max={100000} required /></label>
        <label>{label("总请求预算", "Total request budget")}<input name="budget" type="number" defaultValue={1000} min={1} max={10000000} required /></label>
        <label>{label("输入单价", "Input price")}<input name="input_price" type="number" defaultValue={0} min={0} step="any" required /></label><label>{label("输出单价", "Output price")}<input name="output_price" type="number" defaultValue={0} min={0} step="any" required /></label>
      </div></div>
      <div data-step="3" hidden={step !== 3}><h3>{label("核对供给配置", "Review supply configuration")}</h3><dl className="supply-review">
        <dt>{label("模型 / 端点", "Model / endpoints")}</dt><dd>{model} · {selected.join(", ")}</dd>
        <dt>{label("调用类型", "Capabilities")}</dt><dd>{review.capabilities}</dd>
        <dt>{label("授权依据", "Authorization evidence")}</dt><dd>{review.evidence}</dd>
        <dt>{label("运营方 / 地域", "Operator / region")}</dt><dd>{review.operator} · {review.region}</dd>
        <dt>{label("公开地址", "Public origin")}</dt><dd>{review.public_url}</dd>
        <dt>{label("服务窗口", "Availability window")}</dt><dd>{review.starts_at} — {review.ends_at}</dd>
        <dt>{label("容量", "Capacity")}</dt><dd>{review.concurrency} {label("并发", "concurrent")} · {review.rpm} RPM · {review.budget} {label("次请求", "requests")}</dd>
        <dt>{label("输入 / 输出报价", "Input / output price")}</dt><dd>{review.input_price} / {review.output_price} USD / {label("百万 Token", "million tokens")}</dd>
      </dl><p className="supply-notice">{label("创建后仅保存草稿和生成专用凭据。启用本地入口需另行明确授权；不会自动提交 Cloud 申请或上架。", "Creation saves a draft and generates a dedicated credential. Enabling local admission requires separate authorization; no Cloud application or listing is created automatically.")}</p></div>
      <div className="workspace-actions supply-step-actions">{step > 0 && <button className="panel-action" type="button" onClick={() => setStep(step - 1)}>{label("上一步", "Back")}</button>}{step < 3 ? <button key="next-step" className="admin-action" type="button" onClick={event => { event.preventDefault(); advance(); }}>{label("下一步", "Next")}</button> : <button key="submit-draft" className="admin-action" type="submit">{label("创建草稿与专用凭据", "Create draft and credential")}</button>}</div>
      </fieldset></form>}
      <div className="supply-offers">{snapshot.offers.length === 0 && <p className="supply-empty">{label("暂无供给，不会自动发布现有模型。", "No publications. Existing models are never published automatically.")}</p>}{snapshot.offers.map(offer => <article key={offer.id}><h3>{offer.model} <small>{({ draft: label("草稿", "Draft"), active: label("本地已启用", "Locally active"), draining: label("排空中", "Draining"), withdrawn: label("已撤销", "Withdrawn") } as Record<string, string>)[offer.state] || offer.state}</small></h3><p>{label("Cloud：状态未同步", "Cloud: status not synchronized")}</p><p>{offer.providers.join(", ")} · {label("并发", "Concurrency")} {offer.concurrency} · {label("请求预算", "Request budget")} {offer.request_budget}</p><p>{new Date(offer.starts_at).toLocaleString()} — {new Date(offer.ends_at).toLocaleString()}</p><div className="supply-toolbar">
        {mode === "offers" && offer.state === "draft" && <button className="panel-action" disabled={busy || snapshot.disconnected} onClick={() => setConsent(offer.id)}>{label("授权启用入口", "Authorize local admission")}</button>}
        {mode === "offers" && ["draft", "active"].includes(offer.state) && <button className="panel-action" disabled={busy} onClick={() => void change(offer.id, "withdraw")}>{label("撤销", "Withdraw")}</button>}
        {mode === "offers" && ["draft", "active"].includes(offer.state) && <button className="panel-action" disabled={busy} onClick={() => { if (window.confirm(label("轮换后旧凭据立即失效，是否继续？", "Rotation immediately invalidates the old credential. Continue?"))) void change(offer.id, "rotate-key"); }}>{label("轮换凭据", "Rotate credential")}</button>}
        <button className="panel-action" disabled={busy} onClick={() => void run(async () => { setReceipts({ offer: offer.id, items: await request<Receipt[]>(`/api/admin/supply/${offer.id}/receipts`) }); })}>{label("请求记录", "Request receipts")}</button>
        <button className="panel-action" disabled={busy} onClick={() => void run(async () => { setManifest(JSON.stringify(await request(`/api/admin/supply/${offer.id}/manifest`), null, 2)); })}>{label("查看发布清单", "View manifest")}</button>
      </div>{consent === offer.id && <div className="supply-consent"><p>{label("确认有权提供此服务，并同意将选定端点专用于市场流量。配置变化后需要重新创建授权；Cloud 仍需独立审核。", "Confirm your right to provide this service and reserve the selected endpoints for market traffic. Configuration changes require a new publication; Cloud approval remains separate.")}</p><button className="panel-action" disabled={busy} onClick={() => void change(offer.id, "publish", { authorize_publication: true, reserve_selected_endpoints: true })}>{label("确认授权并启用", "Confirm and enable")}</button><button className="panel-action" onClick={() => setConsent(null)}>{label("取消", "Cancel")}</button></div>}</article>)}</div>
      {receipts && <section><h3>{label("最近200条请求记录", "Latest 200 receipts")}</h3>{receipts.items.length === 0 && <p>{label("这项供给暂无请求记录。", "No request receipts for this offer.")}</p>}{receipts.items.map(item => <div key={item.id} className="supply-receipt"><code>{item.id}</code><span>{item.state} · HTTP {item.status || "—"}</span>{item.state === "unknown" && <button className="panel-action" disabled={busy} onClick={() => { if (window.confirm(label("已向上游核对执行与费用，并确认可以释放未知请求占用？此操作不会创建付款或退款。", "Have you reconciled execution and charges with the upstream and confirmed capacity can be released? This does not issue payments or refunds."))) void change(receipts.offer, "reconcile", { request_id: item.id, confirm_upstream_accounting: true }).then(() => setReceipts(null)); }}>{label("确认已核对", "Confirm reconciled")}</button>}</div>)}</section>}
      {manifest && <section><h3>{label("选择性发布清单", "Selective publication manifest")}</h3><pre>{manifest}</pre><p>{label("不包含上游端点和密钥。在文档与帮助中查看提交 Cloud 草稿的命令；不会自动触发付费测试。", "No upstream endpoints or keys are included. See Documentation & help for the Cloud draft command; no paid tests run automatically.")}</p><a className="panel-action" href="#help/SUPPLY_CONNECTOR">{label("查看供给对接文档", "Read supply connection guide")}</a></section>}
    </>}
  </section>;
}
