import { createContext, useContext, useCallback, useState, useEffect, useRef, type ReactNode } from 'react';
import type { AppState, ReviewResult, HandoffPack, UploadedAnalysisFile } from '../types';
import { runReviewBoard, generateHandoffPack, generateFigmaPrompt } from '../services/reviewService';
import { AiServiceError } from '../services/aiReviewService';
import {
  extractTextFromFile,
  combineExtractedTexts,
} from '../services/fileExtractionService';

const STORAGE_KEY = 'arb-app-state';

interface AppContextValue extends AppState {
  isReviewLoading: boolean;
  isHandoffLoading: boolean;
  isFigmaPromptLoading: boolean;
  isExtracting: boolean;
  reviewError: string | null;
  handoffError: string | null;
  figmaError: string | null;
  setAnalysisInput: (value: string) => void;
  addUploadedFiles: (files: File[]) => void;
  removeUploadedFile: (id: string) => void;
  clearUploadedFiles: () => void;
  runReview: () => Promise<ReviewResult | null>;
  runReviewWithMock: () => Promise<ReviewResult | null>;
  generateHandoff: () => Promise<HandoffPack | null>;
  generateHandoffWithMock: () => Promise<HandoffPack | null>;
  generateFigma: () => Promise<string | null>;
  generateFigmaWithMock: () => Promise<string | null>;
  clearAll: () => void;
}

const defaultState: AppState = {
  analysisInput: '',
  extractedText: '',
  uploadedFiles: [],
  reviewResult: null,
  handoffPack: null,
  figmaPrompt: '',
};

const AppContext = createContext<AppContextValue | null>(null);

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return {
        ...defaultState,
        analysisInput: parsed.analysisInput ?? '',
        extractedText: parsed.extractedText ?? '',
        uploadedFiles: parsed.uploadedFiles ?? [],
        reviewResult: parsed.reviewResult ?? null,
        handoffPack: parsed.handoffPack ?? null,
        figmaPrompt: parsed.figmaPrompt ?? '',
      };
    }
  } catch {
    /* ignore */
  }
  return defaultState;
}

function saveState(state: AppState) {
  try {
    const toPersist = {
      analysisInput: state.analysisInput,
      extractedText: state.extractedText,
      uploadedFiles: state.uploadedFiles.map(({ id, name, type, size, status, error }) => ({
        id,
        name,
        type,
        size,
        status: status === 'extracting' ? 'pending' : status,
        error,
      })),
      reviewResult: state.reviewResult,
      handoffPack: state.handoffPack,
      figmaPrompt: state.figmaPrompt,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
  } catch {
    /* ignore */
  }
}

function createUploadedFileEntry(file: File): UploadedAnalysisFile {
  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    status: 'pending',
  };
}

