interface Props {
  zoneName: string;
  score: number;
  level: 'Safe' | 'Watch' | 'Warning' | 'Evacuate';
  reason?: string;
  recommendedAction?: string;
}

export function TopRiskCallout({ zoneName, score, level, reason, recommendedAction }: Props) {
  const elevated = level === 'Warning' || level === 'Evacuate';
  const surface = elevated
    ? 'border-rudra-warn/60 bg-[linear-gradient(115deg,rgba(239,78,78,.24),rgba(255,146,43,.16),rgba(13,48,64,.94))] shadow-[0_18px_55px_-28px_rgba(239,78,78,.85)]'
    : 'border-cyan-200/35 bg-[linear-gradient(115deg,rgba(32,145,166,.48),rgba(18,91,112,.64),rgba(7,26,37,.94))] shadow-[0_18px_55px_-30px_rgba(50,198,194,.8)]';
  return (
    <div className={`rounded-card border p-6 text-mist-50 backdrop-blur-sm ${surface}`}>
      <p className="font-mono text-caption uppercase tracking-widest mb-2 opacity-70">{elevated ? 'Elevated risk detected' : 'Highest current reading'}</p>
      <h3 className="font-display text-h3 mb-2">{zoneName} — {level}</h3>
      <p className="text-body opacity-70 mb-3">Shakti Score {score.toFixed(0)}/100{reason ? ` — ${reason}` : ''}</p>
      {recommendedAction ? <p className="text-caption opacity-60">{recommendedAction}</p> : null}
    </div>
  );
}
