import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { SAMPLE_ANALYSIS } from '../data/sampleAnalysis';
import { PageHeader } from '../components/PageHeader';
import { FileUploadInput } from '../components/FileUploadInput';
import { UploadedFileList } from '../components/UploadedFileList';
import { ExtractedTextPreview } from '../components/ExtractedTextPreview';
import { AiErrorPanel } from '../components/AiStatusPanel';

export function AnalysisInputPage() {
  const navigate = useNavigate();
  const {
    analysisInput,
    uploadedFiles,
    setAnalysisInput,
    addUploadedFiles,
    removeUploadedFile,
    clearUploadedFiles,
    runReview,
    runReviewWithMock,
    clearAll,
    isReviewLoading,
    isExtracting,
    reviewError,
  } = useApp();

  const isBusy = isReviewLoading || isExtracting;
  const hasInput = analysisInput.trim().length > 0;
  const showEmptyHint = !hasInput && uploadedFiles.length === 0;

  const handleRunReview = async () => {
    const result = await runReview();
    if (result) {
      navigate('/review');
    }
  };

  const handleUseMockReview = async () => {
    const result = await runReviewWithMock();
    if (result) {
      navigate('/review');
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Analysis Input"
        subtitle="Upload analysis files or paste text to begin the quality review workflow."
      />

      <div className="ng-card mt-8 p-6 sm:p-8">
        <FileUploadInput
          onFilesSelected={addUploadedFiles}
          existingFiles={uploadedFiles}
          disabled={isBusy}
        />

        <UploadedFileList
          files={uploadedFiles}
          onRemove={removeUploadedFile}
          disabled={isBusy}
        />

        <ExtractedTextPreview
          value={analysisInput}
          onChange={setAnalysisInput}
          disabled={isReviewLoading}
          showEmptyHint={showEmptyHint}
        />

        {!hasInput && uploadedFiles.some((f) => f.status === 'failed') && (
          <p className="mt-4 text-sm text-ng-red" role="alert">
            One or more files failed extraction. Fix or remove them, or paste analysis text
            manually to continue.
          </p>
        )}

        {reviewError && (
          <div className="mt-4">
            <AiErrorPanel
              message={reviewError}
              onUseMock={handleUseMockReview}
              isLoading={isReviewLoading}
            />
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setAnalysisInput(SAMPLE_ANALYSIS)}
            disabled={isBusy}
            className="btn-neutral"
          >
            Load sample analysis
          </button>
          <button
            type="button"
            onClick={handleRunReview}
            disabled={isBusy || !hasInput}
            className="btn-primary"
            title={!hasInput ? 'Upload files or paste analysis text to begin.' : undefined}
          >
            {isReviewLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Review Board is analysing your documentation…
              </span>
            ) : (
              'Run Review Board'
            )}
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={isBusy}
            className="btn-neutral text-ng-muted"
          >
            Clear
          </button>
          {uploadedFiles.length > 0 && (
            <button
              type="button"
              onClick={clearUploadedFiles}
              disabled={isBusy}
              className="btn-neutral text-ng-muted"
            >
              Clear uploaded files
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
