import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminBuilder from "./pages/AdminBuilder";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import WorkflowDetail from "./pages/WorkflowDetail";
import WorkflowRunner from "./pages/WorkflowRunner";
import WorkflowsPage from "./pages/Workflows";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/workflows" component={WorkflowsPage} />
    <Route path="/workflow/:slug/run">{params => <WorkflowRunner slug={params.slug} />}</Route>
    <Route path="/workflow/:slug">{params => <WorkflowDetail slug={params.slug} />}</Route>
    <Route path="/dashboard/:section">{params => <Dashboard section={params.section} />}</Route>
    <Route path="/dashboard">{() => <Dashboard section="home" />}</Route>
    <Route path="/admin" component={AdminBuilder} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
