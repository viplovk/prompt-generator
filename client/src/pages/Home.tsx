import { ArrowDown, ArrowRight, ArrowUpRight, Check, Clock3, Dot, Play, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { FlowIcon, LoadingState, SectionEyebrow, SiteShell, WorkflowCard } from "@/components/FlowKitUI";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { WORKFLOWS } from "@shared/workflows";

const demos = [
  { label: "Social", slug: "30-day-social-media-engine", badge: "30-day plan", title: "A month of content, mapped.", line: "Hooks, captions and CTAs—ready to review.", items: ["Audience-led strategy", "30 platform-aware posts", "A clear next step, every day"] },
  { label: "Sales", slug: "cold-email-generator", badge: "Sales sequence", title: "Outbound that sounds like you.", line: "Specific angles, no spray-and-pray templates.", items: ["Three distinct message angles", "Subject line options", "Considerate follow-ups"] },
  { label: "LinkedIn", slug: "linkedin-content-engine", badge: "Creator plan", title: "Show up with a point of view.", line: "A week of posts built around what you know.", items: ["Seven publish-ready posts", "Native hooks and formats", "Your voice stays yours"] },
];

export default function Home() {
  const [selected, setSelected] = useState(0);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const workflowQuery = trpc.catalog.list.useQuery();
  const workflows = workflowQuery.data ?? WORKFLOWS;
  const demo = demos[selected];
  useEffect(() => {
    if (!user) return;
    try {
      const destination = sessionStorage.getItem("flowkit-post-auth-route");
      if (destination?.startsWith("/") && !destination.startsWith("//")) {
        sessionStorage.removeItem("flowkit-post-auth-route");
        setLocation(destination);
      }
    } catch { /* continue to the home page when session storage is unavailable */ }
  }, [user, setLocation]);
  return <SiteShell>
    <main className="fk-home">
      <section className="fk-hero fk-container">
        <div className="fk-hero-copy fk-reveal">
          <SectionEyebrow>THE OPERATING SYSTEM FOR ONE-PERSON TEAMS</SectionEyebrow>
          <h1>Your Business.<br /><span>Automated by AI.</span></h1>
          <p className="fk-hero-subtitle">Ready-to-run AI workflows for content, marketing, sales and productivity.</p>
          <div className="fk-hero-actions"><Link className="fk-button fk-button-primary fk-button-large" href="/workflows">Explore Workflows <ArrowRight size={17} /></Link><Link className="fk-button fk-button-outline fk-button-large" href={`/workflow/${demos[0].slug}/run`}><Play size={15} /> Try a Free Workflow</Link></div>
          <div className="fk-hero-proof"><span>Built for people doing the work</span><span className="fk-proof-divider" /><span><span className="fk-live-dot" /> Three launch workflows are live</span></div>
        </div>
        <div className="fk-demo-stage fk-reveal fk-reveal-delay" aria-label="Interactive workflow demo">
          <div className="fk-demo-orbit fk-orbit-a" /><div className="fk-demo-orbit fk-orbit-b" />
          <div className="fk-demo-window">
            <div className="fk-demo-window-top"><div className="fk-window-controls"><i /><i /><i /></div><span className="fk-mono">FLOWKIT / LIVE PREVIEW</span><span className="fk-demo-status"><span className="fk-live-dot" /> READY</span></div>
            <div className="fk-demo-workflow-select">{demos.map((item, index) => <button key={item.label} className={selected === index ? "is-active" : ""} onClick={() => setSelected(index)}>{item.label}</button>)}</div>
            <div className="fk-demo-content"><div className="fk-demo-kicker"><span className="fk-icon-tile fk-icon-tile-small"><FlowIcon name={selected === 0 ? "CalendarDays" : selected === 1 ? "Send" : "BriefcaseBusiness"} size={15} /></span><span>{demo.badge}</span><span className="fk-free-tag">FREE</span></div><h2>{demo.title}</h2><p>{demo.line}</p><div className="fk-demo-pipeline"><div className="fk-pipeline-node fk-node-done"><span><Check size={12} /></span><div><small>01 · CONTEXT</small><b>Your business, understood</b></div></div><span className="fk-pipeline-connector" /><div className="fk-pipeline-node fk-node-active"><span className="fk-node-pulse"><Sparkles size={13} /></span><div><small>02 · STRATEGY</small><b>Audience-first thinking</b></div></div><span className="fk-pipeline-connector" /><div className="fk-pipeline-node"><span><Dot size={16} /></span><div><small>03 · OUTPUT</small><b>Ready for your review</b></div></div></div><div className="fk-demo-output"><div className="fk-demo-output-head"><span>WHAT YOU GET</span><span>STRUCTURED · EDITABLE</span></div>{demo.items.map((item, index) => <div className="fk-demo-output-row" key={item}><span className="fk-output-index">0{index + 1}</span><span>{item}</span><ArrowUpRight size={13} /></div>)}</div><Link href={`/workflow/${demo.slug}/run`} className="fk-demo-button">Try this workflow <ArrowRight size={15} /></Link></div>
          </div>
          <div className="fk-demo-floating fk-floating-top"><span className="fk-floating-icon"><Zap size={14} /></span><span>Prompt engineering<br /><b>handled for you</b></span></div>
          <div className="fk-demo-floating fk-floating-bottom"><span className="fk-floating-check"><Check size={14} /></span><span><b>One brief in.</b><br />Useful work out.</span></div>
        </div>
        <a className="fk-scroll-hint" href="#how-it-works"><ArrowDown size={14} /> A simpler way to get it done</a>
      </section>

      <section className="fk-trust-strip fk-container"><span className="fk-trust-caption">A calmer way to handle the repeatable parts</span><div className="fk-trust-items"><span><Check size={13} /> No prompt engineering</span><span><Check size={13} /> Workflows, not chat threads</span><span><Check size={13} /> Review before you publish</span></div></section>

      <section className="fk-section fk-container" id="how-it-works"><div className="fk-section-heading"><div><SectionEyebrow>FROM BRIEF TO BETTER WORK</SectionEyebrow><h2>Less setup.<br /><span>More momentum.</span></h2></div><p>The best AI tool is the one that already knows what to ask. FlowKit turns proven prompts into guided workflows built around your real business.</p></div><div className="fk-three-steps"><article><span className="fk-step-index">01</span><span className="fk-step-icon"><FlowIcon name="MousePointer2" size={17} /></span><h3>Choose a workflow</h3><p>Start with a specific job to be done—not a blank chat box.</p></article><article><span className="fk-step-index">02</span><span className="fk-step-icon"><FlowIcon name="ListTodo" size={17} /></span><h3>Share the context</h3><p>A few straightforward questions give the engine what it needs.</p></article><article><span className="fk-step-index">03</span><span className="fk-step-icon"><FlowIcon name="Sparkles" size={17} /></span><h3>Make it yours</h3><p>Get a structured first draft you can edit, save and take anywhere.</p></article></div></section>

      <section className="fk-section fk-feature-section"><div className="fk-container"><div className="fk-section-heading fk-section-heading-tight"><div><SectionEyebrow>THE WORKFLOW MARKETPLACE</SectionEyebrow><h2>Built for the work<br />behind the work.</h2></div><Link className="fk-text-link" href="/workflows">Explore all workflows <ArrowRight size={15} /></Link></div>{workflowQuery.isLoading ? <LoadingState label="Loading the marketplace" /> : <div className="fk-workflow-grid fk-home-workflows">{workflows.filter(workflow => workflow.implemented).slice(0, 3).map(workflow => <WorkflowCard key={workflow.slug} workflow={workflow} />)}</div>}</div></section>

      <section className="fk-final-cta fk-container"><div className="fk-cta-copy"><span className="fk-cta-spark"><Sparkles size={17} /></span><SectionEyebrow>START WITH ONE TASK</SectionEyebrow><h2>Get your time<br />back in the flow.</h2><p>Choose one repeatable task. Let a workflow handle the first draft.</p></div><div className="fk-cta-side"><Link className="fk-button fk-button-primary fk-button-large" href="/workflows">Find your workflow <ArrowRight size={17} /></Link><span>No credit card. No prompt-writing course.</span><div className="fk-cta-micro"><Clock3 size={13} /> Usually under 3 minutes to a first result</div></div></section>
      <div className="fk-container fk-home-error">{workflowQuery.isError && <span>Live catalog is temporarily unavailable. Showing the launch workflows.</span>}</div>
    </main>
  </SiteShell>;
}
