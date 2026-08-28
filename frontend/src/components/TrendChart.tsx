import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface SeriesConfig {
  key: string;
  color: string;
  label: string;
}

export function TrendChart({
  data,
  series,
  yLabel,
  height = 220,
}: {
  data: Record<string, any>[];
  series: SeriesConfig[];
  yLabel?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis dataKey="t" tick={{ fill: "#7a8ba1", fontSize: 11 }} axisLine={{ stroke: "#2a3a4d" }} />
        <YAxis
          tick={{ fill: "#7a8ba1", fontSize: 11 }}
          axisLine={{ stroke: "#2a3a4d" }}
          label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", fill: "#7a8ba1", fontSize: 11 } : undefined}
        />
        <Tooltip
          contentStyle={{ background: "#161f2c", border: "1px solid #2a3a4d", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#e5edf5" }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
