import { ArrowLeft, ArrowRight, Check, Clock3, Loader2, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import DynamicWorkflowForm from "@/components/DynamicWorkflowForm";
import { FlowIcon, LoadingState, SiteShell } from "@/components/FlowKitUI";
import WorkflowResult from "@/components/WorkflowResult";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { getWorkflowBySlug } from "@shared/workflows";

type Obj = Record<string, unknown>;
const stageSets: Record<string, string[]> = {
  "30-day-social-media-engine": ["Understanding your business…", "Analyzing audience…", "Building strategy…", "Generating content…", "Formatting calendar…"],
  "cold-email-generator": ["Understanding your offer…", "Analyzing your audience…", "Choosing message angles…", "Drafting the sequence…", "Polishing follow-ups…"],
  "linkedin-content-engine": ["Understanding your profile…", "Analyzing your audience…", "Building the editorial plan…", "Drafting your posts…", "Formatting your content plan…"],
};

export default function WorkflowRunner({ slug }: { slug: string }) {
  const query = trpc.catalog.detail.useQuery({ slug }, { retry: false });
  const workflow = query.data ?? getWorkflowBySlug(slug);
  const stages = stageSets[slug] ?? stageSets["30-day-social-media-engine"];
  const { user } = useAuth();
  const [inputs, setInputs] = useState<Obj | undefined>();
  const [result, setResult] = useState<Obj | undefined>();
  const [runId, setRunId] = useState<string | undefined>();
  const [stage, setStage] = useState(0);
  const [showForm, setShowForm] = useState(true);
  const [savedId, setSavedId] = useState<string | undefined>();
  const [saveMessage, setSaveMessage] = useState<string | undefined>();
  const utils = trpc.useUtils();
  const generation = trpc.workflow.generate.useMutation();
  const savedMutation = trpc.personal.save.useMutation({ onSuccess: data => { setSavedId(data.id); setSaveMessage(undefined); toast.success("Saved to your workspace"); void utils.personal.saved.invalidate(); void utils.personal.dashboard.invalidate(); }, onError: error => setSaveMessage(error.message) });
  const entitlement = trpc.personal.entitlement.useQuery(undefined, { enabled: Boolean(user) });
  const updateMutation = trpc.personal.updateSaved.useMutation({ onSuccess: () => { setSaveMessage(undefined); toast.success("Saved changes"); void utils.personal.saved.invalidate(); }, onError: error => setSaveMessage(error.message) });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("flowkit-run-prefill");
      if (!raw) return;
      const pending = JSON.parse(raw) as { slug?: string; inputs?: Obj };
      if (pending.slug === slug && pending.inputs) setInputs(pending.inputs);
      sessionStorage.removeItem("flowkit-run-prefill");
    } catch { /* a malformed/stale browser draft must not break the runner */ }
  }, [slug]);

  useEffect(() => {
    if (!generation.isPending) { setStage(0); return; }
    setStage(0);
    const timer = window.setInterval(() => setStage(current => Math.min(current + 1, stages.length - 1)), 1850);
    return () => window.clearInterval(timer);
  }, [generation.isPending]);

  if (query.isLoading && !workflow) return <SiteShell><main className="fk-container fk-page"><LoadingState label="Preparing your workflow" /></main></SiteShell>;
  if (!workflow) return <SiteShell><main className="fk-container fk-page"><div className="fk-not-found"><h1>Workflow not found</h1><Link href="/workflows" className="fk-button fk-button-primary">Back to marketplace</Link></div></main></SiteShell>;

  const submit = async (formInputs: Obj) => {
    setInputs(formInputs);
    setSaveMessage(undefined);
    try {
      const response = await generation.mutateAsync({ slug, inputs: formInputs });
      setResult(response.result as Obj);
      setRunId(response.runId ?? undefined);
      setShowForm(false);
      setSavedId(undefined);
      void utils.catalog.list.invalidate();
    } catch { /* Mutation error stays visible and the form retains its values. */ }
  };
  const regenerate = () => { if (inputs) void submit(inputs); };
  const requestLogin = (formInputs: Obj) => {
    try {
      sessionStorage.setItem("flowkit-run-prefill", JSON.stringify({ slug, inputs: formInputs }));
      sessionStorage.setItem("flowkit-post-auth-route", `/workflow/${slug}/run`);
    } catch { /* continue with normal login; the form can be re-entered if storage is unavailable */ }
    startLogin();
  };
  const save = () => {
    if (!result || !inputs) return;
    const title = `${workflow.name} · ${new Date().toLocaleDateString()}`;
    if (!user) {
      try {
        sessionStorage.setItem("flowkit-pending-save", JSON.stringify({ slug, runId, title, inputs, result }));
        sessionStorage.setItem("flowkit-post-auth-route", "/dashboard/saved");
        startLogin();
      } catch { setSaveMessage("Sign in to save this result. Copy or export it first so nothing is lost."); }
      return;
    }
    if (savedId) updateMutation.mutate({ id: savedId, title, result });
    else savedMutation.mutate({ slug, runId, title, inputs, result });
  };
  const pending = generation.isPending;

  if (workflow.pricing === "pro" && !workflow.implemented) return <SiteShell><main className="fk-container fk-page"><Link className="fk-back-link" href={`/workflow/${slug}`}><ArrowLeft size={14} /> Workflow details</Link><div className="fk-paywall-card"><span className="fk-plan-pill fk-plan-pro">FLOWKIT PRO</span><h1>More leverage,<br />when you’re ready.</h1><p>This workflow is listed in the marketplace, but its generation engine and billing are not connected in this MVP. No payment has been taken.</p><Link href="/workflows" className="fk-button fk-button-outline">Back to marketplace <ArrowRight size={15} /></Link></div></main></SiteShell>;

  return <SiteShell><main className="fk-container fk-page fk-run-page">
    <div className="fk-run-breadcrumb"><Link className="fk-back-link" href={`/workflow/${workflow.slug}`}><ArrowLeft size={14} /> {workflow.name}</Link><span className="fk-run-breadcrumb-note"><ShieldCheck size={13} /> Your workflow inputs stay private</span></div>
    <div className="fk-run-title-row"><div><span className="fk-run-kicker"><span className="fk-icon-tile fk-icon-tile-small"><FlowIcon name={workflow.icon} size={15} /></span> WORKFLOW RUNNER <span className="fk-run-slash">/</span> {workflow.category.toUpperCase()}</span><h1>{workflow.name}</h1><p>{workflow.description}</p></div><div className="fk-run-time"><Clock3 size={15} /> About 2 min <span>·</span> Saves {workflow.timeSaved}</div></div>
    {!workflow.implemented ? <div className="fk-coming-soon-banner"><Sparkles size={17} /><div><strong>This workflow is in the marketplace preview queue.</strong><span>The first launch engines are the 30-Day Social Media Engine, Cold Email Generator and LinkedIn Content Engine.</span></div><Link href="/workflows" className="fk-button fk-button-outline">Choose another <ArrowRight size={14} /></Link></div> : <div className="fk-run-layout">
      <div className="fk-run-main">
        {!result || showForm ? <section className="fk-input-panel"><div className="fk-panel-heading"><div><span className="fk-label-mono">LET’S SET THE CONTEXT</span><h2>A few things about your business.</h2><p>Specific context in. Useful work out. Required fields are marked with <span className="fk-required">*</span>.</p></div><span className="fk-form-count">{workflow.inputs.length} prompts<br />to guide the work</span></div>{!user && <div className="fk-auth-run-note"><ShieldCheck size={14} /><span><b>Sign in to generate.</b> Free accounts include 10 successful generations each month. Your brief is preserved through sign-in.</span></div>}<DynamicWorkflowForm workflow={workflow} onSubmit={values => void submit(values)} pending={pending} serverError={generation.error?.message} initialData={inputs} allowRun={Boolean(user)} onRequireLogin={requestLogin} /></section> : <section className="fk-result-switch"><div><Check size={15} /><span>Your output is ready to work with.</span></div><button className="fk-button fk-button-quiet" onClick={() => setShowForm(true)}><PencilIcon /> Edit brief</button></section>}
        {pending && <section className="fk-generation-panel" aria-live="polite"><span className="fk-generation-spark"><WandSparkles size={19} /></span><div className="fk-generation-copy"><span className="fk-label-mono">FLOWKIT IS WORKING</span><h3>{stages[stage]}</h3><p>Long structured outputs can take a minute or two. Your previous work stays intact.</p><div className="fk-progress-track"><span style={{ width: `${Math.min(20 + (stage + 1) * 16, 95)}%` }} /></div><div className="fk-stage-list">{stages.map((item, index) => <span key={item} className={index < stage ? "is-done" : index === stage ? "is-current" : ""}>{index < stage ? <Check size={12} /> : index === stage ? <Loader2 size={12} className="fk-spin" /> : <i />}{item.replace("…", "")}</span>)}</div></div></section>}
        {generation.error && result && <div className="fk-error-banner" role="alert">The new run didn’t finish: {generation.error.message} Your previous output is still here.</div>}
        {result && !showForm && <WorkflowResult slug={slug} title={workflow.name} result={result} onChange={next => { setResult(next); if (savedId) setSaveMessage("You have edited this saved output. Save again to update it."); }} onSave={save} onRegenerate={regenerate} isPro={entitlement.data?.isPro ?? false} saving={savedMutation.isPending || updateMutation.isPending} saved={Boolean(savedId) && !saveMessage} saveError={saveMessage} />}
      </div>
      <aside className="fk-run-aside"><div className="fk-run-side-card"><span className="fk-label-mono">YOUR WORKFLOW</span><div className="fk-run-side-icon"><FlowIcon name={workflow.icon} size={20} /></div><h3>{workflow.name}</h3><p>{workflow.features[0]} and more, formatted for your next step.</p><div className="fk-run-side-divider" />{workflow.steps.map((item, index) => <div className="fk-mini-pipeline" key={item}><span className={result || index === 0 ? "is-active" : ""}>{result || index === 0 ? <Check size={10} /> : index + 1}</span><span>{item}</span></div>)}<div className="fk-run-side-foot"><ShieldCheck size={14} /> Your brief and output are saved in your private run history.</div></div><div className="fk-run-help"><span>Need a different workflow?</span><Link href="/workflows">Back to marketplace <ArrowRight size={13} /></Link></div></aside>
    </div>}
  </main></SiteShell>;
}

function PencilIcon() { return <span aria-hidden="true">✎</span>; }
