import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { SectionTitle } from './PageHeader';
import {
  isSupportedFile,
  getUnsupportedFileMessage,
  getLargeFileWarning,
  isDuplicateFile,
  MAX_FILE_SIZE_BYTES,
  LARGE_FILE_WARNING_BYTES,
} from '../services/fileExtractionService';

interface FileUploadInputProps {
  onFilesSelected: (files: File[]) => void;
  existingFiles: { name: string; size: number }[];
  disabled?: boolean;
}

export function FileUploadInput({
  onFilesSelected,
  existingFiles,
  disabled = false,
}: FileUploadInputProps) {
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);

  const processFiles = useCallback(
    (incoming: File[]) => {
      if (incoming.length === 0) return;

      const errors: string[] = [];
      const warnings: string[] = [];
      const accepted: File[] = [];
      const seen = [...existingFiles];

      for (const file of incoming) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          errors.push(
            `"${file.name}" exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB limit for this demo.`,
          );
          continue;
        }

        if (!isSupportedFile(file)) {
          errors.push(getUnsupportedFileMessage(file.name));
          continue;
        }

        if (isDuplicateFile(file, seen)) {
          errors.push(`"${file.name}" is already uploaded.`);
          continue;
        }

        if (file.size > LARGE_FILE_WARNING_BYTES) {
          warnings.push(getLargeFileWarning(file.name));
        }

        accepted.push(file);
        seen.push({ name: file.name, size: file.size });
      }

      setValidationMessage(errors.length > 0 ? errors.join(' ') : null);
      setSizeWarning(warnings.length > 0 ? warnings.join(' ') : null);

      if (accepted.length > 0) {
        onFilesSelected(accepted);
      }
    },
    [existingFiles, onFilesSelected],
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } = useDropzone({
    onDrop: processFiles,
    disabled,
    noClick: true,
    noKeyboard: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/plain': ['.txt', '.md'],
    },
  });

  const borderClass = isDragReject
    ? 'border-ng-red bg-ng-red-soft'
    : isDragActive
      ? 'border-ng-red bg-ng-red-soft'
      : 'border-ng-border bg-ng-bg-soft hover:border-ng-red/60';

  return (
    <section>
      <SectionTitle className="mb-4">Upload analysis files</SectionTitle>

      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors ${borderClass} ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-default'}`}
      >
        <input {...getInputProps()} />

        <p className="text-sm font-medium text-ng-text">
          {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
        </p>
        <p className="mt-2 text-sm text-ng-muted">
          Upload PDF, Word or Excel files. You can also paste text manually below.
        </p>
        <p className="mt-1 text-xs text-ng-muted">
          Supported: PDF, DOCX, XLSX, XLS, TXT, MD
        </p>
        <p className="mt-1 text-xs text-ng-muted">
          For demo purposes, use reasonably sized text-based documents.
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            open();
          }}
          disabled={disabled}
          className="btn-secondary mt-5"
        >
          Choose files
        </button>
      </div>

      {validationMessage && (
        <p className="mt-3 text-sm text-ng-red" role="alert">
          {validationMessage}
        </p>
      )}

      {sizeWarning && !validationMessage && (
        <p className="mt-3 text-sm text-ng-orange" role="status">
          {sizeWarning}
        </p>
      )}
    </section>
  );
}
