import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Radio,
  AlertTriangle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useMission } from "../context/MissionContext";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { SystemStatusBar } from "../components/SystemStatusBar";
import { MissionTimeline } from "../components/MissionTimeline";
import { TelemetryCard } from "../components/TelemetryCard";
import { TelemetryCharts } from "../components/TelemetryCharts";

export const Dashboard: React.FC = () => {
  const {
    phase,
    isStreaming,
    toggleAutoStream,
    latestTelemetry,
    history,
    sendCustomTelemetry,
    injectAnomaly,
    refreshHistory,
    systemHealth,
    transmittingState,
    errorMessage,
    clearError,
    lastSync,
  } = useMission();

  // Input states for custom telemetry transmission
  const [tempInput, setTempInput] = useState<string>("25.0");
  const [pressInput, setPressInput] = useState<string>("35.0");
  const [vibInput, setVibInput] = useState<string>("1.5");
  const [injecting, setInjecting] = useState<boolean>(false);

  // Active anomaly count
  const activeAnomaliesCount = history.slice(0, 10).filter((r) => r.status === "ANOMALY").length;

  const handleTransmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendCustomTelemetry({
      temperature: parseFloat(tempInput) || 0,
      pressure: parseFloat(pressInput) || 0,
      vibration: parseFloat(vibInput) || 0,
    });
  };

  const handleInject = async () => {
    setInjecting(true);
    const result = await injectAnomaly();
    if (result) {
      setTempInput(result.temperature.toString());
      setPressInput(result.pressure.toString());
      setVibInput(result.vibration.toString());
    }
    setTimeout(() => setInjecting(false), 1200);
  };

  return (
    <div className="flex h-screen w-full bg-[#020409] text-slate-100 overflow-hidden font-mono antialiased">
      {/* Global Compact Sidebar */}
      <Sidebar />

      {/* Main Mission Control Window */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Real-time System Status Bar */}
        <SystemStatusBar />

        {/* Scrollable Dashboard Workspace */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {/* Error Message Notification */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-center justify-between gap-4 text-xs shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <strong className="text-rose-300 font-bold uppercase tracking-wider block">
                      Telemetry Transmission Warning
                    </strong>
                    <span className="text-rose-200">{errorMessage}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sendCustomTelemetry({
                      temperature: parseFloat(tempInput) || 25,
                      pressure: parseFloat(pressInput) || 35,
                      vibration: parseFloat(vibInput) || 1.5,
                    })}
                    className="px-3 py-1 rounded bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border border-rose-500/40 text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={clearError}
                    className="px-2.5 py-1 text-slate-400 hover:text-white text-[11px]"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mission Status Top Grid */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-[#050b18]/80 border border-slate-800 backdrop-blur-md">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Mission Status
              </div>
              <div
                className={`text-sm font-extrabold uppercase ${
                  systemHealth === "CRITICAL"
                    ? "text-rose-400"
                    : systemHealth === "DEGRADED"
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {systemHealth}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050b18]/80 border border-slate-800 backdrop-blur-md">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Active Anomalies
              </div>
              <div
                className={`text-sm font-extrabold ${
                  activeAnomaliesCount > 0 ? "text-rose-400" : "text-slate-200"
                }`}
              >
                {activeAnomaliesCount} ACTIVE
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050b18]/80 border border-slate-800 backdrop-blur-md">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Mission Phase
              </div>
              <div className="text-sm font-extrabold text-cyan-300 uppercase">{phase}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050b18]/80 border border-slate-800 backdrop-blur-md">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Stream Status
              </div>
              <div className="text-sm font-extrabold text-teal-300 flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isStreaming ? "bg-teal-400 animate-pulse" : "bg-slate-600"
                  }`}
                />
                <span>{isStreaming ? "LIVE (3s)" : "STOPPED"}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#050b18]/80 border border-slate-800 backdrop-blur-md col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                Last Telemetry Sync
              </div>
              <div className="text-sm font-extrabold text-slate-200 truncate">{lastSync}</div>
            </div>
          </section>

          {/* Mission Phase Timeline */}
          <MissionTimeline />

          {/* Telemetry Overview Cards (Temperature, Pressure, Vibration) */}
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Primary Avionics Sensors
              </span>
              <span className="text-[10px] text-slate-500">
                Deterministic Aerospace Safety Envelopes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TelemetryCard
                type="temperature"
                value={latestTelemetry.temperature}
                unit="°C"
                normalRange="15.0 - 35.0 °C"
                status={latestTelemetry.temperature > 35 ? "ANOMALY" : "NORMAL"}
                riskLevel={latestTelemetry.riskLevel}
                lastUpdated={latestTelemetry.timestamp}
                thresholdLimit={35.0}
              />

              <TelemetryCard
                type="pressure"
                value={latestTelemetry.pressure}
                unit="kPa"
                normalRange="20.0 - 50.0 kPa"
                status={
                  latestTelemetry.pressure < 20 || latestTelemetry.pressure > 50
                    ? "ANOMALY"
                    : "NORMAL"
                }
                riskLevel={latestTelemetry.riskLevel}
                lastUpdated={latestTelemetry.timestamp}
                thresholdLimit={50.0}
              />

              <TelemetryCard
                type="vibration"
                value={latestTelemetry.vibration}
                unit="mm/s"
                normalRange="0.5 - 5.0 mm/s"
                status={latestTelemetry.vibration > 5.0 ? "ANOMALY" : "NORMAL"}
                riskLevel={latestTelemetry.riskLevel}
                lastUpdated={latestTelemetry.timestamp}
                thresholdLimit={5.0}
              />
            </div>
          </section>

          {/* Telemetry Transmission Console */}
          <section className="glass-surface rounded-2xl p-6 border border-slate-800/80 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800/70">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  <Send className="w-3.5 h-3.5 text-teal-400" />
                  <span>Transmit Real-time Flight Telemetry</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Sends telemetry to Node/Express backend → validates envelope → persists to MongoDB
                </p>
              </div>

              {/* Transmission Progress State */}
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    transmittingState === "TRANSMITTING"
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse"
                      : transmittingState === "ANALYZING"
                      ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 animate-pulse"
                      : transmittingState === "SAVED"
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                      : transmittingState === "ERROR"
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                      : "bg-slate-900 text-slate-400 border-slate-800"
                  }`}
                >
                  {transmittingState === "TRANSMITTING" && "TRANSMITTING TELEMETRY..."}
                  {transmittingState === "ANALYZING" && "ANALYZING ENVELOPE..."}
                  {transmittingState === "SAVED" && "DATABASE SAVED ✓"}
                  {transmittingState === "ERROR" && "TRANSMISSION FAILED"}
                  {transmittingState === "IDLE" && "TELEMETRY ENGINE READY"}
                </span>
              </div>
            </div>

            <form onSubmit={handleTransmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Temperature Input */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Temperature (°C) [Limit: 35°C]
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempInput}
                    onChange={(e) => setTempInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-teal-400 text-sm font-bold"
                    placeholder="25.0"
                    required
                  />
                </div>

                {/* Pressure Input */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Pressure (kPa) [Safe: 20-50 kPa]
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={pressInput}
                    onChange={(e) => setPressInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-cyan-400 text-sm font-bold"
                    placeholder="35.0"
                    required
                  />
                </div>

                {/* Vibration Input */}
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Vibration (mm/s) [Limit: 5.0 mm/s]
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={vibInput}
                    onChange={(e) => setVibInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:border-indigo-400 text-sm font-bold"
                    placeholder="1.5"
                    required
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={transmittingState === "TRANSMITTING"}
                    id="transmit-telemetry-btn"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Telemetry</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleInject}
                    disabled={injecting || transmittingState === "TRANSMITTING"}
                    id="inject-anomaly-dashboard-btn"
                    className="px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>{injecting ? "Injecting..." : "Inject Anomaly"}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={toggleAutoStream}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                      isStreaming
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                        : "bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30"
                    }`}
                  >
                    <Radio className={`w-3.5 h-3.5 ${isStreaming ? "animate-pulse text-rose-400" : ""}`} />
                    <span>{isStreaming ? "Stop Auto Stream" : "Start Auto Stream (3s)"}</span>
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Real-time Recharts Dynamics */}
          <TelemetryCharts />

          {/* Recent Telemetry Table */}
          <section className="glass-surface rounded-2xl p-6 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Telemetry Transmissions Stream (Recent Records)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                  {history.length} Loaded
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => refreshHistory()}
                  className="text-[11px] text-teal-400 hover:text-teal-300 px-3 py-1 rounded-md bg-teal-500/10 border border-teal-500/25 transition-colors cursor-pointer"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800/80">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                    <th className="py-2.5 px-4 font-semibold">Temperature</th>
                    <th className="py-2.5 px-4 font-semibold">Pressure</th>
                    <th className="py-2.5 px-4 font-semibold">Vibration</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Risk</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {history.slice(0, 15).map((record, index) => {
                    const isRecAnomaly = record.status === "ANOMALY";
                    return (
                      <tr
                        key={index}
                        className={`transition-colors ${
                          isRecAnomaly
                            ? "bg-rose-950/30 border-l-4 border-l-rose-500 text-rose-200"
                            : "bg-emerald-950/15 border-l-4 border-l-emerald-500 text-emerald-200"
                        }`}
                      >
                        <td className="py-2.5 px-4 text-slate-300 font-medium whitespace-nowrap">
                          {record.timestamp}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span
                            className={`font-bold ${
                              record.temperature > 35 ? "text-rose-400 font-extrabold" : "text-emerald-300"
                            }`}
                          >
                            {record.temperature}°C
                          </span>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-slate-200">
                          {record.pressure} kPa
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span
                            className={`font-bold ${
                              record.vibration > 5.0 ? "text-rose-400 font-extrabold" : "text-emerald-300"
                            }`}
                          >
                            {record.vibration} mm/s
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
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
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                              isRecAnomaly
                                ? "bg-rose-500/25 text-rose-300 border-rose-500/60"
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
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
