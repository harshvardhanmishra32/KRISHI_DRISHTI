"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Skeleton from "./Skeleton";
import { Sprout } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const hasStoredToken =
    typeof window !== "undefined" && Boolean(localStorage.getItem("krishi_token"));

  useEffect(() => {
    if (!loading && isClient) {
      if (!token && !hasStoredToken) {
        const redirectUrl = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        router.replace(redirectUrl);
      }
    }
  }, [loading, isClient, token, hasStoredToken, router]);

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

  // Not authenticated - show clean redirecting screen instead of empty null
  if (!token && !hasStoredToken) {
    return (
      <div className="p-8 text-center space-y-4 max-w-[480px] mx-auto min-h-[60vh] flex flex-col items-center justify-center bg-white">
        <div className="w-16 h-16 rounded-full bg-krishi-light flex items-center justify-center text-krishi-green mx-auto shadow-sm animate-pulse">
          <Sprout className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-krishi-text">
            Signing you in...
          </h2>
          <p className="text-xs text-krishi-grey">
            Please wait while we redirect you to login
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
