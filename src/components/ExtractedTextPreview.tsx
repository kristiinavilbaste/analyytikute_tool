import { SectionTitle } from './PageHeader';

interface ExtractedTextPreviewProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showEmptyHint?: boolean;
}

export function ExtractedTextPreview({
  value,
  onChange,
  disabled = false,
  showEmptyHint = false,
}: ExtractedTextPreviewProps) {
  return (
    <section className="mt-8">
      <SectionTitle className="mb-4">Extracted analysis text</SectionTitle>

      {showEmptyHint && (
        <p className="mb-3 text-sm text-ng-muted">
          Upload files or paste analysis text to begin.
        </p>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your analysis document here, or upload files above..."
        className="min-h-[320px] w-full resize-y rounded-xl border border-ng-border bg-ng-bg-soft p-5 text-sm leading-relaxed text-ng-text placeholder:text-ng-muted focus:border-ng-red focus:bg-ng-bg focus:outline-none focus:ring-2 focus:ring-ng-red/20"
        disabled={disabled}
      />

      <p className="mt-3 text-sm text-ng-muted">
        Review and edit the extracted text before running the Review Board. Manual edits are
        preserved when you run the review.
      </p>
    </section>
  );
}
