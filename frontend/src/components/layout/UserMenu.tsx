import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import type { AuthUser } from "@/context/AuthContext";

interface UserMenuProps {
  user: AuthUser;
  onLogout: () => void;
}

export function UserMenu({ user, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName =
    user.full_name || user.display_name || (user.email ? user.email.split("@")[0] : "User");
  const initials = (user.full_name || user.display_name || user.email || "U")
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-btn px-2 py-1.5 text-ink-900/80 hover:bg-mist-50/5 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-amber/40 dark:text-mist-50 dark:hover:bg-mist-50/10"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="h-8 w-8 rounded-full border border-fern-400/30 object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fern-400/20 font-mono text-xs font-medium text-fern-400">
            {initials}
          </div>
        )}
        <span className="font-mono text-caption">{displayName}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="transition-transform"
          style={open ? { transform: "rotate(180deg)" } : undefined}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-48 rounded-card bg-forest-950 border border-mist-50/10 py-1 shadow-xl animate-fade-in"
          role="menu"
          aria-orientation="vertical"
        >
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-mist-50/80 hover:bg-mist-50/5 hover:text-mist-50"
            role="menuitem"
          >
            Dashboard
          </Link>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-mist-50/80 hover:bg-mist-50/5 hover:text-mist-50"
            role="menuitem"
          >
            Profile
          </Link>
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="block w-full text-left px-4 py-2 text-sm text-rudra-evacuate hover:bg-mist-50/5"
            role="menuitem"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
