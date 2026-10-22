import { useEffect, useState } from 'react';
import api from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/analytics/overview')
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load analytics'));
  }, []);

  if (error) {
    return (
      <div className="page">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!data) {
    return <div className="loading">Loading research intelligence…</div>;
  }

  const statuses = Object.entries(data.experimentStatus).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">RESEARCH INTELLIGENCE</span>
          <h2>Institution Analytics</h2>
          <p className="muted">
            Metrics calculated from recorded experiments, bookings, detector datasets, and equipment telemetry.
          </p>
        </div>
      </div>

      <div className="metric-grid">
        <Metric label="Active Researchers" value={data.counts.researchers} hint="Verified accounts" />
        <Metric label="Total Experiments" value={data.counts.experiments} hint="All lifecycle states" />
        <Metric label="Usage Hours" value={data.usageHours} hint="Approved beam & run time" />
        <Metric label="Average Utilization" value={`${data.averageUtilization}%`} hint="Across active detectors" />
        <Metric label="Catalogued Datasets" value={data.counts.datasets} hint="Evidence files" />
        <Metric label="Storage Consumed" value={`${(data.storageBytes / 1024 / 1024).toFixed(2)} MB`} hint="Upload directory" />
      </div>

      <div className="grid-2">
        <section className="card chart-card">
          <h3>Experiment Lifecycle Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statuses}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="card chart-card">
          <h3>Equipment Utilization Benchmark</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.equipment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="utilization" fill="var(--olive)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="card chart-card" style={{ marginTop: '18px' }}>
        <h3>Dataset Upload Activity Over Time</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.uploads}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="var(--accent)"
              strokeWidth={3}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}

function Metric({ label, value, hint }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </div>
  );
}
