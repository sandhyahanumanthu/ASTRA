import React from "react";
import { useMission } from "../context/MissionContext";
import type { MissionPhase } from "../types/telemetry";
import { Rocket, CheckCircle2 } from "lucide-react";

export const MissionTimeline: React.FC = () => {
  const { phase, setPhase } = useMission();

  const phases: { id: MissionPhase; label: string; desc: string }[] = [
    { id: "PRE-LAUNCH", label: "PRE-LAUNCH", desc: "T-00:15:00 • Systems Check" },
    { id: "LAUNCH", label: "LAUNCH", desc: "T+00:00:00 • Main Engine Ignition" },
    { id: "ASCENT", label: "ASCENT", desc: "T+00:02:30 • Max-Q Aerodynamic Load" },
    { id: "CRUISE", label: "CRUISE", desc: "T+00:12:00 • Orbital Insertion" },
    { id: "DESCENT", label: "DESCENT", desc: "T+01:40:00 • Retro-Burn & Entry" },
  ];

  const currentIdx = phases.findIndex((p) => p.id === phase);

  return (
    <div className="w-full bg-[#050b18]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Mission Flight Timeline
          </span>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            (Interactive Phase Simulation)
          </span>
        </div>
        <div className="text-[11px] font-mono text-cyan-300">
          ACTIVE PHASE: <span className="font-bold underline">{phase}</span>
        </div>
      </div>

      {/* Phase Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {phases.map((item, index) => {
          const isActive = item.id === phase;
          const isPassed = index < currentIdx;

          return (
            <button
              key={item.id}
              onClick={() => setPhase(item.id)}
              className={`relative text-left p-3 rounded-xl border transition-all cursor-pointer group ${
                isActive
                  ? "bg-teal-500/15 border-teal-400/80 shadow-[0_0_20px_rgba(45,212,191,0.2)]"
                  : isPassed
                  ? "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700"
                  : "bg-slate-950/40 border-slate-800/40 text-slate-500 hover:border-slate-700/60"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={`text-[10px] font-mono font-bold tracking-widest ${
                    isActive ? "text-teal-300" : isPassed ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  PHASE 0{index + 1}
                </span>

                {isPassed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isActive ? (
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                ) : null}
              </div>

              <div
                className={`text-xs font-mono font-bold tracking-wider mb-1 ${
                  isActive ? "text-white" : isPassed ? "text-slate-300" : "text-slate-400"
                }`}
              >
                {item.label}
              </div>

              <div className="text-[10px] font-mono text-slate-500 truncate">
                {item.desc}
              </div>

              {isActive && (
                <div className="absolute -bottom-[1px] left-3 right-3 h-[2px] bg-gradient-to-r from-teal-400 to-cyan-400 shadow-[0_0_8px_rgba(45,212,191,0.9)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
