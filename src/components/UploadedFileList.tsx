import type { UploadedAnalysisFile, FileExtractionStatus } from '../types';
import { formatFileSize, formatFileType } from '../services/fileExtractionService';

interface UploadedFileListProps {
  files: UploadedAnalysisFile[];
  onRemove: (id: string) => void;
  disabled?: boolean;
}

const statusLabels: Record<FileExtractionStatus, string> = {
  pending: 'Pending',
  extracting: 'Extracting',
  ready: 'Ready',
  failed: 'Failed',
};

const statusStyles: Record<FileExtractionStatus, string> = {
  pending: 'bg-ng-bg-soft text-ng-muted ring-ng-border',
  extracting: 'bg-ng-yellow-soft text-ng-orange ring-ng-yellow/40',
  ready: 'bg-ng-green-soft text-ng-green ring-ng-green/20',
  failed: 'bg-ng-red-soft text-ng-red ring-ng-red/20',
};

export function UploadedFileList({ files, onRemove, disabled = false }: UploadedFileListProps) {
  if (files.length === 0) return null;

  return (
    <section className="mt-6">
      <h4 className="text-sm font-semibold text-ng-black">Uploaded files</h4>
      <ul className="mt-3 space-y-2">
        {files.map((file) => (
          <li
            key={file.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-ng-border bg-ng-bg px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ng-text">{file.name}</p>
              <p className="mt-0.5 text-xs text-ng-muted">
                {formatFileType(file.name)} · {formatFileSize(file.size)}
              </p>
              {file.error && (
                <p className="mt-1 text-xs text-ng-red" role="alert">
                  {file.error}
                </p>
              )}
            </div>

            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[file.status]}`}
            >
              {file.status === 'extracting' ? (
                <span className="flex items-center gap-1.5">
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
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
                  Extracting
                </span>
              ) : (
                statusLabels[file.status]
              )}
            </span>

            <button
              type="button"
              onClick={() => onRemove(file.id)}
              disabled={disabled || file.status === 'extracting'}
              className="rounded-lg border border-ng-border px-3 py-1.5 text-xs font-medium text-ng-muted transition hover:border-ng-red/40 hover:text-ng-red disabled:opacity-50"
              aria-label={`Remove ${file.name}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
