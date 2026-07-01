import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from 'react';
import type { AppState, ReviewResult, HandoffPack } from '../types';
import { runReviewBoard, generateHandoffPack, generateFigmaPrompt } from '../services/reviewService';

const STORAGE_KEY = 'arb-app-state';

interface AppContextValue extends AppState {
  isReviewLoading: boolean;
  isHandoffLoading: boolean;
  isFigmaPromptLoading: boolean;
  setAnalysisInput: (value: string) => void;
  runReview: () => Promise<ReviewResult | null>;
  generateHandoff: () => Promise<HandoffPack | null>;
  generateFigma: () => Promise<string | null>;
  clearAll: () => void;
}

const defaultState: AppState = {
  analysisInput: '',
  reviewResult: null,
  handoffPack: null,
  figmaPrompt: '',
};

const AppContext = createContext<AppContextValue | null>(null);

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultState;
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isHandoffLoading, setIsHandoffLoading] = useState(false);
  const [isFigmaPromptLoading, setIsFigmaPromptLoading] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setAnalysisInput = useCallback((value: string) => {
    setState((s) => ({ ...s, analysisInput: value }));
  }, []);

  const runReview = useCallback(async () => {
    setIsReviewLoading(true);
    try {
      const result = await runReviewBoard(state.analysisInput);
      setState((s) => ({
        ...s,
        reviewResult: result,
        handoffPack: null,
        figmaPrompt: '',
      }));
      return result;
    } finally {
      setIsReviewLoading(false);
    }
  }, [state.analysisInput]);

  const generateHandoff = useCallback(async () => {
    setIsHandoffLoading(true);
    try {
      const pack = await generateHandoffPack(state.analysisInput);
      setState((s) => ({ ...s, handoffPack: pack }));
      return pack;
    } finally {
      setIsHandoffLoading(false);
    }
  }, [state.analysisInput]);

  const generateFigma = useCallback(async () => {
    setIsFigmaPromptLoading(true);
    try {
      const prompt = await generateFigmaPrompt(
        state.analysisInput,
        state.reviewResult ?? undefined,
      );
      setState((s) => ({ ...s, figmaPrompt: prompt }));
      return prompt;
    } finally {
      setIsFigmaPromptLoading(false);
    }
  }, [state.analysisInput, state.reviewResult]);

  const clearAll = useCallback(() => {
    setState(defaultState);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AppContext.Provider
      value={{
        ...state,
        isReviewLoading,
        isHandoffLoading,
        isFigmaPromptLoading,
        setAnalysisInput,
        runReview,
        generateHandoff,
        generateFigma,
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
