import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function TemperatureChart({ data }) {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        Waiting for temperature readings from Node-RED…
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 12 }}
            stroke="#94a3b8"
            unit="°C"
          />
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
            formatter={(value) => [`${Number(value).toFixed(1)}°C`, 'Temperature']}
          />
          <Line
            type="monotone"
            dataKey="temperature"
            stroke="#0d9488"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
