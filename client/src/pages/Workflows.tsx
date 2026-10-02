import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { FlowIcon, LoadingState, PageTitle, SiteShell, WorkflowCard } from "@/components/FlowKitUI";
import { trpc } from "@/lib/trpc";
import { WORKFLOW_CATEGORIES, WORKFLOWS } from "@shared/workflows";

export default function WorkflowsPage() {
  const { data, isLoading, isError } = trpc.catalog.list.useQuery();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All workflows");
  const [access, setAccess] = useState("All access");
  const workflows = data ?? WORKFLOWS;
  const readyCount = workflows.filter(workflow => workflow.implemented).length;
  const filtered = useMemo(() => workflows.filter(workflow => {
    const matchesQuery = `${workflow.name} ${workflow.description} ${workflow.category}`.toLowerCase().includes(query.toLowerCase().trim());
    const matchesCategory = category === "All workflows" || workflow.category === category;
    const matchesAccess = access === "All access" || workflow.pricing === (access === "Free" ? "free" : "pro");
    return matchesQuery && matchesCategory && matchesAccess;
  }), [workflows, query, category, access]);

  return <SiteShell><main className="fk-page fk-container">
    <div className="fk-marketplace-hero"><div><span className="fk-marketplace-kicker"><span className="fk-live-dot" /> THE FLOWKIT MARKETPLACE</span><h1>Find your next<br /><span>good first draft.</span></h1><p>Purpose-built AI workflows for the work that keeps your business moving.</p></div><div className="fk-marketplace-count"><strong>{workflows.length}</strong><span>workflow templates<br />{readyCount} launch engines live</span><FlowIcon name="Sparkles" size={19} /></div></div>
    <div className="fk-marketplace-tools"><label className="fk-search-box"><Search size={17} /><input type="search" placeholder="Search workflows, tasks or categories…" value={query} onChange={event => setQuery(event.target.value)} aria-label="Search workflows" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={14} /></button>}<kbd>⌘ K</kbd></label><label className="fk-filter-select"><SlidersHorizontal size={15} /><select value={access} onChange={event => setAccess(event.target.value)} aria-label="Filter by plan"><option>All access</option><option>Free</option><option>Pro</option></select></label></div>
    <div className="fk-category-bar" aria-label="Filter by category"><button className={category === "All workflows" ? "is-active" : ""} onClick={() => setCategory("All workflows")}>All workflows <span>{workflows.length}</span></button>{WORKFLOW_CATEGORIES.map(item => <button key={item} className={category === item ? "is-active" : ""} onClick={() => setCategory(category === item ? "All workflows" : item)}>{item}</button>)}</div>
    <div className="fk-results-heading"><div><span className="fk-label-mono">SHOWING</span><h2>{filtered.length} {filtered.length === 1 ? "workflow" : "workflows"}</h2></div><span className="fk-results-note">Start with one of three live launch engines; the other catalog listings are previews.</span></div>
    {isLoading ? <LoadingState label="Loading workflows" /> : filtered.length ? <div className="fk-workflow-grid">{filtered.map(workflow => <WorkflowCard key={workflow.slug} workflow={workflow} />)}</div> : <div className="fk-no-results"><span className="fk-icon-tile"><Search size={18} /></span><h3>No workflows match that search.</h3><p>Try another keyword or clear a filter.</p><button className="fk-button fk-button-quiet" onClick={() => { setQuery(""); setCategory("All workflows"); setAccess("All access"); }}>Clear all filters <X size={14} /></button></div>}
    {isError && <p className="fk-marketplace-note">The live catalog could not be reached. Showing the built-in catalog preview instead.</p>}
    <section className="fk-marketplace-bottom"><div><span className="fk-label-mono">HAVE A REPETITIVE TASK?</span><h3>There’s probably a workflow for that.</h3></div><Link className="fk-button fk-button-outline" href="/dashboard">Make it your own <FlowIcon name="ArrowRight" size={15} /></Link></section>
  </main></SiteShell>;
}
