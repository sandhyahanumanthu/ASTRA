import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer,
  Gauge,
  Activity,
  Send,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldCheck,
  Radio,
  AlertCircle,
  Globe,
  WifiOff,
  Sparkles,
} from "lucide-react";
import axios from "axios";
import { API_URL } from "../api";
import { TelemetryCharts } from "../components/TelemetryCharts";

export interface TelemetryResponse {
  status: "NORMAL" | "ANOMALY";
  temperature: number;
  pressure: number;
  vibration: number;
  timestamp: string;
  message: string;
  riskLevel?: "Low" | "Medium" | "High" | string;
  cause?: string;
  explanation?: string;
}

export interface TelemetryInputs {
  temperature: number | string;
  pressure: number | string;
  vibration: number | string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // 1. Input fields state
  const [inputs, setInputs] = useState<TelemetryInputs>({
    temperature: 25.0,
    pressure: 35.0,
    vibration: 1.5,
  });

  // 2. Loading state
  const [loading, setLoading] = useState<boolean>(false);

  // 3. Result / Telemetry Response state
  const [result, setResult] = useState<TelemetryResponse>({
    status: "NORMAL",
    temperature: 25.0,
    pressure: 35.0,
    vibration: 1.5,
    timestamp: new Date().toLocaleTimeString(),
    message: "All flight parameters operating nominal.",
    riskLevel: "Low",
    cause: "All parameters operating within safe flight envelope",
    explanation: "Nominal telemetry: thermal, pressure, and vibrational levels are strictly within safe operational boundaries.",
  });

  // 4. Auto Stream state
  const [isStreaming, setIsStreaming] = useState<boolean>(false);

  // 5. Error & Connection states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // 6. History log state (last 10 records)
  const [history, setHistory] = useState<TelemetryResponse[]>([]);

  // Statistics counters
  const [normalCount, setNormalCount] = useState<number>(1);
  const [anomalyCount, setAnomalyCount] = useState<number>(0);

  // Ping backend server to verify connection
  const checkServerStatus = async () => {
    try {
      const startTime = performance.now();
      await axios.get(`${API_URL}/`);
      const responseTime = Math.round(performance.now() - startTime);
      setLatency(responseTime);
      setApiOnline(true);
    } catch {
      setApiOnline(false);
      setLatency(null);
    }
  };

