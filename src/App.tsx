import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/AppLayout';
import { AnalysisInputPage } from './pages/AnalysisInputPage';
import { ReviewOverviewPage } from './pages/ReviewOverviewPage';
import { QualityGatePage } from './pages/QualityGatePage';
import { RiskRadarPage } from './pages/RiskRadarPage';
import { HandoffPage } from './pages/HandoffPage';
import { FigmaPromptPage } from './pages/FigmaPromptPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/input" replace />} />
            <Route path="/input" element={<AnalysisInputPage />} />
            <Route path="/review" element={<ReviewOverviewPage />} />
            <Route path="/quality-gate" element={<QualityGatePage />} />
            <Route path="/risk-radar" element={<RiskRadarPage />} />
            <Route path="/handoff" element={<HandoffPage />} />
            <Route path="/figma-prompt" element={<FigmaPromptPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
