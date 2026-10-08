import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Radio,
  Menu,
  X,
  LayoutDashboard,
  Activity,
  SearchCode,
  FileSpreadsheet,
  Home,
} from "lucide-react";
import { useMission } from "../context/MissionContext";

export const Navbar: React.FC = () => {
  const {
    missionTime,
    missionMode,
    pauseMission,
    resumeMission,
    resetMission,
    phase,
    isStreaming,
    toggleAutoStream,
    injectAnomaly,
    transmittingState,
  } = useMission();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [injecting, setInjecting] = useState(false);

  const handleInject = async () => {
    setInjecting(true);
    await injectAnomaly();
    setTimeout(() => setInjecting(false), 1200);
  };

  const navLinks = [
    { to: "/dashboard", label: "Mission Control", icon: LayoutDashboard },
    { to: "/telemetry", label: "Telemetry & Analytics", icon: Activity },
    { to: "/investigation", label: "AI Investigation", icon: SearchCode },
    { to: "/reports", label: "Reports & Replay", icon: FileSpreadsheet },
    { to: "/", label: "Landing Hero", icon: Home },
  ];

  return (
    <header className="w-full bg-[#030712]/90 border-b border-white/[0.06] backdrop-blur-md px-4 sm:px-6 py-3 shrink-0 z-40 select-none">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mission & Flight Mode */}
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo (visible on mobile where sidebar is hidden) */}
          <NavLink to="/" className="flex items-center gap-2 md:hidden">
            <span className="font-serif-display text-xl tracking-wider text-white">ASTRA</span>
          </NavLink>

          {/* Avionics Mission Identifiers */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-slate-500 text-[10px]">MISSION:</span>
              <span className="text-teal-300 font-bold tracking-wider">ASTRA-DEMO-01</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80">
              <span className="text-slate-500 text-[10px]">MODE:</span>
              <span className="text-cyan-300 font-bold tracking-wider">{phase}</span>
            </div>
          </div>
        </div>

        {/* Center: Mission Time Clock & Control */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800/90 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-mono font-bold tracking-wider text-slate-100">
              {missionTime}
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase hidden md:inline">
              ({missionMode})
            </span>
          </div>

          {/* Clock controls */}
          <div className="flex items-center gap-1">
            {missionMode === "ACTIVE" ? (
              <button
                onClick={pauseMission}
                title="Pause Mission Timer (Simulation Mode)"
                className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={resumeMission}
                title="Resume Mission Timer"
                className="p-1.5 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/40 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={resetMission}
              title="Reset Mission Timer"
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors hidden sm:inline-flex"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Inject Anomaly Button */}
          <button
            onClick={handleInject}
            disabled={injecting || transmittingState === "TRANSMITTING"}
            id="inject-anomaly-nav-btn"
            title="Inject simulated thermal & vibrational breach"
            className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 transition-all cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.15)] disabled:opacity-50"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">
              {injecting ? "Injecting..." : "Inject Anomaly"}
            </span>
            <span className="sm:hidden">Inject</span>
          </button>

          {/* Auto Stream Button */}
          <button
            onClick={toggleAutoStream}
            id="auto-stream-toggle-btn"
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              isStreaming
                ? "bg-teal-500 text-slate-950 border border-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.4)]"
                : "bg-slate-900/90 text-teal-300 border border-teal-500/30 hover:border-teal-500/60"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isStreaming ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">
              {isStreaming ? "Live Stream (3s)" : "Auto Stream"}
            </span>
            <span className="sm:hidden">{isStreaming ? "Live" : "Stream"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-800 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono ${
                    isActive
                      ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                      : "text-slate-400 hover:text-white"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </header>
  );
};
