"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function SSOLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("No SSO token provided.");
      return;
    }

    // Call the POS backend to verify the token and get a local session token
    fetch(`/api/auth/sso`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`SSO validation failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.access_token) {
          login(data.access_token);
          router.push("/");
        } else {
          setError("Invalid response from server.");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to authenticate via SSO.");
      });
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
      {error ? (
        <>
          <h1 className="text-2xl font-bold text-rose-500 tracking-tight">SSO Error</h1>
          <p className="text-slate-400">{error}</p>
          <button onClick={() => window.location.href = "http://localhost:3000"} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors">
            Return to Hub
          </button>
        </>
      ) : (
        <>
          <div className="h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <h1 className="text-2xl font-bold text-white tracking-tight">Authenticating...</h1>
          <p className="text-slate-400">Verifying your QuickTrack Hub credentials.</p>
        </>
      )}
    </div>
  );
}

export default function SSOLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading SSO...</div>}>
      <SSOLoginContent />
    </Suspense>
  );
}
