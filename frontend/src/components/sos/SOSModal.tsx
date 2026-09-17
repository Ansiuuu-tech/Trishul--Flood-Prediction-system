import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { SOSRequest, SOSSituation, submitSOS } from '@/lib/api';

const DEFAULT: [number, number] = [30.3165, 78.0322];
const situations: SOSSituation[] = ['Trapped', 'Injured', 'Medical Emergency', 'Need Evacuation', 'Other'];
const pin = L.divIcon({ className: 'sos-pin', html: '<div style="font-size:28px;filter:drop-shadow(0 1px 2px #111)">📍</div>', iconSize: [28, 34], iconAnchor: [14, 34] });

function PinPicker({ position, onPick }: { position: [number, number] | null; onPick: (p: [number, number]) => void }) {
  useMapEvents({ click: (event) => onPick([event.latlng.lat, event.latlng.lng]) });
  return position ? <Marker position={position} icon={pin} /> : null;
}

export function SOSModal({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState(''); const [name, setName] = useState(''); const [count, setCount] = useState(1);
  const [situation, setSituation] = useState<SOSSituation>('Trapped'); const [message, setMessage] = useState('');
  const [position, setPosition] = useState<[number, number] | null>(null); const [source, setSource] = useState<'gps' | 'map_pin' | 'unavailable'>('unavailable');
  const [locating, setLocating] = useState(false); const [sending, setSending] = useState(false); const [error, setError] = useState(''); const [sent, setSent] = useState<SOSRequest | null>(null);

  useEffect(() => { const close = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [onClose]);
  const locate = () => {
    if (!navigator.geolocation) { setError('GPS is not available. Please drop a pin on the map.'); return; }
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition((p) => { setPosition([p.coords.latitude, p.coords.longitude]); setSource('gps'); setLocating(false); }, () => { setError('Could not access GPS. Please drop a pin on the map.'); setLocating(false); }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  };
  const send = async (e: React.FormEvent) => {
    e.preventDefault(); if (phone.trim().length < 7) { setError('Please enter a callback phone number.'); return; }
    setSending(true); setError('');
    try { setSent(await submitSOS({ phone_number: phone.trim(), name, people_count: count, situation_type: situation, message, latitude: position?.[0], longitude: position?.[1], location_source: source })); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to send SOS. Please retry or call 112.'); }
    finally { setSending(false); }
  };
  return <div className="fixed inset-0 z-[1100] overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="sos-heading"><div className="mx-auto my-4 max-w-xl rounded-2xl bg-white shadow-2xl">
    {sent ? <div className="p-7 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-3xl">✓</div><h2 id="sos-heading" className="text-2xl">SOS sent</h2><p className="mt-3 text-slate-700">Your request has reached the response team.</p><p className="mt-3 font-mono text-lg font-bold text-red-700">Reference: {sent.reference_id}</p>{sent.shelter_name && <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Nearest safe shelter: <b>{sent.shelter_name}</b>{sent.risk_level && ` · ${sent.risk_level} risk in nearby zone`}</p>}<p className="mt-4 text-sm text-slate-500">If the danger is immediate or this connection fails, call 112.</p><button className="mt-6 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white" onClick={onClose}>Close</button></div> :
    <form onSubmit={send} className="p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs font-bold tracking-widest text-red-700">EMERGENCY REQUEST · NO LOGIN REQUIRED</p><h2 id="sos-heading" className="mt-1 text-2xl">Send SOS</h2><p className="mt-1 text-sm text-slate-600">Only your callback number is required.</p></div><button type="button" className="rounded-lg p-2 text-xl" onClick={onClose} aria-label="Close SOS form">×</button></div>
      <label className="label mt-5">Phone number *</label><input className="input" inputMode="tel" autoFocus required value={phone} onChange={e => setPhone(e.target.value)} placeholder="e.g. +91 98xxxxxx" />
      <label className="label mt-4">What is happening?</label><div className="grid grid-cols-2 gap-2">{situations.map(item => <button type="button" key={item} onClick={() => setSituation(item)} className={`min-h-12 rounded-xl border px-2 text-sm font-semibold ${situation === item ? 'border-red-700 bg-red-700 text-white' : 'border-slate-200 bg-white text-slate-800'}`}>{item}</button>)}</div>
      <div className="mt-4 flex items-end gap-4"><div className="flex-1"><label className="label">People needing help</label><div className="flex items-center justify-between rounded-xl border border-slate-200"><button type="button" className="h-11 w-12 text-xl" onClick={() => setCount(v => Math.max(1, v - 1))}>−</button><b>{count}</b><button type="button" className="h-11 w-12 text-xl" onClick={() => setCount(v => Math.min(500, v + 1))}>+</button></div></div><div className="flex-1"><label className="label">Name <span className="font-normal">(optional)</span></label><input className="input" value={name} onChange={e => setName(e.target.value)} /></div></div>
      <div className="mt-5 rounded-xl border border-slate-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><b className="text-sm">Your location</b><p className="text-xs text-slate-600">{position ? `${position[0].toFixed(5)}, ${position[1].toFixed(5)}` : 'Use GPS, or tap the map to drop a pin.'}</p></div><button type="button" onClick={locate} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white" disabled={locating}>{locating ? 'Finding…' : 'Use my location'}</button></div><div className="mt-3 h-40 overflow-hidden rounded-lg"><MapContainer center={position ?? DEFAULT} zoom={position ? 13 : 8} className="h-full w-full" scrollWheelZoom={false}><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" /><PinPicker position={position} onPick={p => { setPosition(p); setSource('map_pin'); }} /></MapContainer></div></div>
      <label className="label mt-4">Message <span className="font-normal">(optional)</span></label><textarea className="input min-h-20" value={message} onChange={e => setMessage(e.target.value)} placeholder="Landmark, injuries, or anything responders should know" />
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p>}<button disabled={sending} className="mt-5 min-h-14 w-full rounded-xl bg-red-700 text-lg font-bold text-white shadow-lg hover:bg-red-800 disabled:opacity-60">{sending ? 'Sending SOS…' : 'SEND SOS NOW'}</button><p className="mt-3 text-center text-xs text-slate-500">For immediate life-threatening danger, call 112.</p>
    </form>}</div></div>;
}
