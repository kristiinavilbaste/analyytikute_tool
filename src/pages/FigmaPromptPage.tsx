import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EmptyState } from '../components/EmptyState';
import { CopyButton } from '../components/CopyButton';
import { PageHeader } from '../components/PageHeader';

export function FigmaPromptPage() {
  const { figmaPrompt, reviewResult, generateFigma, isFigmaPromptLoading } = useApp();

  useEffect(() => {
    if (reviewResult && !figmaPrompt && !isFigmaPromptLoading) {
      generateFigma();
    }
  }, [reviewResult, figmaPrompt, isFigmaPromptLoading, generateFigma]);

  if (!reviewResult) {
    return (
      <EmptyState message="Run the Review Board first to generate a Figma prompt." />
    );
  }

  if (!figmaPrompt) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <svg className="h-8 w-8 animate-spin text-ng-red" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="mt-4 text-sm text-ng-muted">Generating Figma prompt...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Figma Prompt"
          subtitle="Use this prompt in Figma Make or another AI design tool to generate a first prototype."
          align="left"
        />
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <CopyButton text={figmaPrompt} label="Copy Figma Prompt" variant="primary" />
          <Link to="/review" className="btn-neutral">
            Back to Review Overview
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ng-border bg-ng-bg">
        <div className="border-b border-ng-border bg-ng-bg-soft px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-ng-red/40" />
            <span className="h-2.5 w-2.5 rounded-full bg-ng-yellow/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-ng-green/60" />
            <span className="ml-2 text-xs font-medium text-ng-muted">figma-prompt.txt</span>
          </div>
        </div>

        <div className="max-h-[70vh] overflow-y-auto bg-ng-bg-soft p-6 sm:p-8">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-ng-black sm:text-sm">
            {figmaPrompt}
          </pre>
        </div>
      </div>
    </div>
  );
}
