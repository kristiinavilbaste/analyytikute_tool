import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SAMPLE_ANALYSIS } from '../data/sampleAnalysis';
import { PageHeader } from '../components/PageHeader';

export function AnalysisInputPage() {
  const navigate = useNavigate();
  const { analysisInput, setAnalysisInput, runReview, clearAll, isReviewLoading } = useApp();

  const handleRunReview = async () => {
    await runReview();
    navigate('/review');
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Analysis Input"
        subtitle="Paste your analysis document to begin the quality review workflow."
      />

      <div className="ng-card mt-8 p-6 sm:p-8">
        <textarea
          value={analysisInput}
          onChange={(e) => setAnalysisInput(e.target.value)}
          placeholder="Paste your analysis document here..."
          className="min-h-[360px] w-full resize-none rounded-xl border border-ng-border bg-ng-bg-soft p-5 text-sm leading-relaxed text-ng-text placeholder:text-ng-muted focus:border-ng-red focus:bg-ng-bg focus:outline-none focus:ring-2 focus:ring-ng-red/20"
          disabled={isReviewLoading}
        />

        <p className="mt-4 text-sm text-ng-muted">
          Paste analysis notes, user stories, requirements or workshop summary.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setAnalysisInput(SAMPLE_ANALYSIS)}
            disabled={isReviewLoading}
            className="btn-neutral"
          >
            Load sample analysis
          </button>
          <button
            type="button"
            onClick={handleRunReview}
            disabled={isReviewLoading || !analysisInput.trim()}
            className="btn-primary"
          >
            {isReviewLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running review...
              </span>
            ) : (
              'Run Review Board'
            )}
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={isReviewLoading}
            className="btn-neutral text-ng-muted"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}
