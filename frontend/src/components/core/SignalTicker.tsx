import { useEffect, useState } from 'react';

const facts = [
  '₹6,972 crore of Average annual economic loss',
  '1,666 of Average human lives lost annually',
  '7.38 Mha of Average area affected annually',
  '1.2 million of Average houses damaged annually',
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
