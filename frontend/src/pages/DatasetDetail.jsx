import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import api from '../services/api';

export default function DatasetDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [allDatasets, setAllDatasets] = useState([]);
  const [compareId, setCompareId] = useState('');
  const [compareData, setCompareData] = useState(null);
  const [selectedColIndex, setSelectedColIndex] = useState(0);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api
      .get(`/datasets/${id}`)
      .then((r) => setData(r.data))
      .catch((e) => setError(e.response?.data?.message || 'Could not load dataset details'));

    api
      .get('/datasets')
      .then((r) => setAllDatasets(r.data.filter((d) => d._id !== id)))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!compareId) {
      setCompareData(null);
      return;
    }
    api
      .get(`/datasets/${compareId}`)
      .then((r) => setCompareData(r.data))
      .catch(() => setCompareData(null));
  }, [compareId]);

  const download = async () => {
    setDownloading(true);
    try {
      const r = await api.get(`/datasets/${id}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = data?.dataset?.originalName || 'dataset.file';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(e.response?.data?.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (error) {
    return (
      <div className="page">
        <div className="error">{error}</div>
      </div>
    );
  }
  if (!data) {
    return <div className="loading">Loading dataset telemetry…</div>;
  }

  const { dataset, visualization } = data;
  const numericCols = visualization?.numeric || [];
  const activeCol = numericCols[selectedColIndex] || numericCols[0];

  // Primary chart series values
  const primaryValues = activeCol
    ? visualization.rows.map((r) => r[activeCol.index]).filter((x) => typeof x === 'number')
    : [];

  // Secondary comparative series
  const compVisual = compareData?.visualization;
  const compCol = compVisual?.numeric?.[0];

  const maxRows = Math.max(
    visualization?.rows?.length || 0,
    compVisual?.rows?.length || 0
  );

  const mergedChartData = [];
  for (let i = 0; i < maxRows; i++) {
    const item = { index: i + 1 };
    if (visualization?.rows?.[i] && activeCol) {
      const val = visualization.rows[i][activeCol.index];
      if (typeof val === 'number') item[dataset.originalName] = val;
    }
    if (compVisual?.rows?.[i] && compCol && compareData) {
      const val = compVisual.rows[i][compCol.index];
      if (typeof val === 'number') item[compareData.dataset.originalName] = val;
    }
    mergedChartData.push(item);
  }

  // Statistical calculations on primary series
  let stats = null;
  if (primaryValues.length > 0) {
    const min = Math.min(...primaryValues);
    const max = Math.max(...primaryValues);
    const sum = primaryValues.reduce((a, b) => a + b, 0);
    const mean = sum / primaryValues.length;
    const variance =
      primaryValues.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / primaryValues.length;
    const stdDev = Math.sqrt(variance);

    stats = {
      min: Number(min.toFixed(3)),
      max: Number(max.toFixed(3)),
      mean: Number(mean.toFixed(3)),
      stdDev: Number(stdDev.toFixed(3)),
      count: primaryValues.length,
      peakRange: Number((max - min).toFixed(3)),
    };
  }

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">DETECTOR TELEMETRY & STATISTICAL ANALYSIS</span>
          <h2>{dataset.originalName}</h2>
          <p className="muted">
            {dataset.mimeType || 'Data file'} · {(dataset.size / 1024).toFixed(1)} KB · Uploaded by{' '}
            {dataset.uploadedBy?.name || 'Researcher'} on {new Date(dataset.createdAt).toLocaleDateString()}
          </p>
        </div>

        <button className="primary" onClick={download} disabled={downloading}>
          {downloading ? 'Preparing…' : 'Download file'}
        </button>
      </div>

      {/* Scientific Telemetry Statistics Ribbon */}
      {stats && (
        <div className="metric-grid" style={{ marginBottom: '18px' }}>
          <div className="metric">
            <span>Minimum Val</span>
            <strong>{stats.min}</strong>
            <small>Lower bound</small>
          </div>
          <div className="metric">
            <span>Maximum Peak</span>
            <strong>{stats.max}</strong>
            <small>Extremum peak</small>
          </div>
          <div className="metric">
            <span>Mean Value (μ)</span>
            <strong>{stats.mean}</strong>
            <small>Average signal baseline</small>
          </div>
          <div className="metric">
            <span>Std Deviation (σ)</span>
            <strong>{stats.stdDev}</strong>
            <small>Signal dispersion</small>
          </div>
        </div>
      )}

      <div className="grid-2">
        {/* Metadata Card */}
        <section className="card">
          <h3>Detector & Run Metadata</h3>
          <div className="detail-grid">
            <span>
              Associated Experiment
              <strong>
                {dataset.experiment ? (
                  <Link to={`/experiments/${dataset.experiment._id}`} className="table-link">
                    {dataset.experiment.title}
                  </Link>
                ) : (
                  'None'
                )}
              </strong>
            </span>

            <span>
              Equipment Instrument
              <strong>{dataset.equipment?.name || 'Unspecified'}</strong>
            </span>

            {Object.entries(dataset.metadata || {})
              .filter(([_, val]) => val !== undefined && val !== null && val !== '')
              .map(([key, val]) => (
                <span key={key}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  <strong>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</strong>
                </span>
              ))}
          </div>
        </section>

        {/* Data Visualization Card */}
        <section className="card chart-card">
          <div className="section-head" style={{ marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3>Signal Telemetry & Comparative Plot</h3>
              <p>Sample series from parsed detector dataset</p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {numericCols.length > 1 && (
                <select
                  value={selectedColIndex}
                  onChange={(e) => setSelectedColIndex(Number(e.target.value))}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '12px',
                  }}
                >
                  {numericCols.map((col, idx) => (
                    <option key={col.header} value={idx}>
                      Metric: {col.header}
                    </option>
                  ))}
                </select>
              )}

              {allDatasets.length > 0 && (
                <select
                  value={compareId}
                  onChange={(e) => setCompareId(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface2)',
                    color: 'var(--text)',
                    fontSize: '12px',
                  }}
                >
                  <option value="">Compare with run…</option>
                  {allDatasets.map((d) => (
                    <option key={d._id} value={d._id}>
                      Vs: {d.originalName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {mergedChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={mergedChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="index" label={{ value: 'Sample #', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: activeCol?.header || 'Value', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={dataset.originalName}
                  stroke="var(--accent)"
                  dot={false}
                  strokeWidth={2}
                />
                {compareData && (
                  <Line
                    type="monotone"
                    dataKey={compareData.dataset.originalName}
                    stroke="var(--olive)"
                    dot={false}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty">
              <h3>Visualization unavailable</h3>
              <p>This file format does not contain a numeric CSV series for live graphing.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
