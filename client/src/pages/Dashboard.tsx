import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Thermometer,
  Gauge,
  Activity,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  ShieldCheck,
  Radio,
  AlertCircle,
  Globe,
  WifiOff,
} from "lucide-react";
import { apiClient, API_BASE_URL } from "../config";

interface TelemetryResponse {
  status: "NORMAL" | "ANOMALY";
  temperature: number;
  pressure: number;
  vibration: number;
  timestamp: string;
  message: string;
  reason?: string;
  risk?: "LOW" | "MEDIUM" | "HIGH";
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // Active telemetry state
  const [data, setData] = useState<TelemetryResponse>({
    temperature: 24.5,
    pressure: 34.2,
    vibration: 1.8,
    status: "NORMAL",
    timestamp: new Date().toLocaleTimeString(),
    message: "Avionics initialized. Ready to transmit flight telemetry.",
    reason: "Nominal flight boundaries maintained",
    risk: "LOW",
  });

  // State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<TelemetryResponse[]>([]);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [autoStream, setAutoStream] = useState(false);
  const [passCount, setPassCount] = useState(1);
  const [failCount, setFailCount] = useState(0);

  // Ping backend server via ngrok
  const checkServerStatus = async () => {
    try {
      await apiClient.get("/");
      setApiOnline(true);
    } catch {
      setApiOnline(false);
    }
  };

  useEffect(() => {
    checkServerStatus();
  }, []);

  // Generate random telemetry strictly following requirements:
  // - random temperature (0–50)
  // - random pressure (0–60)
  // - random vibration (0–10)
  const generateRandomTelemetry = () => ({
    temperature: Number((Math.random() * 50).toFixed(1)),
    pressure: Number((Math.random() * 60).toFixed(1)),
    vibration: Number((Math.random() * 10).toFixed(1)),
  });

