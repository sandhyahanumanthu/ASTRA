import React from "react";
import type { DiagnosticHypothesis } from "../types/telemetry";
import { CheckCircle2, XCircle, Activity, Clock } from "lucide-react";

interface EvidencePanelProps {
  hypothesis: DiagnosticHypothesis;
  telemetry: {
    temperature: number;
    pressure: number;
    vibration: number;
  };
  timestamp?: string;
  severity?: string;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  hypothesis,
  telemetry,
  timestamp,
  severity = "CRITICAL",
}) => {
  return (
    <div className="glass-surface rounded-2xl p-6 border border-slate-800 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800/80">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-teal-400 uppercase">
            EVIDENCE DOSSIER • {hypothesis.id}
          </span>
          <h3 className="text-base font-bold text-white font-mono mt-0.5">
            {hypothesis.title}
          </h3>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>{timestamp || "LIVE TELEMETRY"}</span>
          </div>

          <div
            className={`px-2.5 py-1 rounded-lg border font-bold text-[11px] ${
              severity === "CRITICAL"
                ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                : severity === "WARNING"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                : "bg-teal-500/15 text-teal-300 border-teal-500/30"
            }`}
          >
            {severity}
          </div>
        </div>
      </div>

      {/* Related Telemetry Snapshot */}
      <div className="mb-6">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" /> Correlated Sensor Snapshot
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Thermal Core</div>
            <div
              className={`text-lg font-extrabold ${
                telemetry.temperature > 35 ? "text-rose-400" : "text-emerald-300"
              }`}
            >
              {telemetry.temperature}°C
            </div>
            <div className="text-[9px] text-slate-500">Threshold: &le;35°C</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Barometric Press.</div>
            <div
              className={`text-lg font-extrabold ${
                telemetry.pressure < 20 || telemetry.pressure > 50
                  ? "text-rose-400"
                  : "text-emerald-300"
              }`}
            >
              {telemetry.pressure} kPa
            </div>
            <div className="text-[9px] text-slate-500">Safe: 20-50 kPa</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-center font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Vibration Amplitude</div>
            <div
              className={`text-lg font-extrabold ${
                telemetry.vibration > 5.0 ? "text-rose-400" : "text-emerald-300"
              }`}
            >
              {telemetry.vibration} mm/s
            </div>
            <div className="text-[9px] text-slate-500">Threshold: &le;5.0 mm/s</div>
          </div>
        </div>
      </div>

      {/* Supporting vs Contradicting Evidence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supporting Evidence */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Supporting Evidence ({hypothesis.evidenceFor.length})
          </div>
          <ul className="space-y-2">
            {hypothesis.evidenceFor.map((item, i) => (
              <li
                key={i}
                className="text-xs font-mono text-emerald-200/90 flex items-start gap-2 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-500/20"
              >
                <span className="text-emerald-400 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contradicting Evidence */}
        <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-slate-400" />
            Contradicting / Excluded Hypotheses ({hypothesis.evidenceAgainst.length})
          </div>
          {hypothesis.evidenceAgainst.length === 0 ? (
            <div className="text-xs font-mono text-slate-500 italic p-3 text-center">
              No contradictory sensor data detected for this hypothesis.
            </div>
          ) : (
            <ul className="space-y-2">
              {hypothesis.evidenceAgainst.map((item, i) => (
                <li
                  key={i}
                  className="text-xs font-mono text-slate-300 flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800"
                >
                  <span className="text-slate-500 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
