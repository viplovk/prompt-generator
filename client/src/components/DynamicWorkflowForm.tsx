import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicWorkflow, WorkflowInput } from "@shared/workflows";

type Values = Record<string, unknown>;

function groupFields(workflow: PublicWorkflow) {
  const fields = workflow.inputs;
  if (workflow.slug === "30-day-social-media-engine") return [fields.slice(0, 5), fields.slice(5, 6), fields.slice(6, 7), fields.slice(7)];
  if (workflow.slug === "cold-email-generator") return [fields.slice(0, 4), fields.slice(4)];
  if (workflow.slug === "linkedin-content-engine") return [fields.slice(0, 4), fields.slice(4)];
  return [fields];
}

const stepNames: Record<string, string[]> = {
  "30-day-social-media-engine": ["Business", "Goals", "Platforms", "Voice & cadence"],
  "cold-email-generator": ["The offer", "Sequence details"],
  "linkedin-content-engine": ["Your profile", "Editorial direction"],
};

function initialValues(fields: WorkflowInput[], existing?: Values): Values {
  const values: Values = {};
  for (const field of fields) {
    if (existing && field.name in existing) values[field.name] = existing[field.name];
    else if (field.defaultValue !== undefined) values[field.name] = field.defaultValue;
    else if (field.type === "multi-select") values[field.name] = [];
    else if (field.type === "toggle") values[field.name] = false;
    else values[field.name] = "";
  }
  return values;
}

function DynamicField({ field, value, onChange, error }: { field: WorkflowInput; value: unknown; onChange: (next: unknown) => void; error?: string }) {
  const common = { id: field.name, name: field.name, required: field.required, placeholder: field.placeholder, "aria-invalid": Boolean(error), "aria-describedby": error ? `${field.name}-error` : undefined };
  return (
    <div className={`fk-field ${error ? "has-error" : ""}`}>
      {field.type === "toggle" ? (
        <label className="fk-toggle-field" htmlFor={field.name}><span className="fk-toggle-copy"><strong>{field.label}</strong>{field.help && <small>{field.help}</small>}</span><input {...common} type="checkbox" checked={Boolean(value)} onChange={event => onChange(event.target.checked)} /><span className="fk-switch" /></label>
      ) : <label className="fk-field-label" htmlFor={field.name}>{field.label}{field.required && <span className="fk-required">*</span>}</label>}
      {field.type === "textarea" && <textarea {...common} rows={4} value={String(value ?? "")} onChange={event => onChange(event.target.value)} />}
      {field.type === "text" && <input {...common} type="text" value={String(value ?? "")} onChange={event => onChange(event.target.value)} />}
      {field.type === "url" && <input {...common} type="url" value={String(value ?? "")} onChange={event => onChange(event.target.value)} />}
      {field.type === "number" && <input {...common} type="number" min={field.min} max={field.max} value={String(value ?? "")} onChange={event => onChange(event.target.value === "" ? "" : Number(event.target.value))} />}
      {field.type === "select" && <select {...common} value={String(value ?? "")} onChange={event => onChange(event.target.value)}><option value="">Select an option</option>{(field.options ?? []).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
      {field.type === "multi-select" && <div className="fk-options-grid">{(field.options ?? []).map(option => { const selected = Array.isArray(value) && value.includes(option.value); return <button key={option.value} type="button" className={`fk-option-chip ${selected ? "is-selected" : ""}`} onClick={() => { const current = Array.isArray(value) ? value as string[] : []; onChange(selected ? current.filter(item => item !== option.value) : [...current, option.value]); }}><span className="fk-option-check">{selected && <Check size={12} />}</span>{option.label}</button>; })}</div>}
      {field.help && field.type !== "toggle" && <small className="fk-field-help">{field.help}</small>}
      {error && <small id={`${field.name}-error`} className="fk-field-error">{error}</small>}
    </div>
  );
}

export default function DynamicWorkflowForm({ workflow, onSubmit, pending = false, serverError, initialData, allowRun = true, onRequireLogin }: { workflow: PublicWorkflow; onSubmit: (values: Values) => void; pending?: boolean; serverError?: string; initialData?: Values; allowRun?: boolean; onRequireLogin?: (values: Values) => void }) {
  const groups = useMemo(() => groupFields(workflow), [workflow]);
  const names = stepNames[workflow.slug] ?? ["Workflow brief"];
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(() => initialValues(workflow.inputs, initialData));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (initialData) {
      setValues(current => initialValues(workflow.inputs, { ...current, ...initialData }));
      setStep(0);
      setErrors({});
    }
  }, [initialData]);

  const validate = (fields: WorkflowInput[]) => {
    const next: Record<string, string> = {};
    for (const field of fields) {
      const value = values[field.name];
      const empty = value === undefined || value === "" || Array.isArray(value) && value.length === 0;
      if (field.required && empty) next[field.name] = "This field is required.";
      if (field.type === "url" && !empty && typeof value === "string") {
        try { const url = new URL(value); if (!(url.protocol === "http:" || url.protocol === "https:")) throw new Error(); } catch { next[field.name] = "Enter a valid http or https URL."; }
      }
      if (field.type === "number" && !empty && (Number(value) < (field.min ?? -Infinity) || Number(value) > (field.max ?? Infinity))) next[field.name] = `Choose a number between ${field.min ?? "any"} and ${field.max ?? "any"}.`;
    }
    setErrors(current => ({ ...current, ...next }));
    return Object.keys(next).length === 0;
  };

  const setField = (field: string, next: unknown) => {
    setValues(current => ({ ...current, [field]: next }));
    setErrors(current => ({ ...current, [field]: "" }));
    setTouched(true);
  };
  const currentFields = groups[step] ?? [];

  const nextStep = () => {
    if (!validate(currentFields)) return;
    setStep(index => Math.min(groups.length - 1, index + 1));
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (groups.some(group => !validate(group))) return;
    if (!allowRun) { onRequireLogin?.(values); return; }
    onSubmit(values);
  };

  return (
    <form className="fk-run-form" onSubmit={submit} noValidate>
      {groups.length > 1 && <div className="fk-stepper" aria-label="Workflow steps">{groups.map((_, index) => <div key={index} className={`fk-step ${index === step ? "is-current" : ""} ${index < step ? "is-done" : ""}`}><span>{index < step ? <Check size={13} /> : index + 1}</span><small>{names[index] ?? `Step ${index + 1}`}</small></div>)}</div>}
      <div className="fk-form-fields">
        {currentFields.map(field => <DynamicField key={field.name} field={field} value={values[field.name]} onChange={next => setField(field.name, next)} error={errors[field.name]} />)}
      </div>
      {serverError && <div className="fk-error-banner" role="alert">{serverError}<span>{touched ? " Your answers are preserved—make a change or retry." : ""}</span></div>}
      <div className="fk-form-actions">
        {step > 0 && <button type="button" className="fk-button fk-button-quiet" onClick={() => setStep(index => index - 1)} disabled={pending}><ArrowLeft size={15} /> Back</button>}
        {step < groups.length - 1 ? <button type="button" className="fk-button fk-button-primary" onClick={nextStep}>Continue <ArrowRight size={15} /></button> : <button type="submit" className="fk-button fk-button-primary" disabled={pending}>{pending ? <><Loader2 size={16} className="fk-spin" /> Building your result</> : <><span>{!allowRun ? "Sign in to generate" : workflow.slug === "30-day-social-media-engine" ? "Generate My Content Strategy" : workflow.slug === "cold-email-generator" ? "Generate My Sequence" : "Generate My Content Plan"}</span><ArrowRight size={16} /></>}</button>}
      </div>
    </form>
  );
}
