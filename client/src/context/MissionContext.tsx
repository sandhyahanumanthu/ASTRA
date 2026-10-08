import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import type {
  TelemetryRecord,
  MissionPhase,
  SystemHealth,
} from "../types/telemetry";
import {
  API,
  API_URL,
  getTelemetry,
  postTelemetry,
  checkHealth,
} from "../api";

interface MissionContextType {
  // Mission Clock & State
  missionTime: string;
  missionSeconds: number;
  missionMode: "STANDBY" | "ACTIVE" | "PAUSED";
  startMission: () => void;
  pauseMission: () => void;
  resumeMission: () => void;
  resetMission: () => void;

  // Mission Phase
  phase: MissionPhase;
  setPhase: (phase: MissionPhase) => void;

  // Telemetry Stream & Data
  isStreaming: boolean;
  startAutoStream: () => void;
  stopAutoStream: () => void;
  toggleAutoStream: () => void;

  latestTelemetry: TelemetryRecord;
  history: TelemetryRecord[];
  sendCustomTelemetry: (payload: {
    temperature: number;
    pressure: number;
    vibration: number;
  }) => Promise<TelemetryRecord | null>;
  injectAnomaly: () => Promise<TelemetryRecord | null>;
  refreshHistory: () => Promise<void>;

  // System & Connection Status
  apiOnline: boolean | null;
  dbOnline: boolean | null;
  latency: number | null;
  lastSync: string;
  systemHealth: SystemHealth;
  transmittingState: "IDLE" | "TRANSMITTING" | "ANALYZING" | "SAVED" | "ERROR";
  errorMessage: string | null;
  clearError: () => void;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);

const INITIAL_TELEMETRY: TelemetryRecord = {
  temperature: 24.8,
  pressure: 34.6,
  vibration: 1.42,
  status: "NORMAL",
  riskLevel: "Low",
  cause: "All parameters operating within safe flight envelope",
  explanation:
    "Nominal telemetry: thermal, pressure, and vibrational levels are strictly within safe operational boundaries.",
  message: "All flight parameters operating nominal.",
  timestamp: new Date().toLocaleTimeString(),
  anomalies: { temperature: false, pressure: false, vibration: false },
};

