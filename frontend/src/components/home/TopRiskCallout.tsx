interface Props {
  zoneName: string;
  score: number;
  level: 'Safe' | 'Watch' | 'Warning' | 'Evacuate';
  reason?: string;
  recommendedAction?: string;
}

export function TopRiskCallout({ zoneName, score, level, reason, recommendedAction }: Props) {
  const elevated = level === 'Warning' || level === 'Evacuate';
  return (
    <div className={`rounded-card border p-6 ${elevated ? 'border-rudra-warn/40 bg-rudra-warn/5' : 'border-moss-600 bg-forest-800'}`}>
      <p className="font-mono text-caption uppercase tracking-widest mb-2 opacity-70">{elevated ? 'Elevated risk detected' : 'Highest current reading'}</p>
      <h3 className="font-display text-h3 mb-2">{zoneName} — {level}</h3>
      <p className="text-body opacity-70 mb-3">Shakti Score {score.toFixed(0)}/100{reason ? ` — ${reason}` : ''}</p>
      {recommendedAction ? <p className="text-caption opacity-60">{recommendedAction}</p> : null}
    </div>
  );
}
