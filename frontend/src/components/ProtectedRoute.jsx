"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Skeleton from "./Skeleton";
import { Sprout } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, token, loading, demoLogin } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasStoredToken =
    typeof window !== "undefined" && Boolean(localStorage.getItem("krishi_token"));

  useEffect(() => {
    if (!loading && isClient) {
      if (!token && !hasStoredToken) {
        // Automatically redirect after 1.8 seconds unless user clicks demo login
        const timer = setTimeout(() => {
          const redirectUrl = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          router.replace(redirectUrl);
        }, 1800);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, isClient, token, hasStoredToken, router]);

  const handleQuickDemo = async () => {
    try {
      setDemoLoading(true);
      await demoLogin();
    } catch (e) {
      router.replace("/login");
    } finally {
      setDemoLoading(false);
    }
  };

  // Loading state
  if (loading || !isClient) {
    return (
      <div className="p-4 space-y-4 max-w-[480px] mx-auto min-h-[60vh] bg-white flex flex-col justify-center">
        <Skeleton className="h-12 w-3/4 mx-auto rounded-card" />
        <Skeleton className="h-44 w-full rounded-card" />
        <Skeleton className="h-28 w-full rounded-card" />
      </div>
    );
  }

  // Not authenticated - show clean interactive redirecting screen
  if (!token && !hasStoredToken) {
    return (
      <div className="p-8 text-center space-y-4 max-w-[480px] mx-auto min-h-[60vh] flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 rounded-full bg-krishi-light flex items-center justify-center text-krishi-green mx-auto shadow-sm animate-pulse">
          <Sprout className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-krishi-text">
            Welcome to Krishi Drishti
          </h2>
          <p className="text-xs text-krishi-grey">
            Please log in or explore directly with a demo account
          </p>
        </div>
        <div className="pt-2 w-full space-y-2 max-w-xs mx-auto">
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={demoLoading}
            className="w-full py-2.5 px-4 bg-krishi-green text-white font-bold text-xs rounded-button shadow-sm hover:bg-krishi-dark active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Sprout className="w-4 h-4" />
            {demoLoading ? "Starting demo..." : "🌾 Instant Demo (डेमो चलाएं)"}
          </button>
          <button
            type="button"
            onClick={() => router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)}
            className="w-full py-2.5 px-4 bg-white border border-krishi-border text-krishi-text font-bold text-xs rounded-button hover:bg-slate-50 active:scale-95 transition-all"
          >
            Log In / Sign Up
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
