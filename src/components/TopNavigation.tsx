import { Link, useLocation } from 'react-router-dom';
import { WORKFLOW_STEPS } from '../data/workflowSteps';

export function TopNavigation() {
  return (
    <header className="border-b border-ng-border bg-ng-bg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/input" className="block">
          <h1 className="text-lg font-bold tracking-tight text-ng-black">Analysis Review Board</h1>
          <p className="hidden text-xs text-ng-muted sm:block">AI-assisted analysis quality review</p>
        </Link>
        <div className="flex items-center gap-2 rounded-full border border-ng-border bg-ng-bg-soft px-3 py-1.5 text-xs font-medium text-ng-muted">
          <span className="h-2 w-2 animate-pulse-ring rounded-full bg-ng-green" />
          Demo mode — mocked AI
        </div>
      </div>
    </header>
  );
}

export function WorkflowStepper() {
  const location = useLocation();
  const currentPath = location.pathname === '/' ? '/input' : location.pathname;

  return (
    <nav className="border-b border-ng-border bg-ng-bg">
      <div className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
        <ol className="flex min-w-max items-center gap-1 py-3">
          {WORKFLOW_STEPS.map((step, index) => {
            const isActive = currentPath === step.path;
            const isPast =
              WORKFLOW_STEPS.findIndex((s) => s.path === currentPath) > index;

            return (
              <li key={step.path} className="flex items-center">
                {index > 0 && (
                  <svg className="mx-1 h-4 w-4 shrink-0 text-ng-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
                <Link
                  to={step.path}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ng-red/30 ${
                    isActive
                      ? 'bg-ng-red text-white'
                      : isPast
                        ? 'text-ng-red hover:bg-ng-red-soft'
                        : 'text-ng-muted hover:bg-ng-bg-soft hover:text-ng-text'
                  }`}
                >
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{step.shortLabel}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
