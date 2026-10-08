import React from "react";
import { useMission } from "../context/MissionContext";
import { Database, Activity, Wifi, WifiOff } from "lucide-react";

export const SystemStatusBar: React.FC = () => {
  const { apiOnline, dbOnline, isStreaming, systemHealth, latency, lastSync } = useMission();

  return (
    <div className="w-full bg-[#050b18]/90 border-b border-white/[0.06] backdrop-blur-md px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 z-40 select-none">
      {/* Left: Stream & Health Indicators */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Stream Status */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isStreaming
                ? "bg-teal-400 animate-ping"
                : "bg-slate-600"
            }`}
          />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-300">
            STREAM:
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              isStreaming
                ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {isStreaming ? "LIVE ●" : "STOPPED"}
          </span>
        </div>

        <div className="hidden sm:block text-slate-700">|</div>

        {/* System Health */}
        <div className="flex items-center gap-1.5">
          <Activity
            className={`w-3.5 h-3.5 ${
              systemHealth === "NORMAL"
                ? "text-emerald-400"
                : systemHealth === "DEGRADED"
                ? "text-amber-400 animate-pulse"
                : "text-rose-400 animate-bounce"
            }`}
          />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-300">
            HEALTH:
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              systemHealth === "NORMAL"
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                : systemHealth === "DEGRADED"
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-rose-500/20 text-rose-300 border-rose-500/40"
            }`}
          >
            {systemHealth}
          </span>
        </div>
      </div>

      {/* Right: API & Database Real Status */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* API Connection */}
        <div className="flex items-center gap-1.5">
          {apiOnline ? (
            <Wifi className="w-3.5 h-3.5 text-teal-400" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-rose-400" />
          )}
          <span className="text-[11px] tracking-wider text-slate-300">API:</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              apiOnline === true
                ? "bg-teal-500/15 text-teal-300"
                : apiOnline === false
                ? "bg-rose-500/20 text-rose-300"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            {apiOnline === true ? "CONNECTED" : apiOnline === false ? "DISCONNECTED" : "CHECKING"}
          </span>
          {latency !== null && (
            <span className="text-[10px] text-slate-500 hidden md:inline">({latency}ms)</span>
          )}
        </div>

        <div className="hidden sm:block text-slate-700">|</div>

        {/* Database Status */}
        <div className="flex items-center gap-1.5">
          <Database
            className={`w-3.5 h-3.5 ${
              dbOnline ? "text-teal-400" : "text-amber-400"
            }`}
          />
          <span className="text-[11px] tracking-wider text-slate-300">DATABASE:</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
              dbOnline === true
                ? "bg-teal-500/15 text-teal-300"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
            title={dbOnline ? "MongoDB Atlas persistent connection active" : "Using in-memory telemetry buffer"}
          >
            {dbOnline === true ? "CONNECTED (ATLAS)" : "IN-MEMORY FALLBACK"}
          </span>
        </div>

        <div className="hidden sm:block text-slate-700">|</div>

        {/* Last Sync */}
        <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-500">
          <span>SYNC:</span>
          <span className="text-slate-400 font-mono">{lastSync}</span>
        </div>
      </div>
    </div>
  );
};
