import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import {
  ArrowRight,
  Sparkles,
  Layers,
  Activity,
  SearchCode,
  FileSpreadsheet,
  Cpu,
  ChevronDown,
  Thermometer,
  Gauge,
} from "lucide-react";
import { RocketCanvas } from "../components/RocketCanvas";
import { useMission } from "../context/MissionContext";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { apiOnline, dbOnline, latestTelemetry } = useMission();
  const [isLaunching, setIsLaunching] = useState(false);

  // When "Launch Mission Control" button is clicked -> navigate to "/dashboard"
  const handleLaunch = () => {
    if (isLaunching) return;
    setIsLaunching(true);

    const tl = gsap.timeline({
      onComplete: () => {
        navigate("/dashboard");
      },
    });

    tl.to(".launchpad-branding", {
      scale: 1.08,
      opacity: 0,
      filter: "blur(12px)",
      duration: 0.9,
      ease: "power2.inOut",
    });

    // Fallback timer
    setTimeout(() => {
      navigate("/dashboard");
    }, 1200);
  };

  const scrollToCapabilities = () => {
    const el = document.getElementById("capabilities-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#020409] text-slate-100 flex flex-col justify-between space-gradient-bg antialiased relative selection:bg-teal-500/25 selection:text-teal-200 overflow-x-hidden">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-12 py-5 flex items-center justify-between backdrop-blur-md bg-[#020409]/60 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-serif-display text-2xl tracking-wide bg-gradient-to-r from-white via-slate-100 to-teal-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(45,212,191,0.35)] select-none">
            ASTRA
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400/80 px-2.5 py-0.5 rounded-full border border-teal-500/20 bg-teal-500/10">
            AVIONICS INTELLIGENCE
          </span>
        </div>

        {/* System Status Indicators Strip */}
        <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[11px]">SYSTEM: ONLINE</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                apiOnline ? "bg-teal-400" : "bg-rose-400"
              }`}
            />
            <span className="text-[11px]">
              API: {apiOnline === true ? "CONNECTED" : apiOnline === false ? "RETRYING" : "CHECKING"}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                dbOnline ? "bg-teal-400" : "bg-amber-400"
              }`}
            />
            <span className="text-[11px]">
              DATABASE: {dbOnline ? "CONNECTED" : "FALLBACK"}
            </span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative w-full min-h-screen flex flex-col justify-center items-center px-4 pt-24 pb-12 z-10">
        {/* 3D Interactive Rocket Canvas */}
        <RocketCanvas isLaunching={isLaunching} />

        {/* Central Call to Action Branding */}
        <div className="launchpad-branding relative z-20 flex flex-col items-center text-center my-auto pointer-events-auto max-w-2xl mx-auto px-4">
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono tracking-widest uppercase mb-6 shadow-[0_0_20px_rgba(45,212,191,0.15)]"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>AI TELEMETRY INTELLIGENCE</span>
          </motion.div>

          {/* Title: ASTRA */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-serif-display text-8xl sm:text-9xl md:text-[10.5rem] font-normal tracking-tight mb-4 select-none drop-shadow-[0_0_60px_rgba(45,212,191,0.45)] leading-none"
          >
            <span className="bg-gradient-to-b from-white via-slate-100 to-teal-200 bg-clip-text text-transparent">
              ASTRA
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-slate-300 text-base sm:text-lg font-light tracking-wide max-w-xl mx-auto mb-10 drop-shadow leading-relaxed"
          >
            Real-time telemetry monitoring, anomaly detection and intelligent mission diagnostics.
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-10"
          >
            {/* Launch Mission Control Button */}
            <button
              onClick={handleLaunch}
              disabled={isLaunching}
              id="launch-mission-control-btn"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 text-slate-950 font-extrabold text-sm tracking-wider uppercase flex items-center gap-3 shadow-[0_0_35px_rgba(45,212,191,0.5)] hover:shadow-[0_0_50px_rgba(52,211,153,0.8)] border border-teal-100/50 cursor-pointer transition-all hover:scale-105 active:scale-95 select-none"
            >
              {isLaunching ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Igniting Propulsion...</span>
                </>
              ) : (
                <>
                  <span>Launch Mission Control</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            {/* Explore Capabilities Button */}
            <button
              onClick={scrollToCapabilities}
              className="px-7 py-4 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-mono text-xs uppercase tracking-wider border border-slate-700/80 hover:border-slate-500 transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Explore Capabilities</span>
              <ChevronDown className="w-4 h-4 text-teal-400" />
            </button>
          </motion.div>

          {/* Small Preview of Live Telemetry Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="w-full max-w-xl mx-auto"
          >
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2.5 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              <span>Live Avionics Bus Snapshot</span>
            </div>
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#030712]/80 border border-slate-800/80 backdrop-blur-xl font-mono text-center shadow-2xl">
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" /> Temp
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  {latestTelemetry.temperature.toFixed(1)}°C
                </div>
                <div className="text-[9px] text-slate-500">&le; 35°C Safe</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
                  <Gauge className="w-3 h-3 text-cyan-400" /> Pressure
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  {latestTelemetry.pressure.toFixed(1)} kPa
                </div>
                <div className="text-[9px] text-slate-500">20-50 kPa Safe</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <div className="text-[10px] text-slate-500 uppercase flex items-center justify-center gap-1">
                  <Activity className="w-3 h-3 text-indigo-400" /> Vibration
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                  {latestTelemetry.vibration.toFixed(1)} mm/s
                </div>
                <div className="text-[9px] text-slate-500">&le; 5.0 mm/s Safe</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Capabilities Section */}
      <section
        id="capabilities-section"
        className="w-full max-w-6xl mx-auto px-6 py-20 z-20 border-t border-slate-800/60"
      >
        <div className="text-center mb-16">
          <span className="text-xs font-mono font-bold tracking-widest text-teal-400 uppercase px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20">
            ARCHITECTURE & CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-mono mt-3 mb-4">
            Mission Control Meets Anomaly Intelligence
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
            Engineered as an autonomous flight telemetry monitoring and investigative suite for next-generation aerospace vehicles.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 backdrop-blur-xl hover:border-teal-500/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-mono mb-2">
              Mission Control Cockpit
            </h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Real-time telemetry overview, mission clocks, flight timeline progression, and live Recharts streams.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 backdrop-blur-xl hover:border-cyan-500/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-mono mb-2">
              Telemetry Analytics
            </h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Multi-sensor dynamics, historical time-range filters, cross-parameter correlation, and anomaly centers.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 backdrop-blur-xl hover:border-amber-500/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-105 transition-transform">
              <SearchCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-mono mb-2">
              AI Investigation Center
            </h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              System-generated diagnostic hypotheses, evidence dossiers, causal chains, and what-if simulation models.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800 backdrop-blur-xl hover:border-indigo-500/50 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white font-mono mb-2">
              Reports & Flight Replay
            </h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Chronological mission replay player, historical telemetry tables, printable PDF dossiers, and human validation.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/60 py-6 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between max-w-6xl mx-auto z-10 font-mono">
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <Sparkles className="w-3.5 h-3.5 text-teal-400/60" />
          <span>ASTRA AEROSPACE • AI TELEMETRY INTELLIGENCE</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Vercel + Render + MongoDB Atlas Persistent Stack</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
