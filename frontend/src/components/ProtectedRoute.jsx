"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Skeleton from "./Skeleton";

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
        router.push("/login");
      }
    }
  }, [loading, isClient, token, hasStoredToken, router]);

  // Loading state
  if (loading || !isClient) {
    return (
      <div className="p-4 space-y-4 max-w-[480px] mx-auto min-h-screen bg-gray-50 flex flex-col justify-center">
        <Skeleton className="h-12 w-3/4 mx-auto rounded-card" />
        <Skeleton className="h-44 w-full rounded-card" />
        <Skeleton className="h-28 w-full rounded-card" />
      </div>
    );
  }

  // Not authenticated
  if (!token && !hasStoredToken) {
    return null;
  }

  return <>{children}</>;
}
