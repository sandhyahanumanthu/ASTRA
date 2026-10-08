import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  SearchCode,
  FileSpreadsheet,
  Home,
  Shield,
  Layers,
} from "lucide-react";
import { useMission } from "../context/MissionContext";

export const Sidebar: React.FC = () => {
  const { systemHealth, isStreaming } = useMission();

  const navItems = [
    {
      to: "/dashboard",
      label: "Mission Control",
      sub: "Live Cockpit",
      icon: LayoutDashboard,
    },
    {
      to: "/telemetry",
      label: "Telemetry",
      sub: "Sensor Analytics",
      icon: Activity,
    },
    {
      to: "/investigation",
      label: "Intelligence",
      sub: "AI Investigation",
      icon: SearchCode,
    },
    {
      to: "/reports",
      label: "Reporting",
      sub: "Replay & History",
      icon: FileSpreadsheet,
    },
  ];

  return (
    <aside className="w-64 bg-[#030712]/95 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none z-30 hidden md:flex">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 group-hover:scale-105 group-hover:border-teal-400 transition-all shadow-[0_0_12px_rgba(45,212,191,0.2)]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="font-serif-display text-xl tracking-wider text-white group-hover:text-teal-300 transition-colors">
                ASTRA
              </div>
              <div className="text-[9px] font-mono tracking-widest text-teal-400/80 uppercase">
                Avionics Suite
              </div>
            </div>
          </NavLink>
        </div>

        {/* Primary Navigation */}
        <div className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Command Center
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-mono transition-all group ${
                    isActive
                      ? "bg-teal-500/15 text-teal-200 border border-teal-500/35 shadow-[0_0_15px_rgba(45,212,191,0.15)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? "text-teal-300"
                          : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium tracking-wide">{item.label}</div>
                      <div className="text-[10px] text-slate-500 group-hover:text-slate-400">
                        {item.sub}
                      </div>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Bottom Mission Card & Landing Link */}
      <div className="p-4 border-t border-slate-800/60 space-y-3">
        <NavLink
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-teal-300 hover:bg-slate-900/60 transition-colors"
        >
          <Home className="w-4 h-4 text-slate-500" />
          <span>Cinematic Landing</span>
        </NavLink>

        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] font-mono space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-teal-400" /> FLIGHT STATUS
            </span>
            <span
              className={`text-[10px] font-bold ${
                systemHealth === "NORMAL"
                  ? "text-emerald-400"
                  : systemHealth === "DEGRADED"
                  ? "text-amber-400"
                  : "text-rose-400"
              }`}
            >
              {systemHealth}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between">
            <span>STREAM CADENCE:</span>
            <span className="text-slate-300">{isStreaming ? "3.0s (ACTIVE)" : "IDLE"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
