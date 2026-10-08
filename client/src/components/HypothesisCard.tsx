import React from "react";
import type { DiagnosticHypothesis } from "../types/telemetry";
import { ArrowRight } from "lucide-react";

interface HypothesisCardProps {
  hypothesis: DiagnosticHypothesis;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const HypothesisCard: React.FC<HypothesisCardProps> = ({
  hypothesis,
  isSelected,
  onSelect,
}) => {
  const isPrimary = hypothesis.status === "PRIMARY";

  return (
    <div
      onClick={onSelect}
      className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden backdrop-blur-xl ${
        isSelected
          ? "bg-teal-500/10 border-teal-400/80 shadow-[0_0_25px_rgba(45,212,191,0.2)]"
          : isPrimary
          ? "bg-slate-900/70 border-amber-500/40 hover:border-amber-400"
          : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {hypothesis.id}
          </span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
              isPrimary
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : hypothesis.status === "SECONDARY"
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {hypothesis.status}
          </span>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-1.5 font-mono">
          <span className="text-[11px] text-slate-400">Confidence:</span>
          <span
            className={`text-sm font-extrabold ${
              hypothesis.confidence >= 70
                ? "text-teal-300"
                : hypothesis.confidence >= 50
                ? "text-amber-300"
                : "text-slate-400"
            }`}
          >
            {hypothesis.confidence}%
          </span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-white mb-2 tracking-wide font-mono">
        {hypothesis.title}
      </h3>

      {/* Summary */}
      <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">
        {hypothesis.summary}
      </p>

      {/* Confidence Bar */}
      <div className="w-full bg-slate-950 rounded-full h-1.5 mb-4 overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-500 ${
            hypothesis.confidence >= 70
              ? "bg-gradient-to-r from-teal-500 to-cyan-400"
              : hypothesis.confidence >= 50
              ? "bg-gradient-to-r from-amber-500 to-teal-400"
              : "bg-slate-600"
          }`}
          style={{ width: `${hypothesis.confidence}%` }}
        />
      </div>

      {/* Recommended Action */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-slate-300">
        <div className="text-[10px] text-teal-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
          <ArrowRight className="w-3 h-3" /> Recommended Diagnostic Action
        </div>
        <div>{hypothesis.recommendedAction}</div>
      </div>
    </div>
  );
};