function buildCombinedText(files: UploadedAnalysisFile[]): string {
  const readyResults = files
    .filter((f) => f.status === 'ready' && f.extractedText?.trim())
    .map((f) => ({ fileName: f.name, text: f.extractedText! }));

  return combineExtractedTexts(readyResults);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AiServiceError) return error.message;
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred.';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isHandoffLoading, setIsHandoffLoading] = useState(false);
  const [isFigmaPromptLoading, setIsFigmaPromptLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);
  const [figmaError, setFigmaError] = useState<string | null>(null);
  const fileObjectsRef = useRef<Map<string, File>>(new Map());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const extractFile = useCallback(
    async (entry: UploadedAnalysisFile, file: File) => {
      setState((s) => ({
        ...s,
        uploadedFiles: s.uploadedFiles.map((f) =>
          f.id === entry.id ? { ...f, status: 'extracting' as const, error: undefined } : f,
        ),
      }));

      try {
        const text = await extractTextFromFile(file);
        setState((s) => {
          const updatedFiles = s.uploadedFiles.map((f) =>
            f.id === entry.id
              ? { ...f, status: 'ready' as const, extractedText: text, error: undefined }
              : f,
          );
          const combined = buildCombinedText(updatedFiles);
          return {
            ...s,
            uploadedFiles: updatedFiles,
            extractedText: combined,
            analysisInput: combined,
          };
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to extract text from file.';
        setState((s) => ({
          ...s,
          uploadedFiles: s.uploadedFiles.map((f) =>
            f.id === entry.id ? { ...f, status: 'failed' as const, error: message } : f,
          ),
        }));
      }
    },
    [],
  );

  const addUploadedFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const newEntries = files.map(createUploadedFileEntry);
      files.forEach((file, index) => {
        fileObjectsRef.current.set(newEntries[index].id, file);
      });

      setState((s) => ({
        ...s,
        uploadedFiles: [...s.uploadedFiles, ...newEntries],
      }));

      setIsExtracting(true);
      void (async () => {
        for (let i = 0; i < newEntries.length; i++) {
          const entry = newEntries[i];
          const file = files[i];
          await extractFile(entry, file);
        }
        setIsExtracting(false);
      })();
    },
    [extractFile],
  );

  const removeUploadedFile = useCallback(
    (id: string) => {
      fileObjectsRef.current.delete(id);
      setState((s) => {
        const updatedFiles = s.uploadedFiles.filter((f) => f.id !== id);
        const combined = buildCombinedText(updatedFiles);
        return {
          ...s,
          uploadedFiles: updatedFiles,
          extractedText: combined,
          analysisInput: combined,
        };
      });
    },
    [],
  );

  const clearUploadedFiles = useCallback(() => {
    fileObjectsRef.current.clear();
    setState((s) => ({
      ...s,
      uploadedFiles: [],
      extractedText: '',
      analysisInput: '',
    }));
  }, []);

  const setAnalysisInput = useCallback((value: string) => {
    setState((s) => ({ ...s, analysisInput: value }));
  }, []);

  const runReview = useCallback(async () => {
    setIsReviewLoading(true);
    setReviewError(null);
    try {
      const result = await runReviewBoard(state.analysisInput);
      setState((s) => ({
        ...s,
        reviewResult: result,
        handoffPack: null,
        figmaPrompt: '',
      }));
      setHandoffError(null);
      setFigmaError(null);
      return result;
    } catch (error) {
      setReviewError(getErrorMessage(error));
      return null;
    } finally {
      setIsReviewLoading(false);
    }
  }, [state.analysisInput]);

  const runReviewWithMock = useCallback(async () => {
    setIsReviewLoading(true);
    setReviewError(null);
    try {
      const result = await runReviewBoard(state.analysisInput, { forceMock: true });
      setState((s) => ({
        ...s,
        reviewResult: result,
        handoffPack: null,
        figmaPrompt: '',
      }));
      setHandoffError(null);
      setFigmaError(null);
      return result;
    } catch (error) {
      setReviewError(getErrorMessage(error));
      return null;
    } finally {
      setIsReviewLoading(false);
    }
  }, [state.analysisInput]);

  const generateHandoff = useCallback(async () => {
    if (!state.reviewResult) return null;

    setIsHandoffLoading(true);
    setHandoffError(null);
    try {
      const pack = await generateHandoffPack(state.analysisInput, state.reviewResult);
      setState((s) => ({ ...s, handoffPack: pack }));
      return pack;
    } catch (error) {
      setHandoffError(getErrorMessage(error));
      return null;
    } finally {
      setIsHandoffLoading(false);
    }
  }, [state.analysisInput, state.reviewResult]);

  const generateHandoffWithMock = useCallback(async () => {
    setIsHandoffLoading(true);
    setHandoffError(null);
    try {
      const pack = await generateHandoffPack(state.analysisInput, state.reviewResult ?? undefined, {
        forceMock: true,
      });
      setState((s) => ({ ...s, handoffPack: pack }));
      return pack;
    } catch (error) {
      setHandoffError(getErrorMessage(error));
      return null;
    } finally {
      setIsHandoffLoading(false);
    }
  }, [state.analysisInput, state.reviewResult]);

  const generateFigma = useCallback(async () => {
    if (!state.reviewResult) return null;

    setIsFigmaPromptLoading(true);
    setFigmaError(null);
    try {
      const prompt = await generateFigmaPrompt(state.analysisInput, state.reviewResult);
      setState((s) => ({ ...s, figmaPrompt: prompt }));
      return prompt;
    } catch (error) {
      setFigmaError(getErrorMessage(error));
      return null;
    } finally {
      setIsFigmaPromptLoading(false);
    }
  }, [state.analysisInput, state.reviewResult]);

  const generateFigmaWithMock = useCallback(async () => {
    setIsFigmaPromptLoading(true);
    setFigmaError(null);
    try {
      const prompt = await generateFigmaPrompt(
        state.analysisInput,
        state.reviewResult ?? undefined,
        { forceMock: true },
      );
      setState((s) => ({ ...s, figmaPrompt: prompt }));
      return prompt;
    } catch (error) {
      setFigmaError(getErrorMessage(error));
      return null;
    } finally {
      setIsFigmaPromptLoading(false);
    }
  }, [state.analysisInput, state.reviewResult]);

  const clearAll = useCallback(() => {
    fileObjectsRef.current.clear();
    setState(defaultState);
    setReviewError(null);
    setHandoffError(null);
    setFigmaError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        isReviewLoading,
        isHandoffLoading,
        isFigmaPromptLoading,
        isExtracting,
        reviewError,
        handoffError,
        figmaError,
        setAnalysisInput,
        addUploadedFiles,
        removeUploadedFile,
        clearUploadedFiles,
        runReview,
        runReviewWithMock,
        generateHandoff,
        generateHandoffWithMock,
        generateFigma,
        generateFigmaWithMock,
        clearAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
