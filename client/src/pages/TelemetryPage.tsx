import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  Thermometer,
  Gauge,
  TrendingUp,
  AlertTriangle,
  GitFork,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Sidebar } from "../components/Sidebar";
import { Navbar } from "../components/Navbar";
import { SystemStatusBar } from "../components/SystemStatusBar";
import { useMission } from "../context/MissionContext";

export const TelemetryPage: React.FC = () => {
  const navigate = useNavigate();
  const { history, latestTelemetry } = useMission();

  // Dynamics Filter States
  const [timeRange, setTimeRange] = useState<"1m" | "5m" | "15m" | "all">("5m");
  const [selectedSensor, setSelectedSensor] = useState<"ALL" | "TEMP" | "PRESS" | "VIB">("ALL");
  const [anomalyFilter, setAnomalyFilter] = useState<"ALL" | "CRITICAL" | "WARNING" | "NORMAL">("ALL");

  // Sensor Matrix Definitions (extensible architecture)
  const sensors = [
    {
      id: "SNS-T01",
      name: "Avionics Core Thermal Cell",
      type: "Temperature",
      value: latestTelemetry.temperature,
      unit: "°C",
      limit: 35.0,
      safeEnvelope: "15.0 - 35.0 °C",
      status: latestTelemetry.temperature > 35 ? "EXCURSION" : "NOMINAL",
      isBreached: latestTelemetry.temperature > 35,
      icon: Thermometer,
      accent: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/30",
    },
    {
      id: "SNS-P01",
      name: "Reaction Control Manifold",
      type: "Pressure",
      value: latestTelemetry.pressure,
      unit: "kPa",
      limit: 50.0,
      safeEnvelope: "20.0 - 50.0 kPa",
      status:
        latestTelemetry.pressure < 20 || latestTelemetry.pressure > 50
          ? "OUT_OF_BOUNDS"
          : "NOMINAL",
      isBreached: latestTelemetry.pressure < 20 || latestTelemetry.pressure > 50,
      icon: Gauge,
      accent: "text-cyan-400",
      bg: "bg-cyan-500/10 border-cyan-500/30",
    },
    {
      id: "SNS-V01",
      name: "Interstage Structural Triaxial",
      type: "Vibration",
      value: latestTelemetry.vibration,
      unit: "mm/s",
      limit: 5.0,
      safeEnvelope: "0.5 - 5.0 mm/s",
      status: latestTelemetry.vibration > 5.0 ? "OSCILLATION" : "NOMINAL",
      isBreached: latestTelemetry.vibration > 5.0,
      icon: Activity,
      accent: "text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/30",
    },
    // Extensible Modular Sensors Preview (demonstrates bus architecture)
    {
      id: "SNS-E01",
      name: "Main Power Bus Voltage (Aux)",
      type: "Voltage",
      value: 28.2,
      unit: "V",
      limit: 32.0,
      safeEnvelope: "24.0 - 32.0 V",
      status: "NOMINAL",
      isBreached: false,
      icon: Zap,
      accent: "text-teal-400",
      bg: "bg-teal-500/10 border-teal-500/30",
    },
  ];

  // Dynamics Filter data slicing
  const sliceCount = timeRange === "1m" ? 10 : timeRange === "5m" ? 25 : timeRange === "15m" ? 40 : 50;
  const dynamicsData = [...history]
    .reverse()
    .slice(-sliceCount)
    .map((record) => ({
      time: record.timestamp || "",
      temperature: Number(record.temperature),
      pressure: Number(record.pressure),
      vibration: Number(record.vibration),
      status: record.status,
    }));

  // Detected Anomalies generated from real history records
  const detectedAnomalies = history
    .filter((r) => r.status === "ANOMALY")
    .map((record, index) => {
      const isHigh = record.riskLevel === "High" || record.temperature > 40 || record.vibration > 6;
      const severity = isHigh ? "CRITICAL" : "WARNING";

      return {
        id: `ANM-${String(index + 1).padStart(3, "0")}`,
        temperature: record.temperature,
        pressure: record.pressure,
        vibration: record.vibration,
        severity,
        detectedTime: record.timestamp,
        status: index === 0 ? "OPEN" : "INVESTIGATING",
        cause: record.cause || "Thermal/Structural boundary exceedance",
        isCorrelated: record.temperature > 35 && record.vibration > 5,
      };
    });

  // Filtered anomalies
  const filteredAnomalies = detectedAnomalies.filter((a) => {
    if (anomalyFilter === "ALL") return true;
    return a.severity === anomalyFilter;
  });

  // Real-time Dynamic Correlation Engine (Calculated from actual telemetry values)
  const isTempHigh = latestTelemetry.temperature > 35;
  const isVibHigh = latestTelemetry.vibration > 5.0;
  const isPressDeviated = latestTelemetry.pressure < 20 || latestTelemetry.pressure > 50;

  const getCorrelationDetails = () => {
    if (isTempHigh && isVibHigh && isPressDeviated) {
      return {
        title: "COMPOUND TRIPLE-SUBSYSTEM EXCURSION",
        tags: ["Temp ↑ (>35°C)", "Vib ↑ (>5.0 mm/s)", "Pressure ⚠ (<20 or >50 kPa)"],
        relationship:
          "Simultaneous thermal overload, harmonic structural resonance, and pneumatic chamber deviation detected. Compounded multi-subsystem degradation.",
        riskLevel: "CRITICAL",
        recommendation: "Execute emergency avionics telemetry throttle and auxiliary cooling loop valve activation.",
      };
    }
    if (isTempHigh && isVibHigh) {
      return {
        title: "THERMAL-MECHANICAL HARMONIC COUPLING",
        tags: [`Temp: ${latestTelemetry.temperature}°C (Limit: 35°C)`, `Vib: ${latestTelemetry.vibration} mm/s (Limit: 5.0 mm/s)`],
        relationship:
          "Thermal dissipation degradation and structural vibration oscillation detected concurrently. Harmonic vibration exacerbates electronics thermal dissipation efficiency.",
        riskLevel: "CRITICAL",
        recommendation: "Activate stabilizer damping counter-thrust and throttle onboard payload compute clock.",
      };
    }
    if (isTempHigh && isPressDeviated) {
      return {
        title: "THERMAL & BAROMETRIC EXPANSION EVENT",
        tags: [`Temp: ${latestTelemetry.temperature}°C`, `Pressure: ${latestTelemetry.pressure} kPa`],
        relationship:
          "Elevated junction temperature correlated with reaction control pressure variance. Possible thermal expansion or coolant line regulator deviation.",
        riskLevel: "WARNING",
        recommendation: "Cycle pressure relief solenoid valve and verify active coolant circulation.",
      };
    }
    if (isVibHigh && isPressDeviated) {
      return {
        title: "PNEUMATIC CHATTER & MECHANICAL VIBRATION",
        tags: [`Vib: ${latestTelemetry.vibration} mm/s`, `Pressure: ${latestTelemetry.pressure} kPa`],
        relationship:
          "Pressure regulator fluctuation inducing acoustic harmonic resonance across interstage structure.",
        riskLevel: "WARNING",
        recommendation: "Verify RCS thruster valve seat damping.",
      };
    }
    return null;
  };

  const correlation = getCorrelationDetails();

  return (
    <div className="flex h-screen w-full bg-[#020409] text-slate-100 overflow-hidden font-mono antialiased">
      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar />
        <SystemStatusBar />

        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-8">
          {/* Page Title */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-teal-400" />
                <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wider text-white">
                  Telemetry & Sensor Analytics
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Multi-channel sensor dynamics, cross-parameter correlation matrix, and anomaly detection feed
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-teal-500/10 text-teal-300 border border-teal-500/30">
                4 BUS CHANNELS SYNCHRONIZED
              </span>
            </div>
          </div>

          {/* SECTION 1: REAL-TIME SENSOR MATRIX */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span>Real-Time Sensor Matrix</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (Modular Bus Integration)
                </span>
              </h2>
              <span className="text-[10px] text-slate-500">Live Avionics Feed</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sensors.map((sensor) => {
                const Icon = sensor.icon;
                return (
                  <div
                    key={sensor.id}
                    className={`p-4 rounded-xl border transition-all glass-surface backdrop-blur-xl ${
                      sensor.isBreached
                        ? "border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.2)] bg-rose-950/20"
                        : "border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-slate-500 font-bold">{sensor.id}</span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          sensor.isBreached
                            ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                        }`}
                      >
                        {sensor.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`p-2 rounded-lg border ${sensor.bg} ${sensor.accent}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold text-slate-200 truncate">{sensor.name}</div>
                    </div>

                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-800/60">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-2xl font-extrabold ${
                            sensor.isBreached ? "text-rose-400" : "text-white"
                          }`}
                        >
                          {sensor.value.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">{sensor.unit}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Limit: {sensor.limit}</div>
                    </div>

                    <div className="text-[9px] text-slate-500 mt-1">
                      Safe: {sensor.safeEnvelope}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECTION 4: CORRELATION VIEW (Dynamic Cross-Sensor Analysis) */}
          <section className="glass-surface rounded-2xl p-6 border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-cyan-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  Cross-Parameter Correlation Engine
                </h2>
              </div>
              <span className="text-[10px] text-slate-500">
                Calculated from current telemetry values
              </span>
            </div>

            {correlation ? (
              <div className="p-5 rounded-xl bg-gradient-to-r from-rose-950/30 via-slate-900/60 to-slate-950/80 border border-rose-500/40 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                      CORRELATED ANOMALOUS EVENT DETECTED
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50">
                    {correlation.riskLevel} COMPOUND RISK
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2">{correlation.title}</h3>

                <div className="flex flex-wrap gap-2 mb-3">
                  {correlation.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/15 border border-rose-500/30 text-rose-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {correlation.relationship}
                </p>

                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-teal-400 font-bold uppercase text-[10px] block">
                      Recommended Mitigation Action:
                    </span>
                    <span>{correlation.recommendation}</span>
                  </div>
                  <button
                    onClick={() => navigate("/investigation")}
                    className="px-3.5 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 hover:bg-teal-400 transition-colors shrink-0 cursor-pointer"
                  >
                    <span>Investigate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-xs font-bold text-slate-300 uppercase">
                  No Cross-Parameter Anomalous Correlation Detected
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Sensors are either nominal or operating within decoupled single-channel boundaries.
                  To test correlation, click "Inject Anomaly" above.
                </div>
              </div>
            )}
          </section>

          {/* SECTION 2: TELEMETRY DYNAMICS (Interactive Large Charts) */}
          <section className="glass-surface rounded-2xl p-6 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  Telemetry Dynamics (Interactive Multi-Axis)
                </h2>
              </div>

              {/* Controls: Time Range & Sensor Switcher */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Time Range Selector */}
                <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs">
                  {(["1m", "5m", "15m", "all"] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        timeRange === range
                          ? "bg-teal-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {range.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Sensor Switcher */}
                <div className="flex items-center rounded-lg bg-slate-950 border border-slate-800 p-0.5 text-xs">
                  {(["ALL", "TEMP", "PRESS", "VIB"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSensor(s)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        selectedSensor === s
                          ? "bg-cyan-500 text-slate-950 font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Large Interactive Dynamics Chart */}
            <div className="h-72 sm:h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynamicsData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={{ stroke: "#334155" }} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={{ stroke: "#334155" }} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl font-mono text-xs shadow-2xl">
                            <div className="text-slate-400 mb-1 border-b border-slate-800 pb-1">
                              Time: {label}
                            </div>
                            {payload.map((entry: any, i: number) => (
                              <div key={i} className="flex justify-between gap-4 py-0.5">
                                <span style={{ color: entry.color }}>{entry.name}:</span>
                                <span className="font-bold text-white">
                                  {entry.value} {entry.unit}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={35} stroke="#f43f5e" strokeDasharray="3 3" />
                  <ReferenceLine y={5.0} stroke="#f43f5e" strokeDasharray="3 3" />

                  {(selectedSensor === "ALL" || selectedSensor === "TEMP") && (
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      name="Temperature"
                      unit="°C"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}

                  {(selectedSensor === "ALL" || selectedSensor === "PRESS") && (
                    <Line
                      type="monotone"
                      dataKey="pressure"
                      name="Pressure"
                      unit="kPa"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}

                  {(selectedSensor === "ALL" || selectedSensor === "VIB") && (
                    <Line
                      type="monotone"
                      dataKey="vibration"
                      name="Vibration"
                      unit="mm/s"
                      stroke="#818cf8"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* SECTION 3: ANOMALY CENTER */}
          <section className="glass-surface rounded-2xl p-6 border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  Anomaly Center ({filteredAnomalies.length} Detected)
                </h2>
              </div>

              {/* Anomaly Filters */}
              <div className="flex items-center gap-1.5 text-xs">
                {(["ALL", "CRITICAL", "WARNING"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setAnomalyFilter(filter)}
                    className={`px-3 py-1 rounded-md border text-[11px] font-bold transition-colors ${
                      anomalyFilter === filter
                        ? "bg-slate-800 border-teal-400 text-teal-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {filteredAnomalies.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500 font-mono">
                No anomalous occurrences matching the current filter. Transmit out-of-envelope telemetry or click "Inject Anomaly".
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAnomalies.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-teal-400">{item.id}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              item.severity === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            }`}
                          >
                            {item.severity}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                            {item.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-center">
                        <div>
                          <div className="text-[9px] text-slate-500">TEMP</div>
                          <div
                            className={`text-xs font-bold ${
                              item.temperature > 35 ? "text-rose-400" : "text-slate-300"
                            }`}
                          >
                            {item.temperature}°C
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-500">PRESSURE</div>
                          <div
                            className={`text-xs font-bold ${
                              item.pressure < 20 || item.pressure > 50
                                ? "text-rose-400"
                                : "text-slate-300"
                            }`}
                          >
                            {item.pressure} kPa
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-500">VIBRATION</div>
                          <div
                            className={`text-xs font-bold ${
                              item.vibration > 5.0 ? "text-rose-400" : "text-slate-300"
                            }`}
                          >
                            {item.vibration} mm/s
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 font-semibold mb-1">
                        Cause: {item.cause}
                      </div>
                      <div className="text-[10px] text-slate-500 mb-3">
                        Detected: {item.detectedTime}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate("/investigation")}
                      className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 hover:border-teal-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>Investigate in AI Center</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default TelemetryPage;