  // Send Telemetry API Call with Axios using ngrok URL
  const executeTelemetrySend = async (overridePayload?: {
    temperature: number;
    pressure: number;
    vibration: number;
  }) => {
    setLoading(true);
    setErrorMessage(null);

    const payload = overridePayload || generateRandomTelemetry();
    const startTime = performance.now();

    try {
      // POST to ngrok public backend
      const res = await apiClient.post("/telemetry", payload);

      const responseDuration = Math.round(performance.now() - startTime);
      setLatency(responseDuration);
      setApiOnline(true);

      const resData = res.data;
      const record: TelemetryResponse = {
        temperature: Number(resData.temperature),
        pressure: Number(resData.pressure),
        vibration: Number(resData.vibration),
        status: resData.status === "ANOMALY" ? "ANOMALY" : "NORMAL",
        timestamp: resData.timestamp
          ? new Date(resData.timestamp).toLocaleTimeString()
          : new Date().toLocaleTimeString(),
        message:
          resData.message ||
          (resData.status === "ANOMALY" ? "Anomaly detected" : "All parameters nominal"),
        reason: resData.reason || "Processed by Astra Telemetry Engine",
        risk: resData.risk || (resData.status === "ANOMALY" ? "HIGH" : "LOW"),
      };

      setData(record);
      // Store last 10 responses strictly
      setHistory((prev) => [record, ...prev.slice(0, 9)]);

      if (record.status === "ANOMALY") {
        setFailCount((c) => c + 1);
      } else {
        setPassCount((c) => c + 1);
      }
    } catch (err: any) {
      const responseDuration = Math.round(performance.now() - startTime);
      setLatency(responseDuration);
      setApiOnline(false);

      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reach telemetry backend via ngrok tunnel.";
      setErrorMessage(msg);
      console.error("[Telemetry API Error]", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-stream feature: call /telemetry every 3 seconds when enabled
  const autoStreamRef = useRef(autoStream);
  autoStreamRef.current = autoStream;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (autoStream) {
      // Immediate first call if not loading
      executeTelemetrySend();

      interval = setInterval(() => {
        executeTelemetrySend();
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoStream]);

  const isAnomaly = data.status === "ANOMALY";

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

      {/* Global Navbar: Small ASTRA branding top-left */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-4 flex items-center justify-between pointer-events-none backdrop-blur-md bg-[#020409]/40 border-b border-white/[0.04]">
        {/* Brand logo (small top-left) */}
        <div
          onClick={() => navigate("/")}
          className="flex items-center gap-2 pointer-events-auto cursor-pointer group"
        >
          <span className="font-serif-display text-xl sm:text-2xl tracking-wide bg-gradient-to-r from-white via-slate-100 to-teal-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(45,212,191,0.35)] group-hover:scale-105 transition-transform">
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
            title={API_BASE_URL}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono tracking-wider bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl text-slate-300 cursor-pointer hover:border-slate-700 transition-colors"
          >
            {apiOnline === true ? (
              <Globe className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="text-[11px]">
              {apiOnline === true ? "NGROK ONLINE" : "NGROK OFFLINE"}
            </span>
            {latency !== null && (
              <span className="text-[10px] opacity-75 pl-1.5 border-l border-slate-800 font-mono text-teal-300">
                {latency}ms
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
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
                className="w-full max-w-2xl mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-500/60 backdrop-blur-xl flex items-center justify-between gap-4 shadow-[0_0_30px_rgba(244,63,94,0.3)]"
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => executeTelemetrySend()}
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

          {/* Action Center: Send Telemetry Button + Auto Stream Toggle */}
          <section className="w-full max-w-xl mx-auto mb-8 flex flex-col items-center">
            {/* Primary "Send Telemetry" Button */}
            <motion.div
              whileHover={!loading ? { scale: 1.03 } : {}}
              whileTap={!loading ? { scale: 0.95 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-full sm:w-auto"
            >
              <button
                onClick={() => executeTelemetrySend()}
                disabled={loading}
                id="send-telemetry-btn"
                className={`w-full sm:w-80 h-14 rounded-full font-bold text-sm tracking-widest uppercase flex items-center justify-center gap-3 transition-all duration-300 select-none shadow-lg ${
                  loading
                    ? "bg-slate-800 text-teal-300 border border-teal-500/40 cursor-not-allowed opacity-80"
                    : "bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400 text-slate-950 glow-green hover:shadow-[0_0_40px_rgba(52,211,153,0.7)] border border-teal-200/50 cursor-pointer"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-teal-300 border-t-transparent rounded-full animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 fill-slate-950" />
                    <span>Send Telemetry</span>
                  </>
                )}
              </button>
            </motion.div>

            {/* Sub-Controls: Auto Stream Toggle + Quick Data Triggers */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-xs">
              {/* Auto Stream Toggle */}
              <button
                onClick={() => setAutoStream(!autoStream)}
                id="toggle-auto-stream-btn"
                className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 cursor-pointer border flex items-center gap-2 ${
                  autoStream
                    ? "bg-emerald-500/25 text-emerald-300 border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                    : "bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                <Radio
                  className={`w-3.5 h-3.5 ${
                    autoStream ? "text-emerald-400 animate-spin" : "text-slate-500"
                  }`}
                />
                <span>{autoStream ? "Auto Stream Active (3s)" : "Auto Stream"}</span>
              </button>

              {/* Force Specific Test Cases */}
              <button
                onClick={() =>
                  executeTelemetrySend({
                    temperature: 42.5, // > 40 -> HIGH risk anomaly
                    pressure: 34.0,
                    vibration: 2.1,
                  })
                }
                disabled={loading}
                className="px-3 py-1.5 rounded-full font-mono text-[11px] text-slate-300 bg-slate-900/70 border border-slate-800 hover:border-rose-500/40 hover:text-rose-300 cursor-pointer transition-colors"
              >
                Force Temp &gt; 40
              </button>

              <button
                onClick={() =>
                  executeTelemetrySend({
                    temperature: 26.0,
                    pressure: 35.0,
                    vibration: 7.2, // > 6 -> Mechanical issue HIGH risk
                  })
                }
                disabled={loading}
                className="px-3 py-1.5 rounded-full font-mono text-[11px] text-slate-300 bg-slate-900/70 border border-slate-800 hover:border-rose-500/40 hover:text-rose-300 cursor-pointer transition-colors"
              >
                Force Vib &gt; 6
              </button>

              <button
                onClick={() =>
                  executeTelemetrySend({
                    temperature: 24.0, // <= 35, vib <= 5 -> NORMAL
                    pressure: 34.0,
                    vibration: 1.8,
                  })
                }
                disabled={loading}
                className="px-3 py-1.5 rounded-full font-mono text-[11px] text-slate-300 bg-slate-900/70 border border-slate-800 hover:border-teal-500/40 hover:text-teal-300 cursor-pointer transition-colors"
              >
                Force Nominal
              </button>
            </div>
          </section>

          {/* Status Section: NORMAL (green) / ANOMALY (red glow) */}
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
                      <span>SYSTEM INTEGRITY</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        • {data.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-3">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={data.status}
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
                          {data.status}
                        </motion.div>
                      </AnimatePresence>

                      {/* Risk Badge */}
                      {data.risk && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border ${
                            data.risk === "HIGH"
                              ? "bg-rose-500/25 text-rose-200 border-rose-500/60 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                              : data.risk === "MEDIUM"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                              : "bg-teal-500/20 text-teal-300 border-teal-500/50"
                          }`}
                        >
                          {data.risk} RISK
                        </span>
                      )}
                    </div>

                    {/* Server reason & message explanation */}
                    <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-md font-light leading-relaxed">
                      {data.reason || data.message}
                    </p>
                  </div>
                </div>

                {/* Diagnostic Summary */}
                <div className="bg-slate-900/90 border border-slate-700/60 rounded-2xl p-4 sm:p-5 flex flex-col items-center md:items-end justify-center min-w-[190px] backdrop-blur-xl shadow-inner">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">
                    TELEMETRY DIAGNOSTICS
                  </span>

                  <div className="flex items-center gap-4">
                    <div className="text-center md:text-right">
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold block">
                        NORMAL
                      </span>
                      <span className="text-xl font-bold font-mono-num text-emerald-300">
                        {passCount}
                      </span>
                    </div>
                    <div className="h-6 w-[1px] bg-slate-800" />
                    <div className="text-center md:text-right">
                      <span className="text-[10px] font-mono text-rose-400 font-semibold block">
                        ANOMALY
                      </span>
                      <span className="text-xl font-bold font-mono-num text-rose-300">
                        {failCount}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isAnomaly ? "bg-rose-400" : "bg-teal-400"
                      }`}
                    />
                    <span>ngrok: /telemetry</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Sensory Array: Temperature (0–50), Pressure (0–60), Vibration (0–10) */}
          <section className="w-full max-w-5xl mx-auto mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>Sensory Array</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                CRITICAL LIMITS: TEMP &gt; 35°C | VIB &gt; 5 mm/s
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: TEMPERATURE (0–50) */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className={`glass-surface rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${
                  data.temperature > 40
                    ? "border-rose-500/70 shadow-[0_0_25px_rgba(244,63,94,0.3)] bg-rose-950/30"
                    : data.temperature > 35
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
                      <p className="text-[11px] text-slate-400">
                        Core thermal cell
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold tracking-wider uppercase border ${
                      data.temperature > 40
                        ? "bg-rose-500/25 text-rose-300 border-rose-500/60"
                        : data.temperature > 35
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-teal-500/20 text-teal-300 border-teal-500/40"
                    }`}
                  >
                    {data.temperature > 40
                      ? "High Risk (>40)"
                      : data.temperature > 35
                      ? "Breached (>35)"
                      : "Nominal"}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold font-mono-num tracking-tight text-white">
                    {data.temperature}
                  </span>
                  <span className="text-base font-medium text-slate-400">°C</span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                    <span>Safety limit: &le; 35°C</span>
                    <span>{data.temperature} / 50°C</span>
                  </div>
                  <div className="w-full bg-slate-900/90 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        data.temperature > 35
                          ? "bg-gradient-to-r from-amber-400 via-rose-500 to-red-600 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                          : "bg-gradient-to-r from-teal-400 to-emerald-400"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(6, (data.temperature / 50) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Card 2: PRESSURE (0–60) */}
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
                      <p className="text-[11px] text-slate-400">
                        Manifold chamber
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] px-2.5 py-1 rounded-full font-mono font-bold tracking-wider uppercase border bg-cyan-500/20 text-cyan-300 border-cyan-500/40">
                    Active
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold font-mono-num tracking-tight text-white">
                    {data.pressure}
                  </span>
                  <span className="text-base font-medium text-slate-400">kPa</span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                    <span>Range: 0 - 60 kPa</span>
                    <span>{data.pressure} / 60 kPa</span>
                  </div>
                  <div className="w-full bg-slate-900/90 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-cyan-400 to-teal-400"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(6, (data.pressure / 60) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Card 3: VIBRATION (0–10) */}
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className={`glass-surface rounded-2xl p-6 relative overflow-hidden transition-all duration-300 ${
                  data.vibration > 6
                    ? "border-rose-500/70 shadow-[0_0_25px_rgba(244,63,94,0.3)] bg-rose-950/30"
                    : data.vibration > 5
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
                      <p className="text-[11px] text-slate-400">
                        Harmonic stability
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold tracking-wider uppercase border ${
                      data.vibration > 6
                        ? "bg-rose-500/25 text-rose-300 border-rose-500/60"
                        : data.vibration > 5
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                    }`}
                  >
                    {data.vibration > 6
                      ? "Mechanical Issue (>6)"
                      : data.vibration > 5
                      ? "Breached (>5)"
                      : "Stable"}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-extrabold font-mono-num tracking-tight text-white">
                    {data.vibration}
                  </span>
                  <span className="text-base font-medium text-slate-400">mm/s</span>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                    <span>Safety limit: &le; 5.0 mm/s</span>
                    <span>{data.vibration} / 10.0 mm/s</span>
                  </div>
                  <div className="w-full bg-slate-900/90 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        data.vibration > 5
                          ? "bg-gradient-to-r from-rose-500 via-red-500 to-rose-700 shadow-[0_0_10px_rgba(244,63,94,0.8)]"
                          : "bg-gradient-to-r from-indigo-400 to-teal-400"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(6, (data.vibration / 10) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* History Panel: Store last 10 responses, display as list, highlight ANOMALY in red */}
          <section className="w-full max-w-5xl mx-auto mb-8">
            <div className="glass-surface rounded-3xl p-6 border border-slate-800 shadow-2xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Telemetry History Log (Last 10 Responses)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                    {history.length} / 10
                  </span>
                </div>

                {history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-8 text-center text-xs font-mono text-slate-500">
                  No telemetry broadcasts recorded yet. Click "Send Telemetry" or activate "Auto Stream".
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {history.map((record, index) => {
                    const isRecAnomaly = record.status === "ANOMALY";
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-2xl p-3.5 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border transition-all ${
                          isRecAnomaly
                            ? "bg-rose-950/35 border-rose-500/50 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                            : "bg-slate-900/50 border-slate-800/80 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        {/* Left: Timestamp & Status */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono text-slate-400">
                            {record.timestamp}
                          </span>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border ${
                              isRecAnomaly
                                ? "bg-rose-500/25 text-rose-300 border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                            }`}
                          >
                            {record.status}
                          </span>

                          {record.risk && (
                            <span
                              className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-md ${
                                record.risk === "HIGH"
                                  ? "bg-rose-500/30 text-rose-200"
                                  : record.risk === "MEDIUM"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : "bg-teal-500/20 text-teal-300"
                              }`}
                            >
                              {record.risk}
                            </span>
                          )}
                        </div>

                        {/* Middle: Sensor Values */}
                        <div className="flex items-center gap-4 sm:gap-6 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">
                              Temp
                            </span>
                            <span
                              className={`font-semibold ${
                                record.temperature > 35 ? "text-rose-400 font-bold" : "text-white"
                              }`}
                            >
                              {record.temperature}°C
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">
                              Press
                            </span>
                            <span className="text-white font-semibold">
                              {record.pressure} kPa
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">
                              Vib
                            </span>
                            <span
                              className={`font-semibold ${
                                record.vibration > 5 ? "text-rose-400 font-bold" : "text-white"
                              }`}
                            >
                              {record.vibration} mm/s
                            </span>
                          </div>
                        </div>

                        {/* Right: Server Reason */}
                        <div className="text-right text-xs text-slate-400 max-w-sm truncate sm:block">
                          {record.reason || record.message}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Dashboard Minimal Footer */}
        <footer className="w-full border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between max-w-5xl mx-auto z-10">
          <div className="flex items-center gap-2 mb-2 sm:mb-0">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-mono text-[11px] tracking-wider">
              ASTRA TELEMETRY FLIGHT SUITE
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-slate-400">Endpoint: {API_BASE_URL}/telemetry</span>
            <span>•</span>
            <span className="text-teal-400 font-semibold">HACKATHON READY</span>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};
