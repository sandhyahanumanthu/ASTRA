import React from "react";
import type { CauseChainStep } from "../types/telemetry";
import { ArrowDown, Radio, AlertTriangle, GitFork, Cpu, ShieldCheck } from "lucide-react";

interface CauseChainGraphProps {
  chain: CauseChainStep[];
}

export const CauseChainGraph: React.FC<CauseChainGraphProps> = ({ chain }) => {
  const icons = [Radio, AlertTriangle, GitFork, Cpu, ShieldCheck];
  const stepColors = [
    "border-teal-500/40 bg-teal-500/10 text-teal-300",
    "border-rose-500/40 bg-rose-500/10 text-rose-300",
    "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
    "border-amber-500/40 bg-amber-500/10 text-amber-300",
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  ];

  return (
    <div className="glass-surface rounded-2xl p-6 border border-slate-800 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
            Diagnostic Cause Chain Graph
          </h3>
          <p className="text-[11px] text-slate-400 font-mono">
            Automated sensor causal progression from transmission to recommended mitigation
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
          5 NODES RESOLVED
        </span>
      </div>

      {/* Visual Chain Progression */}
      <div className="flex flex-col items-center space-y-2 relative max-w-2xl mx-auto">
        {chain.map((item, index) => {
          const Icon = icons[index % icons.length];
          const colorClass = stepColors[index % stepColors.length];
          const isLast = index === chain.length - 1;

          return (
            <React.Fragment key={index}>
              {/* Node Card */}
              <div
                className={`w-full p-4 rounded-xl border backdrop-blur-md transition-all hover:scale-[1.01] ${colorClass}`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-black/40 border border-white/10 shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] font-mono font-bold tracking-widest uppercase opacity-80 mb-0.5">
                      {item.step}
                    </div>
                    <div className="text-xs font-mono font-semibold text-white tracking-wide">
                      {item.description}
                    </div>
                  </div>
                </div>
              </div>

              {/* Connector Arrow */}
              {!isLast && (
                <div className="flex flex-col items-center my-0.5">
                  <div className="w-[2px] h-3 bg-gradient-to-b from-teal-500/40 to-cyan-500/80" />
                  <ArrowDown className="w-3.5 h-3.5 text-cyan-400 -my-0.5" />
                  <div className="w-[2px] h-3 bg-gradient-to-b from-cyan-500/80 to-teal-500/40" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
