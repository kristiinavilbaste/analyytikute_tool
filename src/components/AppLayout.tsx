import { Outlet } from 'react-router-dom';
import { TopNavigation, WorkflowStepper } from './TopNavigation';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-ng-bg-soft">
      <TopNavigation />
      <WorkflowStepper />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
      <footer className="border-t border-ng-border bg-ng-bg py-6 text-center text-xs text-ng-muted">
        Analysis Review Board — Prototype v1.0
      </footer>
    </div>
  );
}
