import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TrishulMark, ContourField } from "@/components/core";
import { useAuth } from "@/context/AuthContext";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (token) {
      setToken(token);
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login", {
        replace: true,
        state: { error: error || "oauth_failed" },
      });
    }
  }, [navigate, setToken]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950">
      <ContourField opacity={0.12} drift={true} colorMode="dark" aria-hidden="true" />
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <TrishulMark size="xl" color="light" animate={true} />
        <p className="mt-6 font-mono text-caption text-mist-50/60 tracking-wider uppercase">
          Signing you in...
        </p>
      </div>
    </div>
  );
}
