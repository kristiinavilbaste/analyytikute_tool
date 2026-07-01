import { useState, useCallback } from 'react';

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  variant?: 'primary' | 'secondary' | 'neutral';
  className?: string;
}

export function CopyButton({
  text,
  label = 'Copy',
  copiedLabel = 'Copied!',
  variant = 'secondary',
  className = '',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'secondary'
        ? 'btn-secondary'
        : 'btn-neutral';

  return (
    <button type="button" onClick={handleCopy} className={`${variantClass} ${className}`}>
      {copied ? (
        <span className="inline-flex items-center gap-2">
          <svg className="h-4 w-4 text-ng-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {copiedLabel}
        </span>
      ) : (
        <span className="inline-flex items-center gap-2">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {label}
        </span>
      )}
    </button>
  );
}
