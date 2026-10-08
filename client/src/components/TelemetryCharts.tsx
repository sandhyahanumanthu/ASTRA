import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Thermometer, Gauge, Activity, TrendingUp } from "lucide-react";
import { useMission } from "../context/MissionContext";
import type { TelemetryRecord } from "../types/telemetry";

interface TelemetryChartsProps {
  history?: TelemetryRecord[];
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ history: propHistory }) => {
  const { history: contextHistory, isStreaming } = useMission();
  const rawHistory = propHistory || contextHistory;

  // Chart displays chronologically from left to right (oldest to newest)
  const chartData = [...rawHistory]
    .reverse()
    .slice(-20)
    .map((record) => ({
      time: record.timestamp || "",
      temperature: Number(record.temperature),
      pressure: Number(record.pressure),
      vibration: Number(record.vibration),
      status: record.status,
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-xl font-mono text-xs z-50">
          <p className="text-slate-400 font-semibold mb-1 border-b border-slate-800 pb-1">
            Time: {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
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
    <section className="w-full mx-auto mb-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2 font-mono">
          <TrendingUp className="w-4 h-4 text-teal-400" />
          <span>Real-time Telemetry Dynamics</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span
            className={`w-2 h-2 rounded-full ${
              isStreaming ? "bg-teal-400 animate-ping" : "bg-emerald-400"
            }`}
          />
          <span className={isStreaming ? "text-teal-300 font-bold" : "text-slate-400"}>
            {isStreaming ? "LIVE ● STREAMING (3S)" : "AUTO-SYNC ACTIVE"}
          </span>
        </div>
      </div>

      {/* 3 Real-time Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CHART 1: Temperature vs Time */}
        <div className="glass-surface rounded-2xl p-5 border border-slate-800/90 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
                  Temperature
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">Limit: &le; 35°C</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Live °C
            </span>
          </div>

          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs font-mono text-slate-500">
              Awaiting telemetry broadcast...
            </div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} axisLine={{ stroke: "#334155" }} />
                  <YAxis stroke="#64748b" fontSize={9} domain={[15, 55]} tickLine={false} axisLine={{ stroke: "#334155" }} unit="°" />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={35}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: "35°C", fill: "#f43f5e", fontSize: 9, position: "insideTopRight" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    name="Temperature"
                    unit="°C"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: "#f59e0b", stroke: "#020409", strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: "#fbbf24", stroke: "#fff", strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* CHART 2: Pressure vs Time */}
        <div className="glass-surface rounded-2xl p-5 border border-slate-800/90 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
                  Pressure
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">Envelope: 20-50 kPa</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded-full">
              Live kPa
            </span>
          </div>

          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs font-mono text-slate-500">
              Awaiting telemetry broadcast...
            </div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} axisLine={{ stroke: "#334155" }} />
                  <YAxis stroke="#64748b" fontSize={9} domain={[10, 60]} tickLine={false} axisLine={{ stroke: "#334155" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={50}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: "50 kPa", fill: "#f43f5e", fontSize: 9, position: "insideTopRight" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="pressure"
                    name="Pressure"
                    unit="kPa"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: "#06b6d4", stroke: "#020409", strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: "#67e8f9", stroke: "#fff", strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* CHART 3: Vibration vs Time */}
        <div className="glass-surface rounded-2xl p-5 border border-slate-800/90 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
                  Vibration
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">Limit: &le; 5.0 mm/s</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              Live mm/s
            </span>
          </div>

          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs font-mono text-slate-500">
              Awaiting telemetry broadcast...
            </div>
          ) : (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={9} tickLine={false} axisLine={{ stroke: "#334155" }} />
                  <YAxis stroke="#64748b" fontSize={9} domain={[0, 10]} tickLine={false} axisLine={{ stroke: "#334155" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine
                    y={5.0}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{ value: "5.0 mm/s", fill: "#f43f5e", fontSize: 9, position: "insideTopRight" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="vibration"
                    name="Vibration"
                    unit="mm/s"
                    stroke="#818cf8"
                    strokeWidth={2.5}
                    dot={{ r: 2.5, fill: "#818cf8", stroke: "#020409", strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: "#c7d2fe", stroke: "#fff", strokeWidth: 2 }}
                    isAnimationActive={false}
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
export default TelemetryCharts;
