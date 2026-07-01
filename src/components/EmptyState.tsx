import { Link } from 'react-router-dom';

interface EmptyStateProps {
  message?: string;
  actionLabel?: string;
  actionTo?: string;
}

export function EmptyState({
  message = 'No review has been generated yet.',
  actionLabel = 'Go to Analysis Input',
  actionTo = '/input',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ng-border bg-ng-bg px-8 py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-ng-bg-soft text-3xl">
        <span className="ng-asterisk text-4xl">*</span>
      </div>
      <h2 className="text-lg font-semibold text-ng-black">{message}</h2>
      <p className="mt-2 max-w-md text-sm text-ng-muted">
        Paste an analysis document and run the review board to unlock this section.
      </p>
      <Link to={actionTo} className="btn-primary mt-6">
        {actionLabel}
      </Link>
    </div>
  );
}
