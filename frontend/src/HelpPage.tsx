import { useEffect, useState, type ReactNode } from "react";
import type { Root, RootContent } from "mdast";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, Search } from "lucide-react";
import { useWorkspaceLabels } from "./Workspace";

const files = import.meta.glob<string>(["../../docs/*.md", "../../SECURITY.md", "../../SUPPORT.md", "../../CONTRIBUTING.md"], { query: "?raw", import: "default", eager: true });
const catalog = [
  ["README", "入门", "Getting started", "使用指南", "User guide"],
  ["CONSOLE", "入门", "Getting started", "控制台工作区", "Console workspace"],
  ["PRODUCT", "入门", "Getting started", "产品定位与边界", "Product scope"],
  ["API", "网关", "Gateway", "API 接入参考", "API reference"],
  ["CONFIGURATION", "网关", "Gateway", "配置与路由", "Configuration & routing"],
  ["OPERATIONS", "网关", "Gateway", "运行与故障排查", "Operations & troubleshooting"],
  ["DATA_AND_STORAGE", "网关", "Gateway", "数据、备份与恢复", "Data, backup & recovery"],
  ["SUPPLY_CONNECTOR", "云端供给", "Cloud supply", "供给创建与 Cloud 对接", "Supply & Cloud connection"],
  ["CLOUD_RELATIONSHIP", "云端供给", "Cloud supply", "OSS 与 Cloud 的职责", "OSS & Cloud responsibilities"],
  ["ARCHITECTURE", "开发与支持", "Development & support", "系统架构", "Architecture"],
  ["DEVELOPMENT", "开发与支持", "Development & support", "本地开发", "Local development"],
  ["RELEASES", "开发与支持", "Development & support", "构建与发布", "Builds & releases"],
  ["MIGRATION", "开发与支持", "Development & support", "迁移说明", "Migration"],
  ["OPEN_SOURCE", "开发与支持", "Development & support", "开源政策", "Open-source policy"],
  ["SECURITY", "开发与支持", "Development & support", "安全与漏洞报告", "Security"],
  ["SUPPORT", "开发与支持", "Development & support", "获取帮助", "Support"],
  ["CONTRIBUTING", "开发与支持", "Development & support", "参与贡献", "Contributing"]
].map(([id, groupCN, groupEN, titleCN, titleEN]) => {
  const path = ["SECURITY", "SUPPORT", "CONTRIBUTING"].includes(id) ? `${id}.md` : `docs/${id}.md`;
  return { id, groupCN, groupEN, titleCN, titleEN, path, content: files[`../../${path}`] || "" };
});
function readLocation() {
  const [id = "README", query = ""] = window.location.hash.slice(1).replace(/^help\/?/, "").split("?");
  return { id: id || "README", section: new URLSearchParams(query).get("section") || "" };
}
function slug(text: string) { return text.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-"); }
function headingAnchors() {
  return (tree: Root) => {
    const counts = new Map<string, number>();
    const content = (node: RootContent): string => "value" in node ? node.value : "children" in node ? node.children.map(child => content(child as RootContent)).join("") : "";
    const visit = (node: Root | RootContent) => {
      if (node.type === "heading") {
        const base = slug(content(node)); const count = counts.get(base) || 0; counts.set(base, count + 1);
        node.data = { ...node.data, hProperties: { ...node.data?.hProperties, id: `help-${base}${count ? `-${count}` : ""}` } };
      }
      if ("children" in node) node.children.forEach(child => visit(child as RootContent));
    };
    visit(tree);
  };
}
export default function HelpPage() {
  const text = useWorkspaceLabels();
  const [location, setLocation] = useState(readLocation);
  const [query, setQuery] = useState("");
  useEffect(() => { const update = () => { setLocation(readLocation()); setQuery(""); }; window.addEventListener("hashchange", update); return () => window.removeEventListener("hashchange", update); }, []);
  const doc = catalog.find(item => item.id === location.id);
  useEffect(() => {
    if (!location.section) { document.querySelector(".help-reading-header")?.scrollIntoView({ block: "nearest" }); return; }
    const frame = requestAnimationFrame(() => document.getElementById(`help-${location.section}`)?.scrollIntoView({ block: "start" }));
    return () => cancelAnimationFrame(frame);
  }, [location.id, location.section]);
  const filtered = catalog.filter(item => `${item.titleCN} ${item.titleEN} ${item.content}`.toLowerCase().includes(query.trim().toLowerCase()));
  const groups = [...new Set(catalog.map(item => text(item.groupCN, item.groupEN)))];
  const heading = (children: ReactNode, level: number, id?: string) => level === 1 ? <h2 id={id}>{children}</h2> : level === 2 ? <h3 id={id}>{children}</h3> : <h4 id={id}>{children}</h4>;
  return <section className="help-layout">
    <aside className="help-directory"><label className="help-search"><Search size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={text("搜索文档内容…", "Search documentation…")} aria-label={text("搜索文档", "Search documentation")} /></label><nav aria-label={text("文档分类", "Documentation categories")}>{groups.map(group => <section key={group}><p className="help-group-title">{group}</p>{filtered.filter(item => text(item.groupCN, item.groupEN) === group).map(item => <a key={item.id} href={`#help/${item.id}`} aria-current={doc?.id === item.id ? "page" : undefined}>{text(item.titleCN, item.titleEN)}</a>)}</section>)}{filtered.length === 0 && <p role="status">{text("没有匹配的文档，请换个关键词。", "No documents match. Try another keyword.")}</p>}</nav></aside>
    <div className="help-reading"><header className="help-reading-header"><BookOpen size={20} /><div><strong>{doc ? text(doc.titleCN, doc.titleEN) : text("文档未找到", "Document not found")}</strong><p>{text("随 OSS 打包，可离线阅读；正文保留原文档语言。", "Bundled with OSS for offline reading; guides retain their original language.")}</p></div></header>
      {doc?.content ? <article className="help-article" key={doc.id}><Markdown remarkPlugins={[remarkGfm, headingAnchors]} skipHtml components={{
        h1: ({children, id}) => heading(children, 1, id), h2: ({children, id}) => heading(children, 2, id), h3: ({children, id}) => heading(children, 3, id), h4: ({children, id}) => heading(children, 4, id),
        table: ({children}) => <div className="help-table-wrap"><table>{children}</table></div>,
        a: ({href, children}) => {
          if (!href) return <span>{children}</span>;
          if (/^(https?:|mailto:)/i.test(href)) return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
          const url = new URL(href, `https://local-docs.invalid/${doc.path}`);
          const target = catalog.find(item => `/${item.path}` === url.pathname);
          if (!target) return <span title={text("请在项目源码中查看此文件", "See this file in the project source")}>{children}</span>;
          return <a href={`#help/${target.id}${url.hash ? `?section=${encodeURIComponent(decodeURIComponent(url.hash.slice(1)))}` : ""}`}>{children}</a>;
        }
      }}>{doc.content}</Markdown></article> : <div className="workspace-empty"><p>{text("这份文档未包含在当前版本中。", "This document is not bundled in the current version.")}</p><a className="panel-action" href="#help/README">{text("返回使用指南", "Open the user guide")}</a></div>}
    </div>
  </section>;
}
