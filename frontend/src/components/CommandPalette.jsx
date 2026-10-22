import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MagnifyingGlassIcon } from './Icons';

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [experiments, setExperiments] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { toggle } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      // Preload searchable entities
      Promise.all([
        api.get('/experiments').catch(() => ({ data: [] })),
        api.get('/equipment').catch(() => ({ data: [] })),
        api.get('/datasets').catch(() => ({ data: [] })),
      ]).then(([expRes, eqRes, dsRes]) => {
        setExperiments(expRes.data);
        setEquipment(eqRes.data);
        setDatasets(dsRes.data);
      });
    }
  }, [open]);

  // Static navigation routes
  const navigationItems = [
    { type: 'Navigation', label: 'Dashboard', path: '/' },
    { type: 'Navigation', label: 'Experiments Repository', path: '/experiments' },
    { type: 'Navigation', label: 'Equipment & Instruments', path: '/equipment' },
    { type: 'Navigation', label: 'Instrument Schedule', path: '/reservations' },
    { type: 'Navigation', label: 'Detector Datasets', path: '/datasets' },
    ...(user?.role !== 'researcher'
      ? [{ type: 'Navigation', label: 'Research Intelligence & Analytics', path: '/analytics' }]
      : []),
    ...(user?.role === 'institution_admin'
      ? [
          { type: 'Navigation', label: 'People & Access Control', path: '/users' },
          { type: 'Navigation', label: 'Institution Hierarchy & Labs', path: '/labs' },
          { type: 'Navigation', label: 'Compliance Audit Trail', path: '/audit' },
        ]
      : []),
    {
      type: 'Action',
      label: 'Toggle Dark / Light Theme',
      action: () => toggle(),
    },
  ];

  // Map dynamic entities
  const dynamicItems = [
    ...experiments.map((e) => ({
      type: 'Experiment',
      label: e.title,
      sub: `${e.status} · v${e.version}`,
      path: `/experiments/${e._id}`,
    })),
    ...equipment.map((eq) => ({
      type: 'Equipment',
      label: eq.name,
      sub: `${eq.model || 'Detector'} · ${eq.status}`,
      path: '/equipment',
    })),
    ...datasets.map((d) => ({
      type: 'Dataset',
      label: d.originalName,
      sub: `${d.mimeType || 'Data'} · ${(d.size / 1024).toFixed(1)} KB`,
      path: `/datasets/${d._id}`,
    })),
  ];

  const allItems = [...navigationItems, ...dynamicItems];

  const filtered = allItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    (item.sub && item.sub.toLowerCase().includes(query.toLowerCase())) ||
    item.type.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  const handleSelect = (item) => {
    onClose();
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{ zIndex: 10000, background: 'rgba(15, 10, 15, 0.65)' }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(620px, 92vw)',
          padding: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          background: 'var(--surface)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
            gap: '12px',
          }}
        >
          <MagnifyingGlassIcon style={{ width: 20, height: 20, color: 'var(--muted)' }} />
          <input
            ref={inputRef}
            placeholder="Search experiments, instruments, datasets, pages (↑↓ to navigate, Enter to jump)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 0,
              background: 'transparent',
              outline: 'none',
              fontSize: '15px',
              color: 'var(--text)',
            }}
          />
          <kbd
            style={{
              padding: '3px 7px',
              borderRadius: '6px',
              background: 'var(--surface2)',
              fontSize: '11px',
              color: 'var(--muted)',
              fontFamily: 'monospace',
            }}
          >
            ESC
          </kbd>
        </div>

        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
          {filtered.map((item, idx) => {
            const isSelected = idx === selectedIndex;

            return (
              <div
                key={`${item.type}-${item.label}-${idx}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--surface2)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--text)',
                }}
              >
                <div>
                  <strong style={{ fontSize: '13px', display: 'block' }}>{item.label}</strong>
                  {item.sub && <small style={{ color: 'var(--muted)' }}>{item.sub}</small>}
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {item.type}
                </span>
              </div>
            );
          })}

          {!filtered.length && (
            <div className="empty" style={{ padding: '30px 10px' }}>
              No results found matching "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
