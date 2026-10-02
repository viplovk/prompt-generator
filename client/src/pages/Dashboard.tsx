import { ArrowRight, Bookmark, Check, Clipboard, Download, Heart, History, LayoutDashboard, LogOut, Settings, Sparkles, Trash2, Workflow as WorkflowIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { EmptyState, FlowIcon, LoadingState, PageTitle, SiteShell, WorkflowCard } from "@/components/FlowKitUI";
import { trpc } from "@/lib/trpc";
import { WORKFLOWS } from "@shared/workflows";

type SavedRow = { id: string; title: string; workflowName: string; workflowSlug: string; inputs: Record<string, unknown>; result: Record<string, unknown>; createdAt: Date | string };
type HistoryRow = { id: string; workflowName: string; workflowSlug: string; createdAt: Date | string; result: Record<string, unknown> };
const nav = [
  { label: "Home", section: "home", icon: LayoutDashboard },
  { label: "My Workflows", section: "workflows", icon: WorkflowIcon },
  { label: "Saved Results", section: "saved", icon: Bookmark },
  { label: "Favorites", section: "favorites", icon: Heart },
  { label: "History", section: "history", icon: History },
  { label: "Marketplace", section: "marketplace", icon: Sparkles, href: "/workflows" },
  { label: "Settings", section: "settings", icon: Settings },
];
const dateLabel = (value: Date | string) => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
const textResult = (value: unknown) => typeof value === "string" ? value : JSON.stringify(value, null, 2);

export default function Dashboard({ section = "home" }: { section?: string }) {
  const { user, loading, logout } = useAuth();
  const [editingId, setEditingId] = useState<string | undefined>();
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState("");
  const utils = trpc.useUtils();
  const summary = trpc.personal.dashboard.useQuery(undefined, { enabled: Boolean(user) });
  const saved = trpc.personal.saved.useQuery(undefined, { enabled: Boolean(user) });
  const history = trpc.personal.history.useQuery(undefined, { enabled: Boolean(user) });
  const favorites = trpc.personal.favorites.useQuery(undefined, { enabled: Boolean(user) });
  const catalog = trpc.catalog.list.useQuery();
  const entitlement = trpc.personal.entitlement.useQuery(undefined, { enabled: Boolean(user) });
  const removeSaved = trpc.personal.deleteSaved.useMutation({ onSuccess: () => { toast.success("Saved result deleted"); void utils.personal.saved.invalidate(); void utils.personal.dashboard.invalidate(); }, onError: error => toast.error(error.message) });
  const updateSaved = trpc.personal.updateSaved.useMutation({ onSuccess: () => { toast.success("Saved result updated"); setEditingId(undefined); setEditError(""); void utils.personal.saved.invalidate(); }, onError: error => setEditError(error.message) });
  const restorePendingSave = trpc.personal.save.useMutation({ onSuccess: () => { toast.success("Your result was saved to your workspace"); void utils.personal.saved.invalidate(); void utils.personal.dashboard.invalidate(); }, onError: error => toast.error(`Could not save the result: ${error.message}`) });
  const toggleFavorite = trpc.catalog.toggleFavorite.useMutation({ onSuccess: () => { void utils.personal.favorites.invalidate(); void utils.personal.dashboard.invalidate(); }, onError: error => toast.error(error.message) });
  const rows = (saved.data ?? []) as SavedRow[];
  const historyRows = (history.data ?? []) as HistoryRow[];
  const allCatalog = catalog.data ?? WORKFLOWS;
  const owned = useMemo(() => { const slugs = new Set(historyRows.map(item => item.workflowSlug)); return allCatalog.filter(item => slugs.has(item.slug)); }, [allCatalog, historyRows]);
  const active = nav.some(item => item.section === section) ? section : "home";
  const currentLabel = nav.find(item => item.section === active)?.label ?? "Home";

  const exportSaved = (row: SavedRow) => {
    if (!entitlement.data?.isPro) { toast.info("JSON exports are a Pro feature. Billing is not connected yet; no payment has been taken."); return; }
    const blob = new Blob([JSON.stringify(row.result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${row.workflowSlug}-saved.json`; anchor.click(); URL.revokeObjectURL(url);
  };
  const copySaved = async (row: SavedRow) => { try { await navigator.clipboard.writeText(textResult(row.result)); toast.success("Copied to clipboard"); } catch { toast.error("Clipboard access is unavailable."); } };
  const beginEdit = (row: SavedRow) => { setEditingId(row.id); setEditValue(JSON.stringify(row.result, null, 2)); setEditError(""); };
  const commitEdit = (row: SavedRow) => { try { const value = JSON.parse(editValue); if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("The result needs to be a JSON object."); updateSaved.mutate({ id: row.id, title: row.title, result: value }); } catch (error) { setEditError(error instanceof Error ? error.message : "Check the JSON and try again."); } };
  const regenerate = (row: SavedRow) => { try { sessionStorage.setItem("flowkit-run-prefill", JSON.stringify({ slug: row.workflowSlug, inputs: row.inputs })); } catch { /* continue without prefill if storage is unavailable */ } window.location.href = `/workflow/${row.workflowSlug}/run`; };

  useEffect(() => {
    if (!user) return;
    try {
      const raw = sessionStorage.getItem("flowkit-pending-save");
      if (!raw) return;
      sessionStorage.removeItem("flowkit-pending-save");
      const payload = JSON.parse(raw) as { slug: string; runId?: string; title: string; inputs: Record<string, unknown>; result: Record<string, unknown> };
      restorePendingSave.mutate(payload);
    } catch { toast.error("The saved-result handoff could not be restored. Please generate the result again."); }
  }, [user]);

  if (loading) return <SiteShell><main className="fk-page fk-container"><LoadingState label="Opening your workspace" /></main></SiteShell>;
  if (!user) return <SiteShell><main className="fk-container fk-page"><div className="fk-auth-card"><span className="fk-icon-tile"><LayoutDashboard size={19} /></span><span className="fk-label-mono">YOUR FLOWKIT WORKSPACE</span><h1>One place for the work you’ve made.</h1><p>Sign in with Manus to keep saved results, workflow favorites and generation history connected to your account.</p><button className="fk-button fk-button-primary fk-button-large" onClick={() => startLogin()}>Sign in to your workspace <ArrowRight size={16} /></button><Link href="/workflows" className="fk-text-link">Explore workflows first <ArrowRight size={14} /></Link></div></main></SiteShell>;

  const metric = summary.data;
  return <SiteShell><main className="fk-container fk-page fk-dashboard-page">
    <div className="fk-dashboard-heading"><div><span className="fk-label-mono">YOUR WORKSPACE</span><h1>{active === "home" ? `Good to have you, ${user.name?.split(" ")[0] || "there"}.` : currentLabel}</h1><p>{active === "home" ? "Your work, workflows and next steps—together." : section === "settings" ? "Your account and plan at a glance." : `Your ${currentLabel.toLowerCase()} in one place.`}</p></div><button className="fk-button fk-button-outline" onClick={() => void logout()}><LogOut size={14} /> Sign out</button></div>
    <div className="fk-dashboard-layout"><aside className="fk-dashboard-sidebar"><div className="fk-sidebar-label">WORKSPACE</div>{nav.map(item => <Link href={item.href ?? (item.section === "home" ? "/dashboard" : `/dashboard/${item.section}`)} key={item.label} className={`fk-sidebar-link ${active === item.section ? "is-active" : ""}`}><item.icon size={16} strokeWidth={1.7} /><span>{item.label}</span>{active === item.section && <span className="fk-sidebar-active-dot" />}</Link>)}<div className="fk-sidebar-bottom"><span className="fk-mini-avatar">{user.name?.slice(0, 1).toUpperCase() || "F"}</span><div><strong>{user.name || "FlowKit user"}</strong><small>Free plan · {user.email || "Manus account"}</small></div></div></aside>
      <div className="fk-dashboard-content">
        {active === "home" && <><div className="fk-metric-grid">{[{ label: "Generations this month", value: metric?.generationsThisMonth ?? 0, unit: "of 10 free", icon: "Sparkles" }, { label: "Time given back", value: `${Math.floor((metric?.timeSavedMinutes ?? 0) / 60)}h ${(metric?.timeSavedMinutes ?? 0) % 60}m`, unit: "estimated", icon: "Clock3" }, { label: "Workflows installed", value: metric?.installedWorkflows ?? 0, unit: "used so far", icon: "Workflow" }, { label: "Saved results", value: metric?.savedResults ?? 0, unit: "in your library", icon: "Bookmark" }].map(item => <article className="fk-metric-card" key={item.label}><span className="fk-metric-icon"><FlowIcon name={item.icon} size={16} /></span><span className="fk-metric-label">{item.label}</span><strong>{summary.isLoading ? "—" : item.value}</strong><small>{item.unit}</small></article>)}</div>
          <div className="fk-dashboard-section-head"><div><span className="fk-label-mono">PICK UP WHERE YOU LEFT OFF</span><h2>Recent generations</h2></div><Link href="/dashboard/history" className="fk-text-link">Full history <ArrowRight size={14} /></Link></div>
          {history.isLoading ? <LoadingState /> : historyRows.length ? <div className="fk-recent-list">{historyRows.slice(0, 5).map(row => <div className="fk-recent-row" key={row.id}><span className="fk-recent-icon"><Sparkles size={16} /></span><div><strong>{row.workflowName}</strong><small>{dateLabel(row.createdAt)}</small></div><Link href={`/workflow/${row.workflowSlug}/run`} aria-label={`Run ${row.workflowName} again`}><ArrowRight size={15} /></Link></div>)}</div> : <EmptyState icon="Sparkles" title="Your first result is one workflow away." description="Start with a social calendar, an outbound sequence, or a LinkedIn content plan." action={<Link className="fk-button fk-button-primary" href="/workflows">Explore workflows <ArrowRight size={14} /></Link>} />}
          <div className="fk-dashboard-section-head fk-dashboard-fav-head"><div><span className="fk-label-mono">YOUR SHORTLIST</span><h2>Favorite workflows</h2></div><Link href="/dashboard/favorites" className="fk-text-link">All favorites <ArrowRight size={14} /></Link></div>{favorites.data?.length ? <div className="fk-workflow-grid fk-dashboard-cards">{favorites.data.slice(0, 2).map(item => <WorkflowCard key={item.slug} workflow={item} compact />)}</div> : <div className="fk-inline-empty"><Heart size={16} /><span>Save a workflow you like and it will show up here.</span><Link href="/workflows">Browse <ArrowRight size={13} /></Link></div>}</>}
        {active === "workflows" && <><div className="fk-dashboard-section-head"><div><span className="fk-label-mono">BASED ON YOUR RUN HISTORY</span><h2>Your workflows</h2></div><Link href="/workflows" className="fk-button fk-button-outline">Find more <ArrowRight size={14} /></Link></div>{owned.length ? <div className="fk-workflow-grid">{owned.map(item => <WorkflowCard key={item.slug} workflow={item} />)}</div> : <EmptyState icon="Workflow" title="No workflows in your workspace yet." description="Run any free workflow and it will appear here." action={<Link className="fk-button fk-button-primary" href="/workflows">Explore workflows <ArrowRight size={14} /></Link>} />}</>}
        {active === "saved" && <><div className="fk-dashboard-section-head"><div><span className="fk-label-mono">YOUR PERSONAL LIBRARY</span><h2>Saved results <span className="fk-count-chip">{rows.length}</span></h2></div></div>{saved.isLoading ? <LoadingState /> : rows.length ? <div className="fk-saved-list">{rows.map(row => <article className="fk-saved-card" key={row.id}><div className="fk-saved-head"><div><span className="fk-saved-workflow"><Bookmark size={13} /> {row.workflowName}</span><h3>{row.title}</h3><small>{dateLabel(row.createdAt)}</small></div><div className="fk-saved-actions"><button className="fk-icon-button" title="Copy result" onClick={() => void copySaved(row)}><Clipboard size={15} /></button><button className="fk-icon-button" title={entitlement.data?.isPro ? "Export JSON" : "Export JSON (Pro)"} onClick={() => exportSaved(row)}><Download size={15} /></button><button className="fk-icon-button" title="Delete saved result" onClick={() => removeSaved.mutate({ id: row.id })}><Trash2 size={15} /></button></div></div>{editingId === row.id ? <><textarea className="fk-json-editor" value={editValue} onChange={event => setEditValue(event.target.value)} aria-label="Edit saved result JSON" />{editError && <div className="fk-field-error">{editError}</div>}<div className="fk-saved-edit-actions"><button className="fk-button fk-button-primary" onClick={() => commitEdit(row)} disabled={updateSaved.isPending}>{updateSaved.isPending ? "Saving…" : "Save changes"}</button><button className="fk-button fk-button-quiet" onClick={() => { setEditingId(undefined); setEditError(""); }}>Cancel</button></div></> : <><pre className="fk-saved-preview">{textResult(row.result).slice(0, 720)}{textResult(row.result).length > 720 ? "…" : ""}</pre><div className="fk-saved-footer"><button className="fk-text-link" onClick={() => beginEdit(row)}>Edit result <ArrowRight size={13} /></button><button className="fk-text-link" onClick={() => regenerate(row)}>Regenerate <ArrowRight size={13} /></button><Link className="fk-text-link" href={`/workflow/${row.workflowSlug}/run`}>Open workflow <ArrowRight size={13} /></Link></div></>}</article>)}</div> : <EmptyState icon="Bookmark" title="Nothing saved yet." description="Run a workflow and save the result you want to keep." action={<Link className="fk-button fk-button-primary" href="/workflows">Explore workflows <ArrowRight size={14} /></Link>} />}</>}
        {active === "favorites" && <><div className="fk-dashboard-section-head"><div><span className="fk-label-mono">YOUR SHORTLIST</span><h2>Favorite workflows</h2></div></div>{favorites.isLoading ? <LoadingState /> : favorites.data?.length ? <div className="fk-workflow-grid">{favorites.data.map(item => <div className="fk-favorite-card-wrap" key={item.slug}><WorkflowCard workflow={item} /><button className="fk-favorite-remove" onClick={() => toggleFavorite.mutate({ slug: item.slug })}><Heart size={13} fill="currentColor" /> Remove favorite</button></div>)}</div> : <EmptyState icon="Heart" title="Keep your go-to workflows close." description="Tap the heart on any workflow to add it here." action={<Link className="fk-button fk-button-primary" href="/workflows">Browse marketplace <ArrowRight size={14} /></Link>} />}</>}
        {active === "history" && <><div className="fk-dashboard-section-head"><div><span className="fk-label-mono">YOUR GENERATIONS</span><h2>Workflow history</h2></div></div>{history.isLoading ? <LoadingState /> : historyRows.length ? <div className="fk-recent-list fk-history-list">{historyRows.map(row => <div className="fk-recent-row" key={row.id}><span className="fk-recent-icon"><History size={15} /></span><div><strong>{row.workflowName}</strong><small>{dateLabel(row.createdAt)}</small></div><Link href={`/workflow/${row.workflowSlug}/run`} className="fk-history-run">Run again <ArrowRight size={13} /></Link></div>)}</div> : <EmptyState icon="History" title="Nothing in your history yet." description="Your successful generations will appear here." action={<Link className="fk-button fk-button-primary" href="/workflows">Start a workflow <ArrowRight size={14} /></Link>} />}</>}
        {active === "settings" && <div className="fk-settings-stack"><section className="fk-settings-card"><div><span className="fk-label-mono">ACCOUNT PROFILE</span><h2>Your account</h2><p>Your FlowKit workspace is attached to your Manus login.</p></div><div className="fk-profile-row"><span className="fk-profile-avatar">{user.name?.slice(0, 1).toUpperCase() || "F"}</span><div><strong>{user.name || "FlowKit member"}</strong><small>{user.email || "Manus account"}</small></div><span className="fk-profile-tag">{user.role === "admin" ? "ADMIN" : "MEMBER"}</span></div></section><section className="fk-settings-card fk-plan-card"><div><span className="fk-label-mono">CURRENT PLAN</span><h2>Free</h2><p>Ten generations per month on launch workflows. Saved results and favorites are yours to keep.</p></div><div className="fk-plan-divider" /><div className="fk-plan-side"><span className="fk-plan-pill fk-plan-pro">PRO</span><strong>More room to build.</strong><small>Premium workflows and expanded usage are prepared. Billing is not connected, so no upgrade can be purchased yet.</small><button className="fk-button fk-button-outline" disabled>Billing unavailable</button></div></section><section className="fk-settings-card"><span className="fk-label-mono">PRIVACY & DATA</span><h2>Your prompts are private.</h2><p>Workflow inputs are sent to the server-side AI engine to produce your output. Personal results are stored in your authenticated workspace database.</p></section></div>}
      </div>
    </div>
  </main></SiteShell>;
}
