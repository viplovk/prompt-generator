import {
  ArrowRight, ArrowUpRight, Bookmark, BriefcaseBusiness, CalendarDays, Check, ChevronRight,
  CircleHelp, Clapperboard, Clock3, Code2, Copy, CreditCard, Download, FileText, Filter,
  Heart, History, Instagram, LayoutDashboard, ListTodo, Loader2, LogOut, Mail, Menu,
  MessageCircle, MousePointer2, PanelsTopLeft, Pencil, Plus, RotateCw, Save, Search,
  Send, Settings, ShoppingBag, Sparkles, Star, Trash2, X, Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import type { PublicWorkflow } from "@shared/workflows";

const iconMap = {
  ArrowRight, ArrowUpRight, Bookmark, BriefcaseBusiness, CalendarDays, Check, ChevronRight,
  CircleHelp, Clapperboard, Clock3, Code2, Copy, CreditCard, Download, FileText, Filter,
  Heart, History, Instagram, LayoutDashboard, ListTodo, Loader2, LogOut, Mail, Menu,
  MessageCircle, MousePointer2, PanelsTopLeft, Pencil, Plus, RotateCw, Save, Search,
  Send, Settings, ShoppingBag, Sparkles, Star, Trash2, X, Zap,
};

export function FlowIcon({ name, size = 18, className = "" }: { name: string; size?: number; className?: string }) {
  const Icon = iconMap[name as keyof typeof iconMap] ?? Sparkles;
  return <Icon size={size} strokeWidth={1.7} className={className} aria-hidden="true" />;
}

export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`fk-brand ${small ? "fk-brand-small" : ""}`}>
      <svg className="fk-brand-symbol" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-label="">
        <path d="M8 8.25 21.9 15 8 21.75" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="8.25" r="2.1" fill="currentColor" />
        <circle cx="8" cy="21.75" r="2.1" fill="currentColor" />
        <circle cx="22" cy="15" r="2.5" fill="currentColor" />
      </svg>
      <span>flowkit<span className="fk-brand-ai">AI</span></span>
    </span>
  );
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  return (
    <header className="fk-topbar">
      <div className="fk-topbar-inner">
        <Link href="/" onClick={() => setOpen(false)} className="fk-logo-link"><BrandMark /></Link>
        <nav className={`fk-nav-links ${open ? "fk-nav-open" : ""}`} aria-label="Main navigation">
          <Link href="/workflows" onClick={() => setOpen(false)} className={location === "/workflows" ? "is-active" : ""}>Workflows</Link>
          <a href="/#how-it-works" onClick={() => setOpen(false)}>How it works</a>
          <Link href="/dashboard" onClick={() => setOpen(false)}>Workspace</Link>
          {user?.role === "admin" && <Link href="/admin" onClick={() => setOpen(false)}>Builder</Link>}
        </nav>
        <div className="fk-nav-actions">
          {user ? <Link className="fk-nav-user" href="/dashboard">{user.name?.split(" ")[0] || "Workspace"}<span className="fk-user-dot" /></Link> : <button className="fk-signin-link" onClick={() => startLogin()}>Sign in</button>}
          <Link className="fk-button fk-button-small fk-button-primary" href="/workflows">Explore <ArrowUpRight size={15} /></Link>
        </div>
        <button className="fk-menu-button" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}><FlowIcon name={open ? "X" : "Menu"} /></button>
      </div>
    </header>
  );
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  return <div className="fk-app"><SiteNav />{children}<footer className="fk-footer"><div className="fk-footer-inner"><BrandMark small /><span>Useful work, with fewer busywork hours.</span><div className="fk-footer-links"><Link href="/workflows">Marketplace</Link><Link href="/dashboard">Your workspace</Link><span>© {new Date().getFullYear()} FlowKit AI</span></div></div></footer></div>;
}

export function WorkflowCard({ workflow, compact = false }: { workflow: PublicWorkflow; compact?: boolean }) {
  return (
    <article className={`fk-workflow-card ${compact ? "fk-workflow-card-compact" : ""}`}>
      <div className="fk-card-topline"><span className="fk-icon-tile"><FlowIcon name={workflow.icon} size={18} /></span><span className={`fk-plan-pill ${workflow.pricing === "pro" ? "fk-plan-pro" : ""}`}>{workflow.pricing === "pro" ? "PRO" : "FREE"}</span></div>
      <div className="fk-card-copy"><div className="fk-card-category">{workflow.category}</div><h3>{workflow.name}</h3><p>{workflow.description}</p></div>
      <div className="fk-card-meta"><span><Star size={13} /> {workflow.rating > 0 ? workflow.rating.toFixed(1) : "Not rated yet"}</span><span><Clock3 size={13} /> Est. saves {workflow.timeSaved}</span><span>{workflow.usageCount.toLocaleString()} runs</span></div>
      <div className="fk-card-actions"><Link className="fk-button fk-button-quiet" href={`/workflow/${workflow.slug}`}>View workflow <ArrowRight size={15} /></Link><Link className="fk-button fk-button-outline" href={workflow.implemented ? `/workflow/${workflow.slug}/run` : `/workflow/${workflow.slug}`}>{workflow.implemented ? "Use workflow" : "Preview"}</Link></div>
    </article>
  );
}

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <div className="fk-eyebrow"><span className="fk-eyebrow-line" />{children}</div>;
}

export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="fk-page-title"><div>{eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action && <div className="fk-title-action">{action}</div>}</div>;
}

export function LoadingState({ label = "Loading your workspace" }: { label?: string }) {
  return <div className="fk-loading"><Loader2 className="fk-spin" size={20} /><span>{label}</span></div>;
}

export function EmptyState({ icon = "Sparkles", title, description, action }: { icon?: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="fk-empty"><span className="fk-icon-tile"><FlowIcon name={icon} size={20} /></span><h3>{title}</h3><p>{description}</p>{action}</div>;
}
