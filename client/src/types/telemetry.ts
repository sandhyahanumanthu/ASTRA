export type TelemetryStatus = "NORMAL" | "ANOMALY";
export type RiskLevel = "Low" | "Medium" | "High";
export type SystemHealth = "NORMAL" | "DEGRADED" | "CRITICAL";
export type MissionPhase = "PRE-LAUNCH" | "LAUNCH" | "ASCENT" | "CRUISE" | "DESCENT";

export interface TelemetryRecord {
  _id?: string;
  temperature: number;
  pressure: number;
  vibration: number;
  status: TelemetryStatus;
  riskLevel: RiskLevel | string;
  cause?: string;
  explanation?: string;
  message?: string;
  timestamp: string;
  anomalies?: {
    temperature: boolean;
    pressure: boolean;
    vibration: boolean;
  };
}

export interface TelemetryInputs {
  temperature: number | string;
  pressure: number | string;
  vibration: number | string;
}

export interface HealthResponse {
  status: string;
  service: string;
  uptime: string;
  mongodb: "connected" | "disconnected";
  timestamp: string;
}

export interface DiagnosticHypothesis {
  id: string;
  title: string;
  confidence: number;
  status: "PRIMARY" | "SECONDARY" | "CANDIDATE" | "NOMINAL";
  summary: string;
  evidenceFor: string[];
  evidenceAgainst: string[];
  recommendedAction: string;
}

export interface CauseChainStep {
  step: string;
  description: string;
}

export interface InvestigationCase {
  id: string;
  recordId: string;
  timestamp: string;
  telemetry: {
    temperature: number;
    pressure: number;
    vibration: number;
  };
  event: string;
  explanation?: string;
  severity: "NORMAL" | "WARNING" | "CRITICAL";
  status: "UNDER INVESTIGATION" | "DIAGNOSED" | "DOCUMENTED";
  correlated: boolean;
  hypotheses: DiagnosticHypothesis[];
  causeChain: CauseChainStep[];
}

export interface SimulationResult {
  mode: string;
  disclaimer: string;
  inputs: {
    temperature: number;
    pressure: number;
    vibration: number;
  };
  classification: "NORMAL" | "WARNING" | "CRITICAL";
  status: TelemetryStatus;
  riskLevel: RiskLevel;
  cause: string;
  explanation: string;
  safetyMargins: {
    thermalMargin: string;
    vibrationMargin: string;
    pressureMargin: string;
  };
  hypotheses: DiagnosticHypothesis[];
  timestamp: string;
}

export interface TelemetrySummary {
  totalRecords: number;
  anomalyCount: number;
  normalCount: number;
  anomalyRate: string;
  averages: {
    temperature: number;
    pressure: number;
    vibration: number;
  };
  systemHealth: SystemHealth;
  database: "CONNECTED" | "FALLBACK_IN_MEMORY";
  timestamp: string;
}

export interface HumanFeedback {
  caseId: string;
  validation: "CONFIRMED" | "REJECTED";
  feedbackReason?: string;
  notes?: string;
  timestamp?: string;
}
