interface SOSButtonProps { onClick: () => void; }

export function SOSButton({ onClick }: SOSButtonProps) {
  return (
    <button type="button" onClick={onClick} className="fixed bottom-5 right-5 z-[1000] flex min-h-16 items-center gap-3 rounded-full bg-red-700 px-5 text-base font-bold text-white shadow-[0_10px_30px_rgba(185,28,28,.45)] transition hover:bg-red-800 focus-visible:ring-4 focus-visible:ring-red-300" aria-label="Send emergency SOS">
      <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-lg" aria-hidden="true">!</span>
      <span>SOS</span>
    </button>
  );
}