  // Fetch latest telemetry history from MongoDB
  const fetchTelemetryHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/telemetry`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped: TelemetryResponse[] = res.data.map((item: any) => ({
          status: item.status === "ANOMALY" ? "ANOMALY" : "NORMAL",
          temperature: Number(item.temperature),
          pressure: Number(item.pressure),
          vibration: Number(item.vibration),
          timestamp: item.timestamp
            ? new Date(item.timestamp).toLocaleTimeString()
            : new Date().toLocaleTimeString(),
          message: item.message || "Recorded flight telemetry",
          riskLevel: item.riskLevel || "Low",
          cause: item.cause || "",
          explanation: item.explanation || "",
        }));
        setHistory(mapped.slice(0, 20));

        if (mapped[0]) {
          setResult(mapped[0]);
        }
      }
    } catch (err) {
      console.warn("Could not load initial history from /telemetry", err);
    }
  };

  useEffect(() => {
    checkServerStatus();
    fetchTelemetryHistory();

    // Auto-update every 3 seconds from GET /telemetry
    const syncInterval = setInterval(() => {
      fetchTelemetryHistory();
    }, 3000);

    return () => clearInterval(syncInterval);
  }, []);

  // Send Telemetry API Call with Axios (POST /telemetry)
  const sendTelemetry = async (overrideData?: {
    temperature: number;
    pressure: number;
    vibration: number;
  }) => {
    setLoading(true);
    setErrorMessage(null);

    const payload = overrideData || {
      temperature: Number(inputs.temperature) || 0,
      pressure: Number(inputs.pressure) || 0,
      vibration: Number(inputs.vibration) || 0,
    };

    const startTime = performance.now();

    try {
      const res = await axios.post(`${API_URL}/telemetry`, payload);
      const resTime = Math.round(performance.now() - startTime);
      setLatency(resTime);
      setApiOnline(true);

      const resData = res.data;
      const formattedResult: TelemetryResponse = {
        status: resData.status === "ANOMALY" ? "ANOMALY" : "NORMAL",
        temperature: Number(resData.temperature),
        pressure: Number(resData.pressure),
        vibration: Number(resData.vibration),
        timestamp: resData.timestamp
          ? new Date(resData.timestamp).toLocaleTimeString()
          : new Date().toLocaleTimeString(),
        message:
          resData.message ||
          (resData.status === "ANOMALY"
            ? "Anomaly detected in telemetry"
            : "All parameters nominal"),
        riskLevel: resData.riskLevel || "Low",
        cause: resData.cause || "",
        explanation: resData.explanation || "",
      };

      setResult(formattedResult);
      setHistory((prev) => [formattedResult, ...prev.slice(0, 19)]);

      if (formattedResult.status === "ANOMALY") {
        setAnomalyCount((c) => c + 1);
      } else {
        setNormalCount((c) => c + 1);
      }
    } catch (err: any) {
      console.error("[Telemetry API Error]", err);
      setApiOnline(false);

      const isNetworkError =
        !err.response ||
        err.code === "ERR_NETWORK" ||
        err.message === "Network Error";
      const serverMsg = isNetworkError
        ? "Network Error: Could not connect to deployed backend."
        : err?.response?.data?.message ||
          err?.message ||
          "Network Error: Failed to reach telemetry backend.";
      setErrorMessage(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  // Auto Stream Controls
  const startAutoStream = () => {
    if (isStreaming) return;
    setIsStreaming(true);
  };

  const stopAutoStream = () => {
    setIsStreaming(false);
  };

  // Auto Stream Effect: sends random telemetry every 3 seconds
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (isStreaming) {
      // Helper to generate and transmit random telemetry
      const transmitRandomStream = () => {
        const randomPayload = {
          temperature: Number((Math.random() * 50).toFixed(1)),
          pressure: Number((Math.random() * 60).toFixed(1)),
          vibration: Number((Math.random() * 10).toFixed(1)),
        };

        // Sync inputs with streaming telemetry
        setInputs(randomPayload);
        sendTelemetry(randomPayload);
      };

      // Immediate first transmission
      transmitRandomStream();

      // Recurring transmission every 3 seconds
      intervalId = setInterval(() => {
        transmitRandomStream();
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isStreaming]);

  const isAnomaly = result.status === "ANOMALY";

  return (
    <div className="min-h-screen bg-[#020409] text-slate-100 flex flex-col justify-between space-gradient-bg antialiased relative selection:bg-teal-500/25 selection:text-teal-200">
      {/* Top glowing ambient status line */}
      <div
        className={`fixed top-0 left-0 right-0 h-[2px] z-50 transition-all duration-700 ${
          errorMessage
            ? "bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_25px_rgba(245,158,11,1)]"
            : isAnomaly
            ? "bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_30px_rgba(244,63,94,1)]"
            : "bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_30px_rgba(45,212,191,1)]"
        }`}
      />

      {/* Global Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-4 flex items-center justify-between pointer-events-none backdrop-blur-md bg-[#020409]/40 border-b border-white/[0.04]">
        {/* Brand logo (top-left) */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 pointer-events-auto cursor-pointer group"
        >
          <span className="font-serif-display text-xl sm:text-2xl tracking-wide bg-gradient-to-r from-white via-slate-100 to-teal-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(45,212,191,0.35)] group-hover:scale-105 transition-transform select-none">
            ASTRA
          </span>
          <span className="text-[9px] font-mono uppercase tracking-widest text-teal-400/80 px-2 py-0.5 rounded-full border border-teal-500/20 bg-teal-500/10">
            Avionics
          </span>
        </div>

        {/* Top-Right: Return to Launchpad & Backend Status */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => navigate("/")}
            id="back-to-launchpad-btn"
            className="px-3 py-1 rounded-full text-xs font-mono text-slate-300 hover:text-teal-300 hover:border-teal-500/40 border border-slate-800 bg-slate-900/70 backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>&larr;</span>
            <span>Launchpad</span>
          </button>

          <div
            onClick={checkServerStatus}
            title={API_URL}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wider bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl text-slate-300 cursor-pointer hover:border-slate-700 transition-colors"
          >
            {apiOnline === true ? (
              <Globe className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="text-[11px]">
              {apiOnline === true ? "API ONLINE" : "OFFLINE / RETRY"}
            </span>
            {latency !== null && (
              <span className="text-[10px] opacity-75 pl-1.5 border-l border-slate-800 font-mono text-teal-300">
                {latency}ms
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full flex flex-col justify-between min-h-screen pt-20 pb-8 z-10"
      >
        <main className="w-full max-w-5xl mx-auto px-4 sm:px-8 flex flex-col items-center">
          {/* Error Alert Banner */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="w-full max-w-3xl mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/60 backdrop-blur-xl flex items-center justify-between gap-4 shadow-[0_0_30px_rgba(244,63,94,0.3)]"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                      API Transmission Failed
                    </h5>
                    <p className="text-xs text-rose-200/90 font-mono mt-0.5">
                      {errorMessage}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => sendTelemetry()}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-mono border border-rose-500/40 cursor-pointer transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="p-1.5 text-rose-400 hover:text-white transition-colors cursor-pointer text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* TELEMETRY CONTROL PANEL: Inputs + Action Buttons */}
          <section className="w-full max-w-3xl mx-auto mb-8">
            <div className="glass-surface rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
              {/* Subtle accent glow */}
              <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Avionics Telemetry Control Panel
                  </span>
                </div>
                {isStreaming && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    <Radio className="w-3 h-3 animate-spin" />
                    STREAMING EVERY 3s
                  </span>
                )}
              </div>

              {/* 3 Telemetry Inputs: Temperature, Pressure, Vibration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {/* Temperature Input */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 focus-within:border-amber-500/60 focus-within:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                      <Thermometer className="w-4 h-4 text-amber-400" />
                      Temperature
                    </span>
                    <span className="font-mono text-[11px] text-amber-400">°C</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    id="input-temperature"
                    value={inputs.temperature}
                    disabled={loading || isStreaming}
                    onChange={(e) =>
                      setInputs({ ...inputs, temperature: e.target.value })
                    }
                    className="w-full bg-transparent font-mono text-xl sm:text-2xl font-bold text-white outline-none disabled:opacity-60"
                    placeholder="25.0"
                  />
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    Limit: &gt; 35°C Anomaly
                  </div>
                </div>

                {/* Pressure Input */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 focus-within:border-cyan-500/60 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                      <Gauge className="w-4 h-4 text-cyan-400" />
                      Pressure
                    </span>
                    <span className="font-mono text-[11px] text-cyan-400">kPa</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    id="input-pressure"
                    value={inputs.pressure}
                    disabled={loading || isStreaming}
                    onChange={(e) =>
                      setInputs({ ...inputs, pressure: e.target.value })
                    }
                    className="w-full bg-transparent font-mono text-xl sm:text-2xl font-bold text-white outline-none disabled:opacity-60"
                    placeholder="35.0"
                  />
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    Nominal: 0 - 60 kPa
                  </div>
                </div>

                {/* Vibration Input */}
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 focus-within:border-indigo-500/60 focus-within:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      Vibration
                    </span>
                    <span className="font-mono text-[11px] text-indigo-400">mm/s</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    id="input-vibration"
                    value={inputs.vibration}
                    disabled={loading || isStreaming}
                    onChange={(e) =>
                      setInputs({ ...inputs, vibration: e.target.value })
                    }
                    className="w-full bg-transparent font-mono text-xl sm:text-2xl font-bold text-white outline-none disabled:opacity-60"
                    placeholder="1.5"
                  />
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">
                    Limit: &gt; 5.0 mm/s Anomaly
                  </div>
                </div>
              </div>

              {/* Action Buttons: Send Telemetry, Start Auto Stream, Stop Auto Stream */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Send Telemetry Button */}
                <motion.button
                  whileHover={!loading ? { scale: 1.02 } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  onClick={() => sendTelemetry()}
                  disabled={loading}
                  id="send-telemetry-btn"
                  className={`w-full sm:flex-1 h-12 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all duration-300 select-none shadow-lg cursor-pointer ${
                    loading
                      ? "bg-slate-800 text-teal-300 border border-teal-500/40 cursor-not-allowed opacity-80"
                      : "bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400 text-slate-950 glow-green hover:shadow-[0_0_30px_rgba(52,211,153,0.7)] border border-teal-200/50"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-teal-300 border-t-transparent rounded-full animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 fill-slate-950" />
                      <span>Send Telemetry</span>
                    </>
                  )}
                </motion.button>

                {/* Stream Controls */}
                <div className="w-full sm:w-auto flex items-center gap-2.5">
                  {/* Start Auto Stream */}
                  <button
                    onClick={startAutoStream}
                    disabled={isStreaming || loading}
                    id="start-auto-stream-btn"
                    className={`flex-1 sm:flex-none h-12 px-5 rounded-xl font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-200 border cursor-pointer ${
                      isStreaming
                        ? "bg-emerald-500/10 text-emerald-400/60 border-emerald-500/30 cursor-not-allowed opacity-60"
                        : "bg-slate-900/80 hover:bg-slate-800 text-emerald-400 border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.15)]"
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Auto Stream</span>
                  </button>

                  {/* Stop Auto Stream */}
                  <button
                    onClick={stopAutoStream}
                    disabled={!isStreaming}
                    id="stop-auto-stream-btn"
                    className={`flex-1 sm:flex-none h-12 px-5 rounded-xl font-semibold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all duration-200 border cursor-pointer ${
                      !isStreaming
                        ? "bg-slate-900/40 text-slate-600 border-slate-800/80 cursor-not-allowed opacity-50"
                        : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse"
                    }`}
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop Auto Stream</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons for easy testing */}
              <div className="mt-4 pt-3 border-t border-slate-800/70 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] font-mono text-slate-400 mr-1">
                  Quick Presets:
                </span>
                <button
                  onClick={() => {
                    const preset = { temperature: 24.5, pressure: 34.0, vibration: 1.8 };
                    setInputs(preset);
                    sendTelemetry(preset);
                  }}
                  disabled={loading || isStreaming}
                  className="px-3 py-1 rounded-full font-mono text-[11px] text-teal-300 bg-teal-950/40 border border-teal-500/40 hover:bg-teal-500/20 cursor-pointer transition-colors"
                >
                  Nominal (Normal)
                </button>
                <button
                  onClick={() => {
                    const preset = { temperature: 42.0, pressure: 34.0, vibration: 2.1 };
                    setInputs(preset);
                    sendTelemetry(preset);
                  }}
                  disabled={loading || isStreaming}
                  className="px-3 py-1 rounded-full font-mono text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/40 hover:bg-amber-500/20 cursor-pointer transition-colors"
                >
                  High Temp &gt; 40°C
                </button>
                <button
                  onClick={() => {
                    const preset = { temperature: 25.0, pressure: 35.0, vibration: 7.2 };
                    setInputs(preset);
                    sendTelemetry(preset);
                  }}
                  disabled={loading || isStreaming}
                  className="px-3 py-1 rounded-full font-mono text-[11px] text-rose-300 bg-rose-950/40 border border-rose-500/40 hover:bg-rose-500/20 cursor-pointer transition-colors"
                >
                  High Vib &gt; 6 mm/s
                </button>
              </div>
            </div>
          </section>

          {/* SUCCESS / RESPONSE CARD (Status Color: Green = NORMAL, Red = ANOMALY) */}
          <section className="w-full max-w-4xl mx-auto mb-8">
            <div
              id="status-card"
              className={`w-full rounded-3xl p-6 sm:p-7 transition-all duration-500 border backdrop-blur-2xl relative overflow-hidden ${
                isAnomaly
                  ? "bg-gradient-to-br from-rose-950/80 via-red-950/40 to-slate-950/90 border-rose-500/60 glow-red"
                  : "bg-gradient-to-br from-emerald-950/70 via-teal-950/30 to-slate-950/90 border-teal-500/50 glow-green"
              }`}
            >
              <div
                className={`absolute -right-12 -top-12 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
                  isAnomaly ? "bg-rose-500/30" : "bg-teal-400/20"
                }`}
              />

              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Status Indicator & Icon */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-2xl shrink-0 ${
                      isAnomaly
                        ? "bg-rose-500/20 border-rose-500/60 text-rose-400 pulse-radar-red"
                        : "bg-emerald-500/20 border-emerald-500/60 text-emerald-400 pulse-radar-green"
                    }`}
                  >
                    {isAnomaly ? (
                      <AlertTriangle className="w-8 h-8" />
                    ) : (
                      <CheckCircle2 className="w-8 h-8" />
                    )}
                  </div>

                  <div>
                    <div className="text-[11px] uppercase tracking-widest font-semibold text-slate-400 mb-1 flex items-center justify-center sm:justify-start gap-2">
                      <span>TELEMETRY STATUS</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        • {result.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-3">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={result.status}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.25 }}
                          className={`text-3xl sm:text-4xl font-black tracking-tight ${
                            isAnomaly
                              ? "text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]"
                              : "text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.8)]"
                          }`}
                        >
                          {result.status}
                        </motion.div>
                      </AnimatePresence>

                      {/* Risk Badge */}
                      {result.riskLevel && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border ${
                            result.riskLevel === "High"
                              ? "bg-rose-500/25 text-rose-200 border-rose-500/60 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                              : result.riskLevel === "Medium"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                              : "bg-teal-500/20 text-teal-300 border-teal-500/50"
                          }`}
                        >
                          {result.riskLevel} RISK
                        </span>
                      )}
                    </div>

                    {/* Server Message */}
                    <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-md font-light leading-relaxed">
                      {result.message}
                    </p>
                  </div>
                </div>

                {/* Diagnostic Summary */}
                <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center md:items-end justify-center min-w-[190px] backdrop-blur-xl shadow-inner">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">
                    DIAGNOSTIC SUMMARY
                  </span>

                  <div className="flex items-center gap-4">
                    <div className="text-center md:text-right">
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold block">
                        NORMAL
                      </span>
                      <span className="text-xl font-bold font-mono-num text-emerald-300">
                        {normalCount}
                      </span>
                    </div>
                    <div className="h-6 w-[1px] bg-slate-800" />
                    <div className="text-center md:text-right">
                      <span className="text-[10px] font-mono text-rose-400 font-semibold block">
                        ANOMALY
                      </span>
                      <span className="text-xl font-bold font-mono-num text-rose-300">
                        {anomalyCount}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isAnomaly ? "bg-rose-400" : "bg-teal-400"
                      }`}
                    />
                    <span>POST /telemetry</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ANOMALY INTELLIGENCE PANEL */}
          <AnimatePresence>
            {isAnomaly && result.cause && (
              <motion.section
                key="anomaly-intel"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-4xl mx-auto mb-8"
                id="anomaly-intelligence-panel"
              >
                <div className="relative rounded-3xl p-6 sm:p-7 border border-rose-500/40 bg-gradient-to-br from-rose-950/70 via-red-950/30 to-slate-950/80 backdrop-blur-2xl overflow-hidden shadow-[0_0_50px_rgba(244,63,94,0.15)]">
                  {/* Decorative corner glow */}
                  <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-rose-600/20 blur-3xl pointer-events-none" />
                  <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />

                  {/* Panel Header */}
                  <div className="relative z-10 flex items-center justify-between mb-5 pb-4 border-b border-rose-500/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-rose-200">
                          Anomaly Intelligence Report
                        </h3>
                        <p className="text-[11px] font-mono text-rose-400/70 mt-0.5">
                          AI-powered root cause analysis
                        </p>
                      </div>
                    </div>

                    {/* Risk Level Badge */}
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-xs tracking-widest uppercase ${
                        result.riskLevel === "High"
                          ? "bg-rose-500/20 border-rose-400/60 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse"
                          : result.riskLevel === "Medium"
                          ? "bg-amber-500/15 border-amber-400/50 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                          : "bg-teal-500/10 border-teal-400/30 text-teal-300"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          result.riskLevel === "High"
                            ? "bg-rose-400 animate-ping"
                            : result.riskLevel === "Medium"
                            ? "bg-amber-400"
                            : "bg-teal-400"
                        }`}
                      />
                      <span>{result.riskLevel} Risk</span>
                    </div>
                  </div>

                  {/* Cause + Explanation */}
                  <div className="relative z-10 flex flex-col gap-4">
                    {/* Root Cause */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400/80 font-semibold">
                        Root Cause
                      </span>
                      <p className="text-sm font-semibold text-rose-100 leading-snug">
                        {result.cause}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-rose-500/30 via-rose-400/10 to-transparent" />

                    {/* Detailed Explanation */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold">
                        Diagnostic Explanation
                      </span>
                      <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed font-light">
                        {result.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* SENSORY ARRAY CARDS (Temperature, Pressure, Vibration) */}
          <section className="w-full max-w-5xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>Sensory Array Data</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                THRESHOLDS: TEMP &gt; 35°C | VIB &gt; 5 mm/s
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: TEMPERATURE */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className={`glass-surface rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${
                  result.temperature > 40
                    ? "border-rose-500/70 shadow-[0_0_25px_rgba(244,63,94,0.3)] bg-rose-950/30"
                    : result.temperature > 35
                    ? "border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-amber-950/20"
                    : "border-slate-800 hover:border-teal-500/40 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                      <Thermometer className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">
                        Temperature
                      </h4>
                      <p className="text-[11px] text-slate-400">Core thermal cell</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold tracking-wider uppercase border ${
                      result.temperature > 40
                        ? "bg-rose-500/25 text-rose-300 border-rose-500/60"
                        : result.temperature > 35
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-teal-500/20 text-teal-300 border-teal-500/40"
                    }`}
                  >
                    {result.temperature > 40
                      ? "High Risk (>40)"
                      : result.temperature > 35
                      ? "Breached (>35)"
                      : "Nominal"}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold font-mono-num tracking-tight text-white">
                    {result.temperature}
                  </span>
                  <span className="text-base font-medium text-slate-400">°C</span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                    <span>Limit: &le; 35°C</span>
                    <span>{result.temperature} / 50°C</span>
                  </div>
                  <div className="w-full bg-slate-900/90 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        result.temperature > 35
                          ? "bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                          : "bg-gradient-to-r from-teal-400 to-emerald-400"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(6, (result.temperature / 50) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Card 2: PRESSURE */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="glass-surface rounded-2xl p-6 relative overflow-hidden transition-all duration-300 border-slate-800 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                      <Gauge className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">
                        Pressure
                      </h4>
                      <p className="text-[11px] text-slate-400">Manifold chamber</p>
                    </div>
                  </div>

                  <span className="text-[10px] px-2.5 py-1 rounded-full font-mono font-bold tracking-wider uppercase border bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
                    Active
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold font-mono-num tracking-tight text-white">
                    {result.pressure}
                  </span>
                  <span className="text-base font-medium text-slate-400">kPa</span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                    <span>Range: 0 - 60 kPa</span>
                    <span>{result.pressure} / 60 kPa</span>
                  </div>
                  <div className="w-full bg-slate-900/90 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-400 to-teal-400"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(6, (result.pressure / 60) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Card 3: VIBRATION */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className={`glass-surface rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${
                  result.vibration > 6
                    ? "border-rose-500/70 shadow-[0_0_25px_rgba(244,63,94,0.3)] bg-rose-950/30"
                    : result.vibration > 5
                    ? "border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-amber-950/20"
                    : "border-slate-800 hover:border-indigo-500/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">
                        Vibration
                      </h4>
                      <p className="text-[11px] text-slate-400">Harmonic stability</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold tracking-wider uppercase border ${
                      result.vibration > 6
                        ? "bg-rose-500/25 text-rose-300 border-rose-500/60"
                        : result.vibration > 5
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    }`}
                  >
                    {result.vibration > 6
                      ? "High Risk (>6)"
                      : result.vibration > 5
                      ? "Breached (>5)"
                      : "Stable"}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold font-mono-num tracking-tight text-white">
                    {result.vibration}
                  </span>
                  <span className="text-base font-medium text-slate-400">mm/s</span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                    <span>Limit: &le; 5.0 mm/s</span>
                    <span>{result.vibration} / 10.0 mm/s</span>
                  </div>
                  <div className="w-full bg-slate-900/90 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        result.vibration > 5
                          ? "bg-gradient-to-r from-rose-500 via-red-500 to-rose-700 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                          : "bg-gradient-to-r from-indigo-400 to-teal-400"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(6, (result.vibration / 10) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* REAL-TIME TELEMETRY CHARTS (Temperature & Vibration Trends) */}
          <TelemetryCharts history={history} />

          {/* TELEMETRY HISTORY TABLE (Real-time + Past Data) */}
          <section className="w-full max-w-5xl mx-auto mb-8">
            <div className="glass-surface rounded-3xl p-6 border border-slate-800 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Telemetry History (Latest 20 Records)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                    {history.length} / 20
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchTelemetryHistory()}
                    className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer transition-colors px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/25"
                  >
                    Refresh
                  </button>
                  {history.length > 0 && (
                    <button
                      onClick={() => setHistory([])}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors px-2.5 py-1 rounded-md bg-slate-850 border border-slate-800"
                    >
                      <RotateCcw className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
              </div>

              {history.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-slate-500">
                  No telemetry records found. Transmit data above or activate "Start Auto Stream".
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900/90 text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        <th className="py-3 px-4 font-semibold">Time</th>
                        <th className="py-3 px-4 font-semibold">Temperature</th>
                        <th className="py-3 px-4 font-semibold">Pressure</th>
                        <th className="py-3 px-4 font-semibold">Vibration</th>
                        <th className="py-3 px-4 font-semibold text-center">Risk</th>
                        <th className="py-3 px-4 font-semibold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                      {history.map((record, index) => {
                        const isRecAnomaly = record.status === "ANOMALY";
                        return (
                          <tr
                            key={index}
                            className={`transition-colors ${
                              isRecAnomaly
                                ? "bg-rose-950/40 border-l-4 border-l-rose-500 text-rose-200 hover:bg-rose-900/30"
                                : "bg-emerald-950/25 border-l-4 border-l-emerald-500 text-emerald-200 hover:bg-emerald-900/25"
                            }`}
                          >
                            {/* Time */}
                            <td className="py-3 px-4 text-slate-300 font-medium whitespace-nowrap">
                              {record.timestamp}
                            </td>

                            {/* Temperature */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`font-bold ${
                                  record.temperature > 35
                                    ? "text-rose-400 font-extrabold"
                                    : "text-emerald-300"
                                }`}
                              >
                                {record.temperature}°C
                              </span>
                            </td>

                            {/* Pressure */}
                            <td className="py-3 px-4 text-slate-100 font-medium whitespace-nowrap">
                              {record.pressure} kPa
                            </td>

                            {/* Vibration */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`font-bold ${
                                  record.vibration > 5
                                    ? "text-rose-400 font-extrabold"
                                    : "text-emerald-300"
                                }`}
                              >
                                {record.vibration} mm/s
                              </span>
                            </td>

                            {/* Risk Level */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                                  record.riskLevel === "High"
                                    ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                                    : record.riskLevel === "Medium"
                                    ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                                    : "bg-teal-500/15 text-teal-300 border-teal-500/30"
                                }`}
                              >
                                {record.riskLevel || "Low"}
                              </span>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-sm ${
                                  isRecAnomaly
                                    ? "bg-rose-500/25 text-rose-300 border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                                }`}
                              >
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Minimal Footer */}
        <footer className="w-full border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between max-w-5xl mx-auto z-10">
          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-mono text-[11px] tracking-wider">
              ASTRA TELEMETRY FLIGHT SUITE
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-slate-400">Endpoint: {API_URL}/telemetry</span>
            <span>•</span>
            <span className="text-teal-400 font-semibold">SYSTEM READY</span>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

export default Dashboard;
