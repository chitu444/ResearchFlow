import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

// Gentle pleasant notification chime using Web Audio API (no audio assets required)
function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    // Harmonic minor third chime (880Hz -> 1046.5Hz)
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.08);
    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio autoplay might be blocked before first user gesture
  }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'info', playSound = true }) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 6);
    const newToast = { id, title, message, type };

    setToasts((prev) => [newToast, ...prev].slice(0, 5));

    if (playSound) {
      playNotificationChime();
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            style={{
              pointerEvents: 'auto',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: '0 12px 35px rgba(0,0,0,0.18)',
              minWidth: '280px',
              maxWidth: '360px',
              cursor: 'pointer',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              animation: 'slideIn 0.25s ease-out',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginTop: '6px',
                background:
                  toast.type === 'success'
                    ? 'var(--good)'
                    : toast.type === 'warning'
                    ? 'var(--danger)'
                    : 'var(--accent)',
              }}
            />
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: '13px', display: 'block', color: 'var(--text)' }}>
                {toast.title}
              </strong>
              {toast.message && (
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: 'var(--muted)', lineHeight: '1.4' }}>
                  {toast.message}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
