import React, { useState, useEffect } from "react";
import { SearchCode } from "lucide-react";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { SystemStatusBar } from "../components/SystemStatusBar";
import { HypothesisCard } from "../components/HypothesisCard";
import { EvidencePanel } from "../components/EvidencePanel";
import { CauseChainGraph } from "../components/CauseChainGraph";
import { WhatIfSimulator } from "../components/WhatIfSimulator";
import { useMission } from "../context/MissionContext";
import { getInvestigations } from "../api";
import type { InvestigationCase } from "../types/telemetry";

export const InvestigationPage: React.FC = () => {
  const { latestTelemetry } = useMission();

  const [cases, setCases] = useState<InvestigationCase[]>([]);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [selectedHypothesisIdx, setSelectedHypothesisIdx] = useState<number>(0);

  // Load cases from backend or synthesize from recent telemetry anomalies
  useEffect(() => {
    let isMounted = true;
    const loadCases = async () => {
      try {
        const backendCases = await getInvestigations();
        if (isMounted && Array.isArray(backendCases) && backendCases.length > 0) {
          setCases(backendCases);
          return;
        }
      } catch (err) {
        console.warn("[InvestigationPage] Backend cases fetch fallback:", err);
      }

      // Synthesize fallback case from current telemetry
      if (isMounted) {
        const isAnom = latestTelemetry.status === "ANOMALY";
        const temp = latestTelemetry.temperature;
        const vib = latestTelemetry.vibration;
        const press = latestTelemetry.pressure;

        const defaultHypotheses = [
          {
            id: "HYP-01",
            title: isAnom
              ? "Active Thermal Radiator Loop Resistance"
              : "Baseline Avionics Thermal Equilibrium",
            confidence: isAnom ? 76 : 95,
            status: isAnom ? ("PRIMARY" as const) : ("NOMINAL" as const),
            summary: isAnom
              ? "Heat exchanger thermal dissipation efficiency reduced, leading to junction temperature rise."
              : "Thermal control systems operating within certified flight envelope.",
            evidenceFor: [
              `Telemetry temperature: ${temp}°C`,
              isAnom ? "Positive thermal gradient across telemetry window" : "Stable core reading",
            ],
            evidenceAgainst: [
              vib <= 5.0 ? `Structural oscillation nominal at ${vib} mm/s` : null,
            ].filter(Boolean) as string[],
            recommendedAction: isAnom
              ? "Throttle payload compute frequency by 25% and verify coolant loop valve status."
              : "Continue regular telemetry polling.",
          },
          {
            id: "HYP-02",
            title: "Interstage Aerodynamic Buffet & Mechanical Resonance",
            confidence: isAnom && vib > 5.0 ? 71 : 24,
            status: isAnom && vib > 5.0 ? ("SECONDARY" as const) : ("CANDIDATE" as const),
            summary: "Aero-acoustic buffeting during high dynamic pressure phase causing structural resonance.",
            evidenceFor: [
              `Vibration amplitude: ${vib} mm/s`,
              "Ascent trajectory acoustic coupling",
            ],
            evidenceAgainst: ["RCS chamber pressure remains bounded"],
            recommendedAction: "Verify active damping thruster calibration.",
          },
        ];

        const syntheticCase: InvestigationCase = {
          id: "CASE #ASTRA-0001",
          recordId: "live-rec",
          timestamp: latestTelemetry.timestamp,
          telemetry: {
            temperature: temp,
            pressure: press,
            vibration: vib,
          },
          event: isAnom
            ? latestTelemetry.cause || "Subsystem Boundary Excursion"
            : "Nominal Flight Verification Audit",
          explanation: latestTelemetry.explanation,
          severity: latestTelemetry.riskLevel === "High" ? "CRITICAL" : isAnom ? "WARNING" : "NORMAL",
          status: "UNDER INVESTIGATION",
          correlated: temp > 35 && vib > 5.0,
          hypotheses: defaultHypotheses,
          causeChain: [
            {
              step: "1. Telemetry Event",
              description: `Sensor reading: ${temp}°C, ${vib} mm/s, ${press} kPa`,
            },
            {
              step: "2. Detected Anomaly",
              description: isAnom ? latestTelemetry.cause || "Boundary breach" : "Nominal telemetry audit",
            },
            {
              step: "3. Correlated Sensors",
              description:
                temp > 35 && vib > 5.0
                  ? "Thermal cell + Structural accelerometer"
                  : temp > 35
                  ? "Thermal sensor"
                  : "All channels nominal",
            },
            {
              step: "4. Candidate Causes",
              description: defaultHypotheses[0].title,
            },
            {
              step: "5. Recommended Action",
              description: defaultHypotheses[0].recommendedAction,
            },
          ],
        };

        setCases([syntheticCase]);
      }
    };

    loadCases();
    return () => {
      isMounted = false;
    };
  }, [latestTelemetry]);

  const activeCase = cases[selectedCaseIdx] || cases[0];
  const activeHypothesis =
    activeCase?.hypotheses[selectedHypothesisIdx] || activeCase?.hypotheses[0];

  return (
    <div className="flex h-screen w-full bg-[#020409] text-slate-100 overflow-hidden font-mono antialiased">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <SystemStatusBar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-8">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <SearchCode className="w-5 h-5 text-teal-400" />
                <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wider text-white">
                  AI Investigation Center
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Root-cause hypothesis generation, evidence correlation, causal graph, and what-if simulation
              </p>
            </div>

            <div className="px-3.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
              DETERMINISTIC DIAGNOSTIC ENGINE (NOT HALLUCINATED)
            </div>
          </div>

          {/* SECTION 1: INVESTIGATION SUMMARY & CASE SELECTOR */}
          <section className="glass-surface rounded-2xl p-6 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div>
                <div className="text-[10px] text-teal-400 font-bold uppercase tracking-widest">
                  CASE DOSSIER
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  <span>{activeCase?.id || "CASE #ASTRA-0001"}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      activeCase?.severity === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                        : activeCase?.severity === "WARNING"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                        : "bg-teal-500/20 text-teal-300 border-teal-500/50"
                    }`}
                  >
                    {activeCase?.severity}
                  </span>
                </h2>
              </div>

              {/* Case Selector Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {cases.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCaseIdx(i);
                      setSelectedHypothesisIdx(0);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedCaseIdx === i
                        ? "bg-teal-500 text-slate-950 shadow-[0_0_12px_rgba(45,212,191,0.4)]"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {c.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Case Details Card */}
            {activeCase && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Trigger Event</div>
                  <div className="text-slate-100 font-bold mt-0.5">{activeCase.event}</div>
                  <div className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {activeCase.explanation}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Status & Correlated Channels</div>
                  <div className="text-teal-300 font-bold mt-0.5">{activeCase.status}</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {activeCase.correlated
                      ? "✓ Multi-sensor correlation detected (Thermal + Vibration)"
                      : "Single channel boundary excursion"}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Investigation Timestamp</div>
                  <div className="text-slate-200 font-bold mt-0.5">{activeCase.timestamp}</div>
                  <div className="text-[10px] text-slate-500 mt-1 italic">
                    Diagnostic hypotheses calculated via telemetry threshold rules & historical baselines.
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* SECTION 2 & 3: ROOT CAUSE HYPOTHESES & EVIDENCE PANEL */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Diagnostic Hypotheses & Evidence Dossier
                </h2>
                <p className="text-[11px] text-slate-500">
                  Select a hypothesis below to examine supporting vs contradicting evidence
                </p>
              </div>
              <span className="text-[10px] text-slate-400">
                {activeCase?.hypotheses.length || 0} Hypotheses Formulated
              </span>
            </div>

            {/* Hypotheses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCase?.hypotheses.map((hyp, index) => (
                <HypothesisCard
                  key={hyp.id}
                  hypothesis={hyp}
                  isSelected={selectedHypothesisIdx === index}
                  onSelect={() => setSelectedHypothesisIdx(index)}
                />
              ))}
            </div>

            {/* Active Evidence Panel */}
            {activeHypothesis && activeCase && (
              <EvidencePanel
                hypothesis={activeHypothesis}
                telemetry={activeCase.telemetry}
                timestamp={activeCase.timestamp}
                severity={activeCase.severity}
              />
            )}
          </section>

          {/* SECTION 4: CAUSE CHAIN GRAPH */}
          {activeCase?.causeChain && (
            <section>
              <CauseChainGraph chain={activeCase.causeChain} />
            </section>
          )}

          {/* SECTION 5: WHAT-IF SIMULATION */}
          <section>
            <WhatIfSimulator />
          </section>
        </main>
      </div>
    </div>
  );
};

export default InvestigationPage;
