import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MissionProvider } from "./context/MissionContext";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { TelemetryPage } from "./pages/TelemetryPage";
import { InvestigationPage } from "./pages/InvestigationPage";
import { ReportsPage } from "./pages/ReportsPage";

export default function App() {
  return (
    <MissionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/telemetry" element={<TelemetryPage />} />
          <Route path="/investigation" element={<InvestigationPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </MissionProvider>
  );
}