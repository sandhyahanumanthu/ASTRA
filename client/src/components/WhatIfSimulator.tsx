import React, { useState } from "react";
import { Sliders, Play, AlertTriangle, CheckCircle2, ShieldAlert, RotateCcw } from "lucide-react";
import { runSimulation } from "../api";
import type { SimulationResult } from "../types/telemetry";

export const WhatIfSimulator: React.FC = () => {
  const [simTemp, setSimTemp] = useState<number>(36.5);
  const [simPress, setSimPress] = useState<number>(35.0);
  const [simVib, setSimVib] = useState<number>(5.4);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await runSimulation({
        temperature: Number(simTemp),
        pressure: Number(simPress),
        vibration: Number(simVib),
      });
      setResult(res);
    } catch {
      // Offline fallback deterministic evaluation
      const isTempBreached = simTemp > 35;
      const isVibBreached = simVib > 5.0;
      const isPressBreached = simPress < 20 || simPress > 50;

      const classification =
        (simTemp > 40 && simVib > 6.0) || (isTempBreached && isVibBreached)
          ? "CRITICAL"
          : isTempBreached || isVibBreached || isPressBreached
          ? "WARNING"
          : "NORMAL";

      setResult({
        mode: "SIMULATION_WHAT_IF (OFFLINE_ENGINE)",
        disclaimer: "Deterministic telemetry threshold model executed in client sandbox.",
        inputs: { temperature: simTemp, pressure: simPress, vibration: simVib },
        classification,
        status: classification === "NORMAL" ? "NORMAL" : "ANOMALY",
        riskLevel: classification === "CRITICAL" ? "High" : classification === "WARNING" ? "Medium" : "Low",
        cause:
          classification === "CRITICAL"
            ? "Compound thermal & vibration safety ceiling breach"
            : classification === "WARNING"
            ? "Single-subsystem threshold deviation"
            : "All simulated inputs within nominal flight envelope",
        explanation: "Simulated scenario projection based on configured threshold boundaries.",
        safetyMargins: {
          thermalMargin: `${(35.0 - simTemp).toFixed(1)} °C`,
          vibrationMargin: `${(5.0 - simVib).toFixed(2)} mm/s`,
          pressureMargin: `${(simPress < 20 ? simPress - 20 : 50 - simPress).toFixed(1)} kPa`,
        },
        hypotheses: [],
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSimTemp(25.0);
    setSimPress(35.0);
    setSimVib(1.5);
    setResult(null);
  };

  return (
    <div className="glass-surface rounded-2xl p-6 border border-slate-800 shadow-2xl backdrop-blur-xl">
      {/* Disclaimer Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
              What-If Scenario Simulation
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Non-destructive parametric sensitivity sandbox for anomalous trajectory projection
          </p>
        </div>

        <div className="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
          SIMULATION / WHAT-IF (NON-DESTRUCTIVE)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders Console */}
        <div className="space-y-5 p-5 rounded-xl bg-slate-950/70 border border-slate-800 font-mono">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-2">
            Adjust Flight Sensor Inputs
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Core Temperature (°C):</span>
              <span
                className={`font-bold ${
                  simTemp > 35 ? "text-rose-400 font-extrabold" : "text-emerald-300"
                }`}
              >
                {simTemp.toFixed(1)} °C
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="55"
              step="0.5"
              value={simTemp}
              onChange={(e) => setSimTemp(parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>10°C (Min)</span>
              <span className="text-amber-500">Threshold: 35°C</span>
              <span>55°C (Max)</span>
            </div>
          </div>

          {/* Pressure Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Barometric Pressure (kPa):</span>
              <span
                className={`font-bold ${
                  simPress < 20 || simPress > 50 ? "text-rose-400" : "text-emerald-300"
                }`}
              >
                {simPress.toFixed(1)} kPa
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="65"
              step="0.5"
              value={simPress}
              onChange={(e) => setSimPress(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>10 kPa (Min)</span>
              <span className="text-cyan-400">Safe: 20-50 kPa</span>
              <span>65 kPa (Max)</span>
            </div>
          </div>

          {/* Vibration Slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">Vibration Amplitude (mm/s):</span>
              <span
                className={`font-bold ${
                  simVib > 5.0 ? "text-rose-400 font-extrabold" : "text-emerald-300"
                }`}
              >
                {simVib.toFixed(2)} mm/s
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="12.0"
              step="0.1"
              value={simVib}
              onChange={(e) => setSimVib(parseFloat(e.target.value))}
              className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.5 mm/s (Min)</span>
              <span className="text-indigo-400">Limit: 5.0 mm/s</span>
              <span>12.0 mm/s (Max)</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              onClick={handleSimulate}
              disabled={loading}
              id="run-what-if-simulation-btn"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-95 shadow-[0_0_20px_rgba(45,212,191,0.35)] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{loading ? "Computing Simulation..." : "Run What-If Simulation"}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Reset Sliders to Nominal"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Prediction Results Card */}
        <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 font-mono flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Predicted Classification
              </span>
              {result && (
                <span className="text-[10px] text-slate-500">
                  Computed at {result.timestamp}
                </span>
              )}
            </div>

            {result ? (
              <div className="space-y-4">
                {/* Classification Hero Badge */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    result.classification === "CRITICAL"
                      ? "bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.3)]"
                      : result.classification === "WARNING"
                      ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                      : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.classification === "CRITICAL" ? (
                      <ShieldAlert className="w-6 h-6 text-rose-400" />
                    ) : result.classification === "WARNING" ? (
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    )}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400">
                        Predicted System State
                      </div>
                      <div className="text-xl font-extrabold tracking-wider">
                        {result.classification}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold uppercase px-3 py-1 rounded-full bg-black/40 border border-white/10">
                    {result.riskLevel} RISK
                  </span>
                </div>

                {/* Projected Cause / Note */}
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                    Projected Diagnostic Assessment
                  </div>
                  <div className="text-white font-semibold mb-1">{result.cause}</div>
                  <div className="text-slate-400 text-[11px] leading-relaxed">
                    {result.explanation}
                  </div>
                </div>

                {/* Safety Margins */}
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">
                    Safety Margin Headroom
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Thermal</div>
                      <div className="font-bold text-slate-200">
                        {result.safetyMargins.thermalMargin}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Pneumatic</div>
                      <div className="font-bold text-slate-200">
                        {result.safetyMargins.pressureMargin}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-[10px] text-slate-500">Vibration</div>
                      <div className="font-bold text-slate-200">
                        {result.safetyMargins.vibrationMargin}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Adjust the sensor sliders on the left and click "Run What-If Simulation" to predict
                spacecraft diagnostic outcomes.
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-500 mt-4 pt-3 border-t border-slate-800/60 italic">
            * Note: What-if model applies deterministic aerospace envelope rules. Not a physical orbital flight simulator.
          </div>
        </div>
      </div>
    </div>
  );
};
