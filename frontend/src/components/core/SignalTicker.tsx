import { useEffect, useState } from 'react';

const facts = [
  '9m rise in 30 min — Trishuli, 26 Aug 2026',
  '140 deaths, Nepal monsoon 2025',
  '3 signals fused into 1 warning',
  '4+ hours lead time before flood arrival',
  '8 zones monitored in prototype',
];

export function SignalTicker() {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState(facts[0]);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % facts.length);
        setDisplay(facts[(index + 1) % facts.length]);
        setFade(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, [index]);

  return (
    <div className="bg-forest-800/50 border-t border-b border-moss-600/30 py-2 overflow-hidden">
      <div className="container-main">
        <p
          className={`font-mono text-caption text-mist-50/70 text-center transition-opacity duration-400 ${
            fade ? 'opacity-100' : 'opacity-0'
          }`}
          aria-live="polite"
          aria-label="Live signal facts"
        >
          {display}
        </p>
      </div>
    </div>
  );
}
