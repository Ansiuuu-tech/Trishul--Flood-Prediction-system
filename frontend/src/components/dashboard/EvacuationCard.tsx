import { useEffect, useRef } from 'react';
import { ZoneData } from '@/lib/mockData';

interface EvacuationCardProps {
  zone: ZoneData;
  onClose: () => void;
}

export function EvacuationCard({ zone, onClose }: EvacuationCardProps) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) return;
      printWindow.document.write(`
        <html>
          <head>
            <title>Evacuation Card — ${zone.name}</title>
            <style>
              body { font-family: 'General Sans', 'Inter', system-ui, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; color: #12180F; }
              h1 { font-family: 'Fraunces', Georgia, serif; font-size: 1.75rem; margin-bottom: 0.5rem; }
              .meta { color: #666; font-size: 0.875rem; margin-bottom: 1.5rem; }
              .section { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #E4E7DA; }
              .section h2 { font-size: 1rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; color: #3F6B49; }
              .row { display: flex; justify-content: space-between; margin-bottom: 0.25rem; }
              .label { color: #666; }
              .value { font-weight: 600; }
              .alert { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 6px; font-weight: 600; margin-bottom: 1rem; }
              .alert-evacuate { background: #B23A2E; color: white; }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const nearest = zone.nearestEvacuation;

  return (
    <div className="fixed inset-0 z-[60] bg-forest-950/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-mist-50 rounded-card border border-stone-200 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-display text-h3 text-ink-900">Evacuation Card</h2>
          <button
            onClick={onClose}
            className="text-ink-900/50 hover:text-ink-900 transition-colors duration-200 ease-out"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div ref={printRef} className="p-6">
          <div className="text-center mb-6">
            <span className="alert alert-evacuate">EVACUATE</span>
            <h1 className="text-2xl font-display text-ink-900">{zone.name}</h1>
            <p className="meta">{zone.district} — Generated {zone.lastUpdate}</p>
          </div>

          <div className="section">
            <h2>Nearest Shelter</h2>
            <div className="row">
              <span className="label">Name</span>
              <span className="value">{nearest?.name}</span>
            </div>
            <div className="row">
              <span className="label">Distance</span>
              <span className="value">{nearest?.distance} km {nearest?.direction}</span>
            </div>
            <div className="row">
              <span className="label">Capacity</span>
              <span className="value">{nearest?.capacity} people</span>
            </div>
          </div>

          <div className="section">
            <h2>Route Summary</h2>
            <p className="text-body text-ink-900/70">
              Proceed to designated shelter via pre-mapped evacuation route. Time to safety: {zone.timeToSafety || '~12 min'}.
            </p>
          </div>

          <div className="section">
            <h2>Emergency Contacts</h2>
            <div className="row">
              <span className="label">District Emergency</span>
              <span className="value">+977-01-XXXXXXX</span>
            </div>
            <div className="row">
              <span className="label">Trishul Operations</span>
              <span className="value">+977-01-YYYYYYY</span>
            </div>
            <div className="row">
              <span className="label">Local Volunteer Lead</span>
              <span className="value">Contact zone coordinator</span>
            </div>
          </div>

          <div className="section">
            <h2>Reasoning</h2>
            <p className="text-body text-ink-900/70">{zone.drishtiReasoning}</p>
          </div>

          <p className="text-caption text-ink-900/50 mt-4 text-center">
            This card is generated from live Trishul Core data. Follow official instructions in an actual emergency.
          </p>
        </div>

        <div className="p-6 border-t border-stone-200 flex justify-end gap-3">
          <button onClick={onClose} className="btn btn-secondary">Close</button>
          <button onClick={handlePrint} className="btn btn-primary">Print Evacuation Card</button>
        </div>
      </div>
    </div>
  );
}
