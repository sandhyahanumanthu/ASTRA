import React from "react";
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
import { Thermometer, Activity, TrendingUp } from "lucide-react";
import type { TelemetryResponse } from "../pages/Dashboard";

interface TelemetryChartsProps {
  history: TelemetryResponse[];
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ history }) => {
  // Chronological order (oldest to newest, left to right)
  const chartData = [...history].reverse().map((record) => ({
    time: record.timestamp,
    temperature: record.temperature,
    vibration: record.vibration,
    pressure: record.pressure,
    status: record.status,
  }));

  // Custom dark-mode tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isAnomaly = data.status === "ANOMALY";
      return (
        <div className="bg-[#0b1329]/95 backdrop-blur-xl border border-slate-700/80 rounded-xl p-3 shadow-2xl font-mono text-xs z-50">
          <div className="text-[10px] text-slate-400 mb-1 border-b border-slate-800 pb-1 flex items-center justify-between gap-3">
            <span>{label}</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                isAnomaly
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}
            >
              {data.status}
            </span>
          </div>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5">
              <span className="text-slate-400 capitalize">{entry.name}:</span>
              <span className="font-bold text-white">
                {entry.value} {entry.unit}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <section className="w-full max-w-5xl mx-auto mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-teal-400" />
          <span>Real-time Telemetry Telemetry Trends</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>AUTO-SYNC (3S)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CHART 1: Temperature Over Time */}
        <div className="glass-surface rounded-2xl p-5 border border-slate-800/90 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  Temperature Over Time
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  Thermal Sensor Limit: &le; 35°C
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Live °C
            </span>
          </div>

          {chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs font-mono text-slate-500">
              Awaiting telemetry telemetry broadcast...
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    domain={[10, 55]}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                    unit="°"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={35}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: "Threshold 35°C",
                      fill: "#f43f5e",
                      fontSize: 9,
                      position: "insideTopRight",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature"
                    unit="°C"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{
                      r: 3,
                      fill: "#f59e0b",
                      stroke: "#020409",
                      strokeWidth: 1.5,
                    }}
                    activeDot={{
                      r: 5,
                      fill: "#fbbf24",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    isAnimationActive={true}
                    animationDuration={600}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* CHART 2: Vibration Over Time */}
        <div className="glass-surface rounded-2xl p-5 border border-slate-800/90 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                  Vibration Amplitude
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  Mechanical Limit: &le; 5.0 mm/s
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              Live mm/s
            </span>
          </div>

          {chartData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-xs font-mono text-slate-500">
              Awaiting telemetry telemetry broadcast...
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={10}
                    domain={[0, 10]}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={5.0}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: "Threshold 5.0 mm/s",
                      fill: "#f43f5e",
                      fontSize: 9,
                      position: "insideTopRight",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="vibration"
                    name="Vibration"
                    unit="mm/s"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{
                      r: 3,
                      fill: "#6366f1",
                      stroke: "#020409",
                      strokeWidth: 1.5,
                    }}
                    activeDot={{
                      r: 5,
                      fill: "#818cf8",
                      stroke: "#fff",
                      strokeWidth: 2,
                    }}
                    isAnimationActive={true}
                    animationDuration={600}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