export const MissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Mission Clock
  const [missionSeconds, setMissionSeconds] = useState<number>(145);
  const [missionMode, setMissionMode] = useState<"STANDBY" | "ACTIVE" | "PAUSED">("ACTIVE");
  const [phase, setPhase] = useState<MissionPhase>("ASCENT");

  // Mission Clock Timer
  useEffect(() => {
    let clockInterval: ReturnType<typeof setInterval> | null = null;
    if (missionMode === "ACTIVE") {
      clockInterval = setInterval(() => {
        setMissionSeconds((sec) => sec + 1);
      }, 1000);
    }
    return () => {
      if (clockInterval) clearInterval(clockInterval);
    };
  }, [missionMode]);

  const formatMissionTime = (sec: number): string => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `T+${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const startMission = () => setMissionMode("ACTIVE");
  const pauseMission = () => setMissionMode("PAUSED");
  const resumeMission = () => setMissionMode("ACTIVE");
  const resetMission = () => {
    setMissionMode("STANDBY");
    setMissionSeconds(0);
  };

  // 2. Telemetry State
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryRecord>(INITIAL_TELEMETRY);
  const [history, setHistory] = useState<TelemetryRecord[]>([INITIAL_TELEMETRY]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [transmittingState, setTransmittingState] = useState<
    "IDLE" | "TRANSMITTING" | "ANALYZING" | "SAVED" | "ERROR"
  >("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 3. System Connection
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [dbOnline, setDbOnline] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString());

  // Connection Health Check
  const checkConnection = useCallback(async () => {
    try {
      const startTime = performance.now();
      const health = await checkHealth();
      const elapsed = Math.round(performance.now() - startTime);
      setLatency(elapsed);
      setApiOnline(true);
      setDbOnline(health.mongodb === "connected");
      setLastSync(new Date().toLocaleTimeString());
    } catch {
      // Fallback check to root
      try {
        const startTime = performance.now();
        await API.get("/");
        setLatency(Math.round(performance.now() - startTime));
        setApiOnline(true);
        setDbOnline(false);
      } catch {
        setApiOnline(false);
        setDbOnline(false);
        setLatency(null);
      }
    }
  }, []);

  // Fetch telemetry history from backend
  const refreshHistory = useCallback(async () => {
    try {
      const records = await getTelemetry(30);
      if (Array.isArray(records) && records.length > 0) {
        const normalized: TelemetryRecord[] = records.map((item) => ({
          ...item,
          temperature: Number(item.temperature),
          pressure: Number(item.pressure),
          vibration: Number(item.vibration),
          timestamp: item.timestamp
            ? new Date(item.timestamp).toLocaleTimeString()
            : new Date().toLocaleTimeString(),
        }));
        setHistory(normalized);
        if (normalized[0]) {
          setLatestTelemetry(normalized[0]);
        }
      }
    } catch (err) {
      console.warn("[MissionContext] Could not fetch history:", err);
    }
  }, []);

  // Send custom telemetry
  const sendCustomTelemetry = async (payload: {
    temperature: number;
    pressure: number;
    vibration: number;
  }): Promise<TelemetryRecord | null> => {
    setTransmittingState("TRANSMITTING");
    setErrorMessage(null);

    const startTime = performance.now();
    try {
      setTimeout(() => setTransmittingState("ANALYZING"), 120);

      const record = await postTelemetry(payload);
      const resLatency = Math.round(performance.now() - startTime);
      setLatency(resLatency);
      setApiOnline(true);
      setLastSync(new Date().toLocaleTimeString());

      const normalized: TelemetryRecord = {
        ...record,
        temperature: Number(record.temperature),
        pressure: Number(record.pressure),
        vibration: Number(record.vibration),
        timestamp: record.timestamp
          ? new Date(record.timestamp).toLocaleTimeString()
          : new Date().toLocaleTimeString(),
      };

      setLatestTelemetry(normalized);
      setHistory((prev) => [normalized, ...prev.slice(0, 49)]);
      setTransmittingState("SAVED");

      setTimeout(() => {
        setTransmittingState("IDLE");
      }, 2000);

      return normalized;
    } catch (err: any) {
      console.error("[MissionContext] Telemetry POST Error:", err);
      setTransmittingState("ERROR");
      setApiOnline(false);

      const isNetworkError =
        !err.response ||
        err.code === "ERR_NETWORK" ||
        err.code === "ECONNABORTED" ||
        err.message === "Network Error";

      const msg = isNetworkError
        ? err.code === "ECONNABORTED"
          ? "Request Timeout: Backend is waking from cold sleep (Render free tier). Retrying..."
          : `API Connection Failed (${API_URL}). Backend is offline or spinning up.`
        : err?.response?.data?.message || err?.message || "Failed to transmit telemetry";

      setErrorMessage(msg);
      return null;
    }
  };

  // Inject Anomaly helper
  const injectAnomaly = async (): Promise<TelemetryRecord | null> => {
    // Generates an anomalous reading: high temperature (>44°C) + high vibration (>6.8 mm/s)
    const anomalousPayload = {
      temperature: Number((42.5 + Math.random() * 8).toFixed(1)),
      pressure: Number((32.0 + Math.random() * 5).toFixed(1)),
      vibration: Number((6.2 + Math.random() * 2.5).toFixed(2)),
    };
    return sendCustomTelemetry(anomalousPayload);
  };

  // Auto Stream Controls
  const startAutoStream = () => setIsStreaming(true);
  const stopAutoStream = () => setIsStreaming(false);
  const toggleAutoStream = () => setIsStreaming((s) => !s);

  // Auto Stream Effect (Runs every 3 seconds)
  const isStreamingRef = useRef(isStreaming);
  isStreamingRef.current = isStreaming;

  useEffect(() => {
    let streamInterval: ReturnType<typeof setInterval> | null = null;

    if (isStreaming) {
      const sendNextStreamPoint = () => {
        // Generate realistic fluctuations around current phase profile
        const isAnomalyOccurring = Math.random() < 0.25; // 25% chance of anomaly in auto-stream
        const temp = isAnomalyOccurring
          ? Number((36.5 + Math.random() * 10).toFixed(1))
          : Number((22.0 + Math.random() * 11).toFixed(1));
        const press = Number((30.0 + Math.random() * 14).toFixed(1));
        const vib = isAnomalyOccurring
          ? Number((5.2 + Math.random() * 3.5).toFixed(2))
          : Number((1.2 + Math.random() * 3.2).toFixed(2));

        sendCustomTelemetry({
          temperature: temp,
          pressure: press,
          vibration: vib,
        });
      };

      // Immediate first transmission
      sendNextStreamPoint();

      streamInterval = setInterval(() => {
        if (isStreamingRef.current) {
          sendNextStreamPoint();
        }
      }, 3000);
    }

    return () => {
      if (streamInterval) clearInterval(streamInterval);
    };
  }, [isStreaming]);

  // Periodic health check & history refresh every 5 seconds
  useEffect(() => {
    checkConnection();
    refreshHistory();

    const interval = setInterval(() => {
      checkConnection();
      if (!isStreamingRef.current) {
        refreshHistory();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [checkConnection, refreshHistory]);

  // Compute System Health
  const recentAnomalies = history.slice(0, 5).filter((r) => r.status === "ANOMALY").length;
  const systemHealth: SystemHealth =
    recentAnomalies >= 2 ? "CRITICAL" : recentAnomalies === 1 ? "DEGRADED" : "NORMAL";

  return (
    <MissionContext.Provider
      value={{
        missionTime: formatMissionTime(missionSeconds),
        missionSeconds,
        missionMode,
        startMission,
        pauseMission,
        resumeMission,
        resetMission,
        phase,
        setPhase,
        isStreaming,
        startAutoStream,
        stopAutoStream,
        toggleAutoStream,
        latestTelemetry,
        history,
        sendCustomTelemetry,
        injectAnomaly,
        refreshHistory,
        apiOnline,
        dbOnline,
        latency,
        lastSync,
        systemHealth,
        transmittingState,
        errorMessage,
        clearError: () => setErrorMessage(null),
      }}
    >
      {children}
    </MissionContext.Provider>
  );
};

export const useMission = (): MissionContextType => {
  const context = useContext(MissionContext);
  if (!context) {
    throw new Error("useMission must be used within a MissionProvider");
  }
  return context;
};
