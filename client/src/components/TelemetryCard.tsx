import React from "react";
import { Thermometer, Gauge, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

interface TelemetryCardProps {
  type: "temperature" | "pressure" | "vibration";
  value: number;
  unit: string;
  normalRange: string;
  status: "NORMAL" | "ANOMALY";
  riskLevel?: string;
  lastUpdated: string;
  thresholdLimit: number;
}

export const TelemetryCard: React.FC<TelemetryCardProps> = ({
  type,
  value,
  unit,
  normalRange,
  status,
  riskLevel,
  lastUpdated,
  thresholdLimit,
}) => {
  const isBreached = status === "ANOMALY";

  const getMetadata = () => {
    switch (type) {
      case "temperature":
        return {
          title: "Thermal Core Cell",
          sub: "Avionics Junction Temp",
          icon: Thermometer,
          accentColor: isBreached ? "text-rose-400" : "text-amber-400",
          iconBg: isBreached ? "bg-rose-500/15 border-rose-500/30" : "bg-amber-500/15 border-amber-500/30",
          border: isBreached ? "border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.2)]" : "border-slate-800",
          percentage: Math.min(100, Math.round((value / 55) * 100)),
        };
      case "pressure":
        return {
          title: "Reaction Control Chamber",
          sub: "Pneumatic Barometric Line",
          icon: Gauge,
          accentColor: isBreached ? "text-rose-400" : "text-cyan-400",
          iconBg: isBreached ? "bg-rose-500/15 border-rose-500/30" : "bg-cyan-500/15 border-cyan-500/30",
          border: isBreached ? "border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.2)]" : "border-slate-800",
          percentage: Math.min(100, Math.round((value / 60) * 100)),
        };
      case "vibration":
        return {
          title: "Structural Accelerometer",
          sub: "Interstage Harmonic Load",
          icon: Activity,
          accentColor: isBreached ? "text-rose-400" : "text-indigo-400",
          iconBg: isBreached ? "bg-rose-500/15 border-rose-500/30" : "bg-indigo-500/15 border-indigo-500/30",
          border: isBreached ? "border-rose-500/50 shadow-[0_0_25px_rgba(244,63,94,0.2)]" : "border-slate-800",
          percentage: Math.min(100, Math.round((value / 10) * 100)),
        };
    }
  };

  const meta = getMetadata();
  const Icon = meta.icon;

  return (
    <div
      className={`glass-surface rounded-2xl p-5 border transition-all duration-300 relative overflow-hidden backdrop-blur-xl ${meta.border}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${meta.iconBg} ${meta.accentColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
              {meta.title}
            </h4>
            <p className="text-[10px] text-slate-400 font-mono">{meta.sub}</p>
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase border flex items-center gap-1 ${
            isBreached
              ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.3)] animate-pulse"
              : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
          }`}
        >
          {isBreached ? (
            <>
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>{riskLevel === "High" ? "CRITICAL" : "ANOMALY"}</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>NOMINAL</span>
            </>
          )}
        </span>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <span
            className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
              isBreached ? "text-rose-400 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" : "text-white"
            }`}
          >
            {value.toFixed(1)}
          </span>
          <span className="text-sm font-mono font-bold text-slate-400">{unit}</span>
        </div>

        {/* Threshold Limit Display */}
        <div className="text-right">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Ceiling</div>
          <div className="text-xs font-mono font-bold text-slate-300">
            &le; {thresholdLimit} {unit}
          </div>
        </div>
      </div>

      {/* Visual Level Gauge Bar */}
      <div className="w-full bg-slate-900 rounded-full h-1.5 mb-3 overflow-hidden border border-slate-800">
        <div
          className={`h-full transition-all duration-500 ${
            isBreached
              ? "bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              : "bg-gradient-to-r from-teal-500 to-cyan-400"
          }`}
          style={{ width: `${meta.percentage}%` }}
        />
      </div>

      {/* Footer Info: Normal Range & Last Updated */}
      <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-800/40 text-slate-400">
        <span>
          Envelope: <strong className="text-slate-300 font-semibold">{normalRange}</strong>
        </span>
        <span className="text-[10px] text-slate-500">Updated: {lastUpdated}</span>
      </div>
    </div>
  );
};
