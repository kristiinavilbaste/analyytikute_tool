interface AiErrorPanelProps {
  message: string;
  onUseMock: () => void;
  isLoading?: boolean;
}

export function AiErrorPanel({ message, onUseMock, isLoading = false }: AiErrorPanelProps) {
  return (
    <div className="rounded-xl border border-ng-red/30 bg-ng-red-soft px-4 py-4">
      <p className="text-sm font-medium text-ng-black">AI request failed</p>
      <p className="mt-1 text-sm text-ng-text">{message}</p>
      <button
        type="button"
        onClick={onUseMock}
        disabled={isLoading}
        className="btn-secondary mt-4"
      >
        Use mocked result instead
      </button>
    </div>
  );
}

interface AiLoadingPanelProps {
  message: string;
}

export function AiLoadingPanel({ message }: AiLoadingPanelProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <svg className="h-8 w-8 animate-spin text-ng-red" viewBox="0 0 24 24" fill="none">
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
      <p className="mt-4 max-w-md text-center text-sm text-ng-muted">{message}</p>
    </div>
  );
}
