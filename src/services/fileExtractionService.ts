import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import type { FileExtractionResult } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export const SUPPORTED_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.xls', '.txt', '.md'] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const LARGE_FILE_WARNING_BYTES = 5 * 1024 * 1024;

const EXTENSION_MIME_MAP: Record<string, string[]> = {
  '.pdf': ['application/pdf'],
  '.docx': [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  '.xlsx': [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  '.xls': ['application/vnd.ms-excel'],
  '.txt': ['text/plain'],
  '.md': ['text/markdown', 'text/plain'],
};

export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot === -1) return '';
  return fileName.slice(dot).toLowerCase();
}

export function isSupportedFile(file: File): boolean {
  const ext = getFileExtension(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
    return false;
  }
  const allowedMimes = EXTENSION_MIME_MAP[ext];
  if (!allowedMimes || !file.type) return true;
  return allowedMimes.includes(file.type) || file.type === 'application/octet-stream';
}

export function getUnsupportedFileMessage(fileName: string): string {
  return `"${fileName}" is not a supported format. Supported: PDF, DOCX, XLSX, XLS, TXT, MD.`;
}

export function getLargeFileWarning(fileName: string): string {
  return `"${fileName}" is large. For demo purposes, use reasonably sized text-based documents.`;
}

export function isDuplicateFile(
  file: File,
  existing: { name: string; size: number }[],
): boolean {
  return existing.some((f) => f.name === file.name && f.size === file.size);
}

export async function extractTextFromFile(file: File): Promise<string> {
  const ext = getFileExtension(file.name);

  switch (ext) {
    case '.pdf':
      return extractTextFromPdf(file);
    case '.docx':
      return extractTextFromDocx(file);
    case '.xlsx':
    case '.xls':
      return extractTextFromExcel(file);
    case '.txt':
    case '.md':
      return extractTextFromPlainText(file);
    default:
      throw new Error(getUnsupportedFileMessage(file.name));
  }
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    pageTexts.push(pageText);
  }

  const text = pageTexts.join('\n\n').trim();
  if (!text) {
    throw new Error(
      'No readable text found in this PDF. Scanned PDFs are not supported in this demo version.',
    );
  }

  return text;
}

export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value.trim();

  if (!text) {
    throw new Error('No readable text found in this Word document.');
  }

  return text;
}

export async function extractTextFromExcel(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const sheetSections: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    }) as (string | number | boolean | null)[][];

    const nonEmptyRows = rows.filter((row) =>
      row.some((cell) => String(cell ?? '').trim() !== ''),
    );

    if (nonEmptyRows.length === 0) continue;

    const rowLines = nonEmptyRows.map((row) =>
      row.map((cell) => String(cell ?? '').trim()).join('\t'),
    );

    sheetSections.push(`Sheet: ${sheetName}\n${rowLines.join('\n')}`);
  }

  const text = sheetSections.join('\n\n').trim();
  if (!text) {
    throw new Error('No readable content found in this Excel file.');
  }

  return text;
}

export async function extractTextFromPlainText(file: File): Promise<string> {
  const text = (await file.text()).trim();
  if (!text) {
    throw new Error('The file appears to be empty.');
  }
  return text;
}

export function combineExtractedTexts(
  results: Pick<FileExtractionResult, 'fileName' | 'text'>[],
): string {
  return results
    .filter((r) => r.text.trim())
    .map((r) => `--- Source: ${r.fileName} ---\n\n${r.text.trim()}`)
    .join('\n\n');
}

export function formatFileType(fileName: string): string {
  const ext = getFileExtension(fileName).replace('.', '').toUpperCase();
  return ext || 'UNKNOWN';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
