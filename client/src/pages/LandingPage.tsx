import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ArrowRight, Sparkles, Globe } from "lucide-react";
import { RocketCanvas } from "../components/RocketCanvas";
import { API } from "../api";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isLaunching, setIsLaunching] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  // Check backend server status
  useEffect(() => {
    let isMounted = true;
    const checkServer = async () => {
      try {
        await API.get("/");
        if (isMounted) setApiOnline(true);
      } catch {
        if (isMounted) setApiOnline(false);
      }
    };
    checkServer();
    return () => {
      isMounted = false;
    };
  }, []);

  // When "Click to Launch" button is clicked → navigate to "/dashboard"
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

    // Fallback timer to guarantee navigation
    setTimeout(() => {
      navigate("/dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#020409] text-slate-100 flex flex-col justify-between space-gradient-bg antialiased relative selection:bg-teal-500/25 selection:text-teal-200 overflow-hidden">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-10 py-5 flex items-center justify-between pointer-events-none backdrop-blur-md bg-[#020409]/30 border-b border-white/[0.03]">
        <div className="flex items-center gap-2.5 pointer-events-auto">
          <span className="font-serif-display text-2xl tracking-wide bg-gradient-to-r from-white via-slate-100 to-teal-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(45,212,191,0.35)] select-none">
            ASTRA
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400/80 px-2 py-0.5 rounded-full border border-teal-500/20 bg-teal-500/10">
            Avionics
          </span>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <div
            title={`Backend: ${import.meta.env.VITE_API_URL || "https://astra-backend-87xd.onrender.com"}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono tracking-wider bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl text-slate-400"
          >
            <Globe
              className={`w-3.5 h-3.5 ${
                apiOnline === true
                  ? "text-teal-400 animate-pulse"
                  : apiOnline === false
                  ? "text-rose-400"
                  : "text-slate-500"
              }`}
            />
            <span className="text-[11px]">
              {apiOnline === true
                ? "API CONNECTED"
                : apiOnline === false
                ? "OFFLINE / CHECKING"
                : "INITIALIZING..."}
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, filter: "blur(10px)" }}
        transition={{ duration: 0.8 }}
        className="relative w-full min-h-screen flex flex-col justify-center items-center px-4 pt-16 pb-8 z-10"
      >
        {/* 3D Interactive Rocket Canvas */}
        <RocketCanvas isLaunching={isLaunching} />

        {/* Central Call to Action */}
        <div className="launchpad-branding relative z-20 flex flex-col items-center text-center my-auto pointer-events-auto max-w-lg mx-auto">
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-[11px] font-mono tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(45,212,191,0.15)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>REAL-TIME TELEMETRY SUITE</span>
          </motion.div>

          {/* Title: ASTRA */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-serif-display text-8xl sm:text-9xl md:text-[10rem] font-normal tracking-tight mb-3 select-none drop-shadow-[0_0_60px_rgba(45,212,191,0.5)]"
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
            className="text-slate-400 text-sm sm:text-base font-light tracking-wide max-w-sm mx-auto mb-10 drop-shadow"
          >
            Autonomous avionics telemetry & anomaly intelligence system
          </motion.p>

          {/* Click to Launch Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="relative group cursor-pointer"
          >
            <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 opacity-60 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-300" />

            <button
              onClick={handleLaunch}
              disabled={isLaunching}
              id="click-to-launch-btn"
              className="relative px-9 py-4 sm:px-11 sm:py-4.5 rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400 text-slate-950 font-extrabold text-sm sm:text-base tracking-wider uppercase flex items-center gap-3 shadow-[0_0_35px_rgba(45,212,191,0.55)] group-hover:shadow-[0_0_50px_rgba(52,211,153,0.85)] border border-teal-100/50 cursor-pointer transition-shadow duration-300 select-none"
            >
              {isLaunching ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Igniting Propulsion...</span>
                </>
              ) : (
                <>
                  <span>Click to Launch</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </>
              )}
            </button>
          </motion.div>
        </div>

        {/* Footer info */}
        <div className="relative z-20 text-center text-xs font-mono text-slate-500 mt-auto flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-500/50" />
          <span>Astra Aerospace Avionics • Space Flight Diagnostic Engine</span>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
