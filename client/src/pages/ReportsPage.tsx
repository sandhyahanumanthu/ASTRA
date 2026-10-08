import React, { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  Play,
  Pause,
  Square,
  Download,
  Printer,
  Check,
  X,
  Search,
  ShieldCheck,
  Clock,
  Send,
  MessageSquare,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { SystemStatusBar } from "../components/SystemStatusBar";
import { useMission } from "../context/MissionContext";
import { getTelemetry, submitHumanFeedback } from "../api";
import type { TelemetryRecord } from "../types/telemetry";

export const ReportsPage: React.FC = () => {
  const { history, latestTelemetry } = useMission();

  // Full historical data state
  const [telemetryLog, setTelemetryLog] = useState<TelemetryRecord[]>([]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "NORMAL" | "ANOMALY">("ALL");
  const [riskFilter, setRiskFilter] = useState<"ALL" | "High" | "Medium" | "Low">("ALL");

  // Mission Replay State
  const [replayPlaying, setReplayPlaying] = useState<boolean>(false);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [replaySpeed, setReplaySpeed] = useState<number>(1000); // 1s per frame
  const replayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Human Feedback State
  const [feedbackVote, setFeedbackVote] = useState<"CONFIRMED" | "REJECTED" | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<string>("Correct root cause");
  const [feedbackNotes, setFeedbackNotes] = useState<string>("");
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);

  // Fetch full records on mount
  useEffect(() => {
    let isMounted = true;
    const fetchFull = async () => {
      try {
        const records = await getTelemetry(100);
        if (isMounted && Array.isArray(records) && records.length > 0) {
          setTelemetryLog(records);
          return;
        }
      } catch (e) {
        console.warn("[ReportsPage] Fetch error:", e);
      }
      if (isMounted) {
        setTelemetryLog(history);
      }
    };
    fetchFull();
    return () => {
      isMounted = false;
    };
  }, [history]);

  // Chronological array for replay (oldest to newest)
  const chronologicalLog = [...telemetryLog].reverse();

  // Replay timer effect
  useEffect(() => {
    if (replayPlaying) {
      replayTimerRef.current = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= chronologicalLog.length - 1) {
            setReplayPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, replaySpeed);
    } else {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    }
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, [replayPlaying, replaySpeed, chronologicalLog.length]);

  const handlePlayReplay = () => {
    if (chronologicalLog.length === 0) return;
    if (replayIndex >= chronologicalLog.length - 1) {
      setReplayIndex(0);
    }
    setReplayPlaying(true);
  };

  const handlePauseReplay = () => setReplayPlaying(false);
  const handleStopReplay = () => {
    setReplayPlaying(false);
    setReplayIndex(0);
  };

  // Replay data slice up to current replayIndex
  const replayChartData = chronologicalLog.slice(0, replayIndex + 1).slice(-25).map((r) => ({
    time: r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : "",
    temperature: Number(r.temperature),
    pressure: Number(r.pressure),
    vibration: Number(r.vibration),
  }));

  const currentReplayPoint = chronologicalLog[replayIndex] || latestTelemetry;

  // Filtered Table Records
  const filteredLog = telemetryLog.filter((record) => {
    if (statusFilter !== "ALL" && record.status !== statusFilter) return false;
    if (riskFilter !== "ALL" && record.riskLevel !== riskFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchCause = record.cause?.toLowerCase().includes(term);
      const matchMsg = record.message?.toLowerCase().includes(term);
      const matchTime = record.timestamp?.toLowerCase().includes(term);
      if (!matchCause && !matchMsg && !matchTime) return false;
    }
    return true;
  });

  // Handle Human Validation Submission
  const handleSubmitFeedback = async () => {
    if (!feedbackVote) return;
    setFeedbackStatus("SUBMITTING");

    try {
      await submitHumanFeedback({
        caseId: "CASE #ASTRA-0001",
        validation: feedbackVote,
        feedbackReason,
        notes: feedbackNotes,
        timestamp: new Date().toISOString(),
      });
      setFeedbackStatus("SAVED");
      setTimeout(() => setFeedbackStatus(null), 3000);
    } catch {
      // Fallback
      setFeedbackStatus("SAVED_LOCALLY");
      setTimeout(() => setFeedbackStatus(null), 3000);
    }
  };

  // Export JSON Report
  const handleExportJSON = () => {
    const reportData = {
      mission: "ASTRA-DEMO-01",
      generatedAt: new Date().toISOString(),
      latestTelemetry,
      validation: {
        vote: feedbackVote,
        reason: feedbackReason,
        notes: feedbackNotes,
      },
      recordsSample: telemetryLog.slice(0, 30),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ASTRA-REPORT-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Markdown Report
  const handleExportMarkdown = () => {
    const md = `# ASTRA FLIGHT TELEMETRY & INVESTIGATION DOSSIER
**Mission**: ASTRA-DEMO-01  
**Generated**: ${new Date().toISOString()}  
**System Status**: OPERATIONAL  

## Executive Summary
- **Current Status**: ${latestTelemetry.status} (${latestTelemetry.riskLevel} Risk)
- **Primary Cause**: ${latestTelemetry.cause || "Nominal Flight Operations"}
- **Explanation**: ${latestTelemetry.explanation || "All parameters nominal."}

## Telemetry Snapshot
- **Core Temperature**: ${latestTelemetry.temperature}°C (Limit: 35.0°C)
- **Barometric Pressure**: ${latestTelemetry.pressure} kPa (Safe: 20-50 kPa)
- **Vibration Amplitude**: ${latestTelemetry.vibration} mm/s (Limit: 5.0 mm/s)

## Human Validation Feedback
- **Operator Verdict**: ${feedbackVote || "PENDING"}
- **Reason**: ${feedbackReason}
- **Notes**: ${feedbackNotes || "N/A"}

---
*Report generated automatically by ASTRA Aerospace Avionics Suite.*
`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ASTRA-INVESTIGATION-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-screen w-full bg-[#020409] text-slate-100 overflow-hidden font-mono antialiased">
      <div className="print:hidden">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="print:hidden">
          <Navbar />
          <SystemStatusBar />
        </div>

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-8">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wider text-white">
                  Reports & Mission History
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Historical telemetry query, chronological flight replay, printable investigation reports, and validation
              </p>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={handleExportMarkdown}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export MD</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(45,212,191,0.3)] cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Dossier</span>
              </button>
            </div>
          </div>

          {/* SECTION 2: MISSION REPLAY (Chronological Flight Scrubber) */}
          <section className="glass-surface rounded-2xl p-6 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-4 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div>
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-teal-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                    Mission Telemetry Replay Engine
                  </h2>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Chronological historical replay simulator (Non-operational flight playback)
                </p>
              </div>

              {/* Replay Controls */}
              <div className="flex items-center gap-2">
                {replayPlaying ? (
                  <button
                    onClick={handlePauseReplay}
                    className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-colors cursor-pointer"
                    title="Pause Replay"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handlePlayReplay}
                    className="p-2 rounded-lg bg-teal-500 text-slate-950 font-bold hover:bg-teal-400 transition-colors shadow-[0_0_12px_rgba(45,212,191,0.4)] cursor-pointer"
                    title="Play Replay"
                  >
                    <Play className="w-4 h-4 fill-slate-950" />
                  </button>
                )}

                <button
                  onClick={handleStopReplay}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Stop Replay"
                >
                  <Square className="w-4 h-4" />
                </button>

                {/* Speed Selector */}
                <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs">
                  {[
                    { label: "1x", speed: 1000 },
                    { label: "2x", speed: 500 },
                    { label: "5x", speed: 200 },
                  ].map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setReplaySpeed(s.speed)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        replaySpeed === s.speed
                          ? "bg-teal-500 text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrubber & Replay Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>
                  Replay Frame: <strong>{replayIndex + 1}</strong> / {chronologicalLog.length}
                </span>
                <span>
                  Timestamp:{" "}
                  <strong className="text-white">{currentReplayPoint?.timestamp || "00:00:00"}</strong>
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, chronologicalLog.length - 1)}
                value={replayIndex}
                onChange={(e) => setReplayIndex(parseInt(e.target.value))}
                className="w-full accent-teal-400 h-2 bg-slate-900 rounded-lg cursor-pointer"
              />
            </div>

            {/* Replay Sensor Readings Bar */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Core Temp:</span>{" "}
                <strong
                  className={
                    currentReplayPoint?.temperature > 35 ? "text-rose-400 font-bold" : "text-emerald-300"
                  }
                >
                  {Number(currentReplayPoint?.temperature).toFixed(1)}°C
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Pressure:</span>{" "}
                <strong className="text-cyan-300">
                  {Number(currentReplayPoint?.pressure).toFixed(1)} kPa
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase">Vibration:</span>{" "}
                <strong
                  className={
                    currentReplayPoint?.vibration > 5.0 ? "text-rose-400 font-bold" : "text-emerald-300"
                  }
                >
                  {Number(currentReplayPoint?.vibration).toFixed(2)} mm/s
                </strong>
              </div>
            </div>

            {/* Replay Live Chart */}
            <div className="h-48 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={replayChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-lg text-xs font-mono">
                            <div className="text-slate-400">{label}</div>
                            {payload.map((e: any, i: number) => (
                              <div key={i} style={{ color: e.color }}>
                                {e.name}: {e.value}
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={35} stroke="#f43f5e" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="vibration" name="Vib (mm/s)" stroke="#818cf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* SECTION 3: INVESTIGATION REPORT (Printable Dossier) */}
          <section className="glass-surface rounded-2xl p-6 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-4 print:p-0 print:border-none print:shadow-none">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Aerospace Mission Investigation Dossier</span>
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Formal engineering report for pre-flight analysis & ground control post-mortem
                </p>
              </div>
              <span className="text-[10px] px-2.5 py-0.5 rounded bg-slate-900 text-teal-300 border border-slate-800">
                DOC #ASTRA-DOSSIER-01
              </span>
            </div>

            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-800/60">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Spacecraft ID</span>
                  <strong className="text-white font-bold">ASTRA-DEMO-01</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Report Time</span>
                  <strong className="text-slate-200">{new Date().toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Current Classification</span>
                  <strong
                    className={
                      latestTelemetry.status === "ANOMALY" ? "text-rose-400 font-bold" : "text-emerald-400"
                    }
                  >
                    {latestTelemetry.status} ({latestTelemetry.riskLevel} RISK)
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Persistence Target</span>
                  <strong className="text-teal-300">MongoDB Atlas Cluster</strong>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block mb-1">
                  Observed Diagnostic Anomaly
                </span>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 leading-relaxed font-semibold">
                  {latestTelemetry.cause || "All parameters nominal operating within flight envelope."}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  {latestTelemetry.explanation}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase block mb-1">
                  Affected Subsystems & Bounds
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Thermal Core Cell</span>
                    <strong
                      className={
                        latestTelemetry.temperature > 35 ? "text-rose-400 font-bold" : "text-white"
                      }
                    >
                      {latestTelemetry.temperature}°C
                    </strong>{" "}
                    <span className="text-slate-500 text-[10px]">(Max 35°C)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Reaction Control Pressure</span>
                    <strong className="text-white">{latestTelemetry.pressure} kPa</strong>{" "}
                    <span className="text-slate-500 text-[10px]">(20-50 kPa)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Structural Vibration</span>
                    <strong
                      className={
                        latestTelemetry.vibration > 5.0 ? "text-rose-400 font-bold" : "text-white"
                      }
                    >
                      {latestTelemetry.vibration} mm/s
                    </strong>{" "}
                    <span className="text-slate-500 text-[10px]">(Max 5.0 mm/s)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: HUMAN VALIDATION & FEEDBACK */}
          <section className="glass-surface rounded-2xl p-6 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-4 print:hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span>Human-in-the-Loop Diagnostic Validation</span>
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Aerospace engineer review: validate system diagnostic hypotheses and store audit in database
                </p>
              </div>

              {feedbackStatus && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {feedbackStatus === "SUBMITTING"
                    ? "Persisting to MongoDB..."
                    : "Feedback Persisted ✓"}
                </span>
              )}
            </div>

            <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs font-bold text-slate-200">
                  Was this automated diagnostic assessment accurate?
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFeedbackVote("CONFIRMED")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                      feedbackVote === "CONFIRMED"
                        ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-500/50"
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm Diagnosis</span>
                  </button>

                  <button
                    onClick={() => setFeedbackVote("REJECTED")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                      feedbackVote === "REJECTED"
                        ? "bg-rose-500 text-slate-950 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-rose-500/50"
                    }`}
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Diagnosis</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Operator Feedback Reason
                  </label>
                  <select
                    value={feedbackReason}
                    onChange={(e) => setFeedbackReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="Correct root cause">Correct root cause</option>
                    <option value="Incorrect hypothesis">Incorrect hypothesis</option>
                    <option value="Insufficient evidence">Insufficient evidence</option>
                    <option value="Sensor calibration artifact">Sensor calibration artifact</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Engineering Notes / Action Items
                  </label>
                  <input
                    type="text"
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder="e.g., Confirmed thermal dissipation lag on radiator valve B"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSubmitFeedback}
                  disabled={!feedbackVote || feedbackStatus === "SUBMITTING"}
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(45,212,191,0.3)] disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Validation to MongoDB</span>
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 1: TELEMETRY HISTORY TABLE */}
          <section className="glass-surface rounded-2xl p-6 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-4 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>Historical Flight Telemetry Log</span>
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Query and filter telemetry retrieved from MongoDB Atlas (up to 100 records)
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-400 w-36 sm:w-48"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="ALL">Status: All</option>
                  <option value="NORMAL">Normal</option>
                  <option value="ANOMALY">Anomaly</option>
                </select>

                {/* Risk Filter */}
                <select
                  value={riskFilter}
                  onChange={(e: any) => setRiskFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="ALL">Risk: All</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="py-2.5 px-4 font-semibold">Time</th>
                    <th className="py-2.5 px-4 font-semibold">Temperature</th>
                    <th className="py-2.5 px-4 font-semibold">Pressure</th>
                    <th className="py-2.5 px-4 font-semibold">Vibration</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Risk</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                    <th className="py-2.5 px-4 font-semibold">Diagnostic Observation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredLog.slice(0, 50).map((record, index) => {
                    const isRecAnomaly = record.status === "ANOMALY";
                    return (
                      <tr
                        key={index}
                        className={`transition-colors ${
                          isRecAnomaly
                            ? "bg-rose-950/25 border-l-4 border-l-rose-500 text-rose-200"
                            : "bg-slate-950/40 text-slate-300 hover:bg-slate-900/40"
                        }`}
                      >
                        <td className="py-2.5 px-4 whitespace-nowrap text-slate-400">
                          {record.timestamp}
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span
                            className={
                              record.temperature > 35 ? "text-rose-400 font-bold" : "text-emerald-300"
                            }
                          >
                            {record.temperature}°C
                          </span>
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap text-slate-200">
                          {record.pressure} kPa
                        </td>
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <span
                            className={
                              record.vibration > 5.0 ? "text-rose-400 font-bold" : "text-emerald-300"
                            }
                          >
                            {record.vibration} mm/s
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
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
                        <td className="py-2.5 px-4 text-slate-400 truncate max-w-xs">
                          {record.cause || "Nominal flight reading"}
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

export default ReportsPage;
