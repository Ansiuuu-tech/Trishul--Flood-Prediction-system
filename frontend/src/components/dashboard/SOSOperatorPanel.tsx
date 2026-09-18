import { useCallback, useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { fetchSOSRequests, SOSRequest, SOSStatus, updateSOSStatus } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/config';

const nextStatuses: SOSStatus[] = ['Acknowledged', 'Rescue Dispatched', 'Resolved', 'False Alarm'];
const statusClass: Record<SOSStatus, string> = { Pending: 'bg-red-100 text-red-800', Acknowledged: 'bg-amber-100 text-amber-900', 'Rescue Dispatched': 'bg-blue-100 text-blue-900', Resolved: 'bg-emerald-100 text-emerald-900', 'False Alarm': 'bg-slate-200 text-slate-700' };

export function SOSOperatorPanel() {
  const { user } = useAuth(); const [items, setItems] = useState<SOSRequest[]>([]); const [error, setError] = useState(''); const [busy, setBusy] = useState<string | null>(null);
  const allowed = user?.role === 'operator' || user?.role === 'administrator';
  const load = useCallback(async () => { if (!allowed) return; try { setItems(await fetchSOSRequests()); setError(''); } catch (e) { setError(e instanceof Error ? e.message : 'Could not load SOS requests'); } }, [allowed]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!allowed) return;
    const socket = new WebSocket(`${API_URL.replace(/^http/, 'ws')}/ws/live`);
    socket.onmessage = (event) => { try { const message = JSON.parse(event.data); if (message.type === 'sos_created') setItems(old => [message.data, ...old.filter(s => s.id !== message.data.id)]); if (message.type === 'sos_updated') setItems(old => old.map(s => s.id === message.data.id ? message.data : s)); } catch { /* ignore malformed messages */ } };
    return () => socket.close();
  }, [allowed]);
  const setStatus = async (item: SOSRequest, state: SOSStatus) => { setBusy(item.id); try { const updated = await updateSOSStatus(item.id, state); setItems(old => old.map(s => s.id === updated.id ? updated : s)); } catch (e) { setError(e instanceof Error ? e.message : 'Status update failed'); } finally { setBusy(null); } };
  if (!allowed) return <section className="bg-slate-950 py-10 text-white"><div className="container-main"><h2 className="text-2xl text-white">SOS response desk</h2><p className="mt-2 text-slate-300">Sign in as an operator or administrator to see and action live emergency requests.</p></div></section>;
  const mapped = items.filter((item): item is SOSRequest & { latitude: number; longitude: number } => item.latitude !== null && item.longitude !== null);
  return <section className="bg-slate-950 py-10 text-white" aria-labelledby="sos-desk-heading"><div className="container-main"><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-xs tracking-widest text-red-300">LIVE EMERGENCY INTAKE</p><h2 id="sos-desk-heading" className="mt-1 text-2xl text-white">SOS response desk</h2></div><button className="rounded-lg border border-white/20 px-3 py-2 text-sm" onClick={load}>Refresh</button></div>{error && <p className="mt-3 rounded-lg bg-red-950 p-3 text-sm text-red-200">{error}</p>}
    {mapped.length > 0 && <div className="mt-5 h-64 overflow-hidden rounded-xl border border-white/15"><MapContainer center={[mapped[0].latitude, mapped[0].longitude]} zoom={10} className="h-full w-full"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />{mapped.map(item => <CircleMarker key={item.id} center={[item.latitude, item.longitude]} radius={10} pathOptions={{ color: '#fff', fillColor: item.status === 'Pending' ? '#dc2626' : '#f59e0b', fillOpacity: 1 }}><Popup><b>{item.reference_id}</b><br />{item.people_count} people · {item.situation_type}<br />{item.status}</Popup></CircleMarker>)}</MapContainer></div>}
    <div className="mt-5 grid gap-3">{items.length === 0 ? <p className="rounded-xl border border-white/15 p-5 text-slate-300">No SOS requests yet. New requests appear here instantly.</p> : items.map(item => <article key={item.id} className="rounded-xl border border-white/15 bg-white/5 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><b>{item.reference_id}</b><span className={`rounded-full px-2 py-1 text-xs font-bold ${statusClass[item.status]}`}>{item.status}</span></div><p className="mt-2 text-sm text-slate-200"><b>{item.people_count}</b> people · {item.situation_type} · callback <a className="underline" href={`tel:${item.phone_number}`}>{item.phone_number}</a></p><p className="mt-1 text-sm text-slate-300">{item.nearest_zone_name || 'Location not available'}{item.shelter_name ? ` · Safe shelter: ${item.shelter_name}` : ''}</p>{item.message && <p className="mt-2 text-sm italic text-slate-300">“{item.message}”</p>}</div><div className="flex flex-wrap gap-2">{nextStatuses.filter(s => s !== item.status).map(s => <button key={s} disabled={busy === item.id} onClick={() => setStatus(item, s)} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-900 disabled:opacity-50">{s}</button>)}</div></div></article>)}</div></div></section>;
}
