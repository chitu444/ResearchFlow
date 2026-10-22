import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { useSocket } from '../hooks/useSocket';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [experiments, setExperiments] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [equipment, setEquipment] = useState([]);

  const load = () => {
    Promise.all([
      api.get('/experiments'),
      api.get('/reservations'),
      api.get('/datasets'),
      api.get('/equipment'),
    ])
      .then(([a, b, c, d]) => {
        setExperiments(a.data);
        setReservations(b.data);
        setDatasets(c.data);
        setEquipment(d.data);
      })
      .catch((err) => {
        console.error('Dashboard load failed:', err);
      });
  };

  useEffect(() => {
    load();
  }, []);

  useSocket({
    'reservation:changed': load,
    'equipment:availability': load,
    'experiment:updated': load,
    'experiment:created': load,
    'dataset:uploaded': load,
  });

  const isResearcher = user.role === 'researcher';
  const isManager = user.role === 'lab_manager';

  const avgUtil = equipment.length
    ? Math.round(equipment.reduce((sum, e) => sum + (e.utilization || 0), 0) / equipment.length)
    : 0;

  return (
    <div className="page">
      <div className="page-title">
        <div>
          <span className="eyebrow">
            {isResearcher
              ? 'RESEARCHER WORKSPACE'
              : isManager
              ? 'LABORATORY OPERATIONS'
              : 'INSTITUTION OVERVIEW'}
          </span>
          <h2>
            {isResearcher
              ? 'Research at a Glance'
              : isManager
              ? 'Laboratory Control & Operations'
              : 'Institutional Research Intelligence'}
          </h2>
        </div>
      </div>

      <div className="metric-grid">
        <Metric
          label="Active Experiments"
          value={experiments.filter((x) => ['Approved', 'Running'].includes(x.status)).length}
          hint="Approved or running phase"
        />
        <Metric
          label="Upcoming Bookings"
          value={reservations.filter((x) => new Date(x.startTime) > new Date()).length}
          hint="Across assigned equipment"
        />
        <Metric
          label="Detector Datasets"
          value={datasets.length}
          hint="Catalogued in repository"
        />
        <Metric
          label="Equipment Utilization"
          value={`${avgUtil}%`}
          hint="Current facility average"
        />
      </div>

      <div className="grid-2">
        {/* Recent Experiments */}
        <section className="card">
          <div className="section-head">
            <div>
              <h3>Recent Experiments</h3>
              <p>Lifecycle status across your active research</p>
            </div>
            <Link to="/experiments" className="table-link" style={{ fontSize: '13px' }}>
              View all →
            </Link>
          </div>

          <div style={{ marginTop: '12px' }}>
            {experiments.slice(0, 5).map((e) => (
              <div className="list-row" key={e._id}>
                <div>
                  <Link to={`/experiments/${e._id}`} className="table-link">
                    <strong>{e.title}</strong>
                  </Link>
                  <span>
                    {e.laboratory?.name || 'Laboratory'} · v{e.version}
                  </span>
                </div>
                <StatusBadge status={e.status} />
              </div>
            ))}
            {!experiments.length && <EmptyState message="No experiments initiated yet." />}
          </div>
        </section>

        {/* Upcoming Reservations */}
        <section className="card">
          <div className="section-head">
            <div>
              <h3>Upcoming Instrument Time</h3>
              <p>Approved and pending runs on the calendar</p>
            </div>
            <Link to="/reservations" className="table-link" style={{ fontSize: '13px' }}>
              Schedule →
            </Link>
          </div>

          <div style={{ marginTop: '12px' }}>
            {reservations
              .filter((x) => new Date(x.endTime) > new Date())
              .slice(0, 5)
              .map((r) => (
                <div className="list-row" key={r._id}>
                  <div>
                    <strong>{r.equipment?.name || 'Instrument'}</strong>
                    <span>
                      {new Date(r.startTime).toLocaleDateString()} at{' '}
                      {new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            {!reservations.length && <EmptyState message="No upcoming instrument reservations." />}
          </div>
        </section>
      </div>
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
