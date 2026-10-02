import { ArrowDownToLine, Bookmark, Check, Copy, Pencil, RotateCw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Obj = Record<string, unknown>;
type CalendarPost = { day: number; platform: string; contentType: string; topic: string; hook: string; caption: string; cta: string; hashtags: string[] };
type LinkedInPost = { day: number; format: string; hook: string; body: string; cta: string; hashtags: string[] };
type EmailVariant = { angle: string; subjectLines: string[]; emailBody: string; followUps: { day: number; subject: string; body: string }[] };

function plainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(item => `• ${plainText(item)}`).join("\n");
  if (!value || typeof value !== "object") return String(value ?? "");
  return Object.entries(value as Obj).map(([key, item]) => `${key}\n${plainText(item)}`).join("\n\n");
}
function markdown(value: unknown, heading = "Workflow result"): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return `# ${heading}\n\n${plainText(value)}`;
  return `# ${heading}\n\n${Object.entries(value as Obj).map(([key, item]) => `## ${key.replace(/([A-Z])/g, " $1")}\n\n${Array.isArray(item) ? item.map((row, index) => `### ${index + 1}\n${plainText(row)}`).join("\n\n") : typeof item === "object" ? plainText(item) : String(item)}`).join("\n\n")}`;
}
function csv(value: unknown, slug: string): string {
  const rows: Record<string, unknown>[] = [];
  if (slug === "30-day-social-media-engine" && value && typeof value === "object" && Array.isArray((value as Obj).contentCalendar)) rows.push(...((value as Obj).contentCalendar as Record<string, unknown>[]));
  else if (slug === "linkedin-content-engine" && value && typeof value === "object" && Array.isArray((value as Obj).posts)) rows.push(...((value as Obj).posts as Record<string, unknown>[]));
  else if (slug === "cold-email-generator" && value && typeof value === "object" && Array.isArray((value as Obj).variants)) rows.push(...((value as Obj).variants as Record<string, unknown>[]));
  else rows.push({ result: plainText(value) });
  if (!rows.length) return "";
  const keys = [...new Set(rows.flatMap(row => Object.keys(row)))];
  const cell = (item: unknown) => `"${(Array.isArray(item) ? item.join(" ") : typeof item === "object" && item !== null ? JSON.stringify(item) : String(item ?? "")).replaceAll('"', '""')}"`;
  return [keys.map(cell).join(","), ...rows.map(row => keys.map(key => cell(row[key])).join(","))].join("\r\n");
}
function exportFile(result: Obj, slug: string, format: "txt" | "md" | "csv" | "json") {
  const contents = format === "json" ? JSON.stringify(result, null, 2) : format === "md" ? markdown(result) : format === "csv" ? csv(result, slug) : plainText(result);
  const mime = format === "json" ? "application/json" : format === "csv" ? "text/csv" : "text/plain";
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug}-flowkit.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function WorkflowResult({ slug, title, result, onChange, onSave, onRegenerate, saving = false, saved = false, saveError, savedLabel = "Save result", isPro = false }: {
  slug: string; title: string; result: Obj; onChange: (next: Obj) => void; onSave: () => void; onRegenerate: () => void;
  saving?: boolean; saved?: boolean; saveError?: string; savedLabel?: string; isPro?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [activeVariant, setActiveVariant] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);
  const serialized = useMemo(() => JSON.stringify(result, null, 2), [result]);
  const copy = async (text = plainText(result)) => {
    try { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard"); }
    catch { toast.error("Clipboard access is unavailable in this browser."); }
  };
  const patchRow = (key: "contentCalendar" | "posts", index: number, field: string, value: unknown) => {
    const rows = [...((result[key] as Obj[]) ?? [])];
    rows[index] = { ...rows[index], [field]: value };
    onChange({ ...result, [key]: rows });
  };

  return (
    <section className="fk-result-panel" aria-label={`${title} result`}>
      <div className="fk-result-head"><div><span className="fk-result-kicker"><span className="fk-live-dot" /> GENERATED OUTPUT</span><h2>{title}</h2><p>Structured and ready for a human review.</p></div>
        <div className="fk-result-actions">
          <button className="fk-button fk-button-quiet" onClick={() => void copy()}><Copy size={15} /><span className="fk-action-label">Copy</span></button>
          <button className={`fk-button fk-button-quiet ${editing ? "is-selected" : ""}`} onClick={() => setEditing(value => !value)}><Pencil size={15} /><span className="fk-action-label">{editing ? "Done editing" : "Edit"}</span></button>
          <button className="fk-button fk-button-quiet" onClick={onRegenerate}><RotateCw size={15} /><span className="fk-action-label">Regenerate</span></button>
          <button className="fk-button fk-button-outline" onClick={onSave} disabled={saving || saved}>{saved ? <Check size={15} /> : <Bookmark size={15} />}{saving ? "Saving…" : saved ? "Saved" : savedLabel}</button>
          <div className="fk-export-wrap"><button className="fk-button fk-button-primary" onClick={() => setExportOpen(value => !value)}><ArrowDownToLine size={15} /> Export</button>{exportOpen && <div className="fk-export-menu" role="menu">{(["txt", "md", "csv", "json"] as const).map(format => { const advanced = format === "csv" || format === "json"; return <button key={format} role="menuitem" onClick={() => { if (advanced && !isPro) { toast.info("CSV and JSON exports are Pro features. Billing is not connected yet; no payment has been taken."); return; } exportFile(result, slug, format); setExportOpen(false); }}>{format === "md" ? "Markdown" : format.toUpperCase()}{advanced && !isPro ? " · Pro" : ""}</button>; })}</div>}</div>
        </div>
      </div>
      {saveError && <div className="fk-error-banner">{saveError}</div>}
      {slug === "30-day-social-media-engine" && <SocialResult result={result} editing={editing} view={view} setView={setView} patchRow={patchRow} copy={copy} />}
      {slug === "cold-email-generator" && <EmailResult result={result} editing={editing} activeVariant={activeVariant} setActiveVariant={setActiveVariant} onChange={onChange} />}
      {slug === "linkedin-content-engine" && <LinkedInResult result={result} editing={editing} patchRow={patchRow} />}
      {!(["30-day-social-media-engine", "cold-email-generator", "linkedin-content-engine"].includes(slug)) && (editing ? <textarea className="fk-json-editor" aria-label="Edit structured result JSON" value={serialized} onChange={event => { try { const next = JSON.parse(event.target.value); if (next && typeof next === "object" && !Array.isArray(next)) onChange(next); } catch { /* allow the user to finish editing before parsing */ } }} /> : <pre className="fk-generic-result">{JSON.stringify(result, null, 2)}</pre>)}
    </section>
  );
}

function SocialResult({ result, editing, view, setView, patchRow, copy }: { result: Obj; editing: boolean; view: "cards" | "table"; setView: (value: "cards" | "table") => void; patchRow: (key: "contentCalendar" | "posts", index: number, field: string, value: unknown) => void; copy: (text?: string) => Promise<void> }) {
  const strategy = result.strategy as Record<string, unknown>;
  const calendar = (result.contentCalendar as CalendarPost[]) ?? [];
  return <div className="fk-calendar-result">
    {strategy && <div className="fk-strategy-grid"><div className="fk-strategy-summary"><span className="fk-label-mono">THE STRATEGY</span><p>{String(strategy.positioning)}</p></div><div><span className="fk-label-mono">AUDIENCE INSIGHT</span><p>{String(strategy.audienceInsight)}</p></div><div><span className="fk-label-mono">PILLARS</span><div className="fk-pillar-list">{(strategy.contentPillars as string[] | undefined)?.map(pillar => <span key={pillar}>{pillar}</span>)}</div></div><div><span className="fk-label-mono">CADENCE</span><p>{String(strategy.cadence)}</p></div></div>}
    <div className="fk-calendar-toolbar"><div><span className="fk-label-mono">THE NEXT 30 DAYS</span><h3>Content calendar <span className="fk-count-chip">{calendar.length} posts</span></h3></div><div className="fk-view-toggle"><button className={view === "cards" ? "is-active" : ""} onClick={() => setView("cards")}>Cards</button><button className={view === "table" ? "is-active" : ""} onClick={() => setView("table")}>Table</button></div></div>
    {view === "table" ? <div className="fk-table-scroll"><table className="fk-calendar-table"><thead><tr><th>Day</th><th>Platform</th><th>Type</th><th>Topic & hook</th><th>Caption</th><th>CTA</th><th>Hashtags</th></tr></thead><tbody>{calendar.map((post, index) => <tr key={post.day}><td>Day {post.day}</td><td>{post.platform}</td><td>{post.contentType}</td><td><strong>{post.topic}</strong><br />{post.hook}</td><td>{editing ? <textarea value={post.caption} onChange={event => patchRow("contentCalendar", index, "caption", event.target.value)} /> : post.caption}</td><td>{editing ? <input value={post.cta} onChange={event => patchRow("contentCalendar", index, "cta", event.target.value)} /> : post.cta}</td><td>{post.hashtags.join(" ")}</td></tr>)}</tbody></table></div> : <div className="fk-calendar-grid">{calendar.map((post, index) => <article className="fk-day-card" key={post.day}><div className="fk-day-top"><span className="fk-day-number">DAY {String(post.day).padStart(2, "0")}</span><span className="fk-platform-chip">{post.platform}</span></div><div className="fk-day-type">{post.contentType}</div>{editing ? <><label className="fk-edit-label">Topic<input value={post.topic} onChange={event => patchRow("contentCalendar", index, "topic", event.target.value)} /></label><label className="fk-edit-label">Hook<input value={post.hook} onChange={event => patchRow("contentCalendar", index, "hook", event.target.value)} /></label><label className="fk-edit-label">Caption<textarea value={post.caption} onChange={event => patchRow("contentCalendar", index, "caption", event.target.value)} /></label><label className="fk-edit-label">CTA<input value={post.cta} onChange={event => patchRow("contentCalendar", index, "cta", event.target.value)} /></label></> : <><h4>{post.topic}</h4><p className="fk-post-hook">{post.hook}</p><p className="fk-post-caption">{post.caption}</p><div className="fk-day-cta">↳ {post.cta}</div><div className="fk-hashtags">{post.hashtags.map(tag => `#${tag.replace(/^#/, "")}`).join(" ")}</div></>}<button className="fk-copy-small" onClick={() => void copy(`${post.hook}\n\n${post.caption}\n\n${post.cta}\n${post.hashtags.map(tag => `#${tag.replace(/^#/, "")}`).join(" ")}`)}><Copy size={13} /> Copy caption</button></article>)}</div>}
  </div>;
}

function EmailResult({ result, editing, activeVariant, setActiveVariant, onChange }: { result: Obj; editing: boolean; activeVariant: number; setActiveVariant: (n: number) => void; onChange: (next: Obj) => void }) {
  const variants = (result.variants as EmailVariant[]) ?? [];
  const current = variants[activeVariant];
  const updateVariant = (index: number, field: string, value: unknown) => {
    const next = [...variants]; next[index] = { ...next[index], [field]: value };
    onChange({ ...result, variants: next });
  };
  return <div className="fk-email-result"><div className="fk-insight-callout"><span className="fk-label-mono">AUDIENCE HYPOTHESIS</span><p>{String(result.audienceHypothesis)}</p></div>
    <div className="fk-variant-tabs">{variants.map((variant, index) => <button key={index} className={activeVariant === index ? "is-active" : ""} onClick={() => setActiveVariant(index)}><span>0{index + 1}</span>{variant.angle}</button>)}</div>
    {current && <div className="fk-email-composer"><div className="fk-email-top"><div><span className="fk-label-mono">FIRST TOUCH · ANGLE {activeVariant + 1}</span><h3>{current.angle}</h3></div><span className="fk-email-badge">Cold email</span></div><div className="fk-email-meta"><b>Subject</b><div>{current.subjectLines.map((line, index) => editing ? <input key={index} value={line} onChange={event => { const next = [...current.subjectLines]; next[index] = event.target.value; updateVariant(activeVariant, "subjectLines", next); }} /> : <span key={line}>{line}</span>)}</div></div>{editing ? <textarea className="fk-email-body" value={current.emailBody} onChange={event => updateVariant(activeVariant, "emailBody", event.target.value)} /> : <pre className="fk-email-body">{current.emailBody}</pre>}<div className="fk-followups"><span className="fk-label-mono">FOLLOW-UP SEQUENCE</span>{current.followUps.map((followUp, index) => <article key={`${followUp.day}-${index}`}><span className="fk-followup-day">DAY {followUp.day}</span><div><strong>{followUp.subject}</strong>{editing ? <textarea value={followUp.body} onChange={event => { const next = [...current.followUps]; next[index] = { ...followUp, body: event.target.value }; updateVariant(activeVariant, "followUps", next); }} /> : <p>{followUp.body}</p>}</div></article>)}</div></div>}
    <div className="fk-testing-notes"><span className="fk-label-mono">TEST THESE VARIABLES</span>{(result.testingNotes as string[] | undefined)?.map(note => <p key={note}>↳ {note}</p>)}</div>
  </div>;
}

function LinkedInResult({ result, editing, patchRow }: { result: Obj; editing: boolean; patchRow: (key: "contentCalendar" | "posts", index: number, field: string, value: unknown) => void }) {
  const posts = (result.posts as LinkedInPost[]) ?? [];
  return <div className="fk-linkedin-result"><div className="fk-insight-callout"><span className="fk-label-mono">YOUR POSITIONING</span><p>{String(result.positioning)}</p></div><div className="fk-pill-list">{(result.editorialMix as string[] | undefined)?.map(item => <span key={item}>{item}</span>)}</div><div className="fk-linkedin-grid">{posts.map((post, index) => <article className="fk-linkedin-post" key={post.day}><div className="fk-day-top"><span className="fk-day-number">POST {String(post.day).padStart(2, "0")}</span><span className="fk-platform-chip">{post.format}</span></div>{editing ? <><label className="fk-edit-label">Hook<input value={post.hook} onChange={event => patchRow("posts", index, "hook", event.target.value)} /></label><label className="fk-edit-label">Post body<textarea rows={9} value={post.body} onChange={event => patchRow("posts", index, "body", event.target.value)} /></label><label className="fk-edit-label">CTA<input value={post.cta} onChange={event => patchRow("posts", index, "cta", event.target.value)} /></label></> : <><h3>{post.hook}</h3><p>{post.body}</p><div className="fk-day-cta">↳ {post.cta}</div><div className="fk-hashtags">{post.hashtags.map(tag => `#${tag.replace(/^#/, "")}`).join(" ")}</div></>}</article>)}</div></div>;
}
