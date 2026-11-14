"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  ShieldAlert,
  MapPin,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import Header from "../../components/Header";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import Button from "../../components/Button";
import Skeleton from "../../components/Skeleton";
import ErrorBox from "../../components/ErrorBox";

// Dynamic import of Leaflet map (client-only to avoid SSR window error)
const OutbreakMap = dynamic(() => import("../../components/OutbreakMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-card" />,
});

export default function OutbreaksPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [outbreaks, setOutbreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningCheck, setRunningCheck] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchOutbreaks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/outbreaks");
      setOutbreaks(data || []);
    } catch (err) {
      console.error("Failed to load outbreaks:", err);
      setError(err.message || "Failed to load outbreak data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutbreaks();
  }, []);

  const handleRunCheck = async () => {
    setRunningCheck(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api.post("/admin/run-outbreak-check");
      setSuccessMsg(
        `Clustering complete: ${res.alerts_created} new alerts, ${res.alerts_updated} updated.`
      );
      await fetchOutbreaks();
    } catch (err) {
      setError(err.message || "Failed to execute outbreak clustering check.");
    } finally {
      setRunningCheck(false);
    }
  };

  const isOfficerOrAdmin = user?.role === "officer" || user?.role === "admin";

  return (
    <ProtectedRoute>
      <div className="pb-24">
        <Header title={t("outbreaks_tile")} showBack />

        <div className="p-4 space-y-4">
          {error && <ErrorBox error={error} onDismiss={() => setError(null)} />}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-krishi-green/30 text-krishi-green rounded-xl text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Privacy & Synthetic Data Notice */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2 shadow-xs">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Epidemiology Radar</span>
              <span>
                Clusters require at least 3 distinct farmers within a 10 km radius.
                GPS coordinates are rounded to ~1.1 km to protect farm privacy.
              </span>
            </div>
          </div>

          {/* Officer Trigger Button */}
          {isOfficerOrAdmin && (
            <Card className="bg-slate-50 border-krishi-border p-3 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-krishi-text block">
                  Agricultural Officer Controls
                </span>
                <span className="text-[11px] text-krishi-grey">
                  Run DBSCAN spatial-temporal clustering check
                </span>
              </div>
              <Button
                size="sm"
                loading={runningCheck}
                icon={RefreshCw}
                onClick={handleRunCheck}
              >
                Run Check
              </Button>
            </Card>
          )}

          {/* Leaflet Map Component */}
          {loading ? (
            <Skeleton className="h-72 w-full rounded-card" />
          ) : (
            <OutbreakMap
              outbreaks={outbreaks}
              center={
                outbreaks.length > 0
                  ? [outbreaks[0].centroid_lat, outbreaks[0].centroid_lon]
                  : [26.8467, 80.9462]
              }
              zoom={outbreaks.length > 0 ? 8 : 6}
            />
          )}

          {/* Outbreak Clusters List */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-krishi-grey uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-krishi-red" />
                Active Outbreak Clusters ({outbreaks.length})
              </h3>
              <button
                type="button"
                onClick={fetchOutbreaks}
                className="text-xs font-bold text-krishi-green hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>

            {outbreaks.length > 0 ? (
              <div className="space-y-2.5">
                {outbreaks.map((alert) => (
                  <Card
                    key={alert.id}
                    className={`p-3.5 border-l-4 shadow-xs ${
                      alert.alert_level === "high"
                        ? "border-l-krishi-red bg-red-50/30"
                        : alert.alert_level === "medium"
                        ? "border-l-krishi-orange bg-amber-50/30"
                        : "border-l-amber-400 bg-yellow-50/30"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-krishi-grey uppercase tracking-wider">
                          {alert.crop_name}
                        </span>
                        <h4 className="text-sm font-black text-krishi-text leading-tight">
                          {alert.disease_name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-krishi-grey mt-1">
                          <MapPin className="w-3.5 h-3.5 text-krishi-grey" />
                          <span>
                            {alert.district}, {alert.state}
                          </span>
                        </div>
                      </div>

                      <Chip
                        variant={
                          alert.alert_level === "high"
                            ? "danger"
                            : alert.alert_level === "medium"
                            ? "warning"
                            : "info"
                        }
                        className="text-[10px] uppercase font-bold py-0.5"
                      >
                        {alert.alert_level} Alert
                      </Chip>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-200/80 text-[11px] text-krishi-grey">
                      <div>
                        <span>Confirmed Reports: </span>
                        <span className="font-bold text-krishi-text font-mono">
                          {alert.report_count}
                        </span>
                      </div>
                      <div className="text-right">
                        <span>Window: </span>
                        <span className="font-medium text-krishi-text">
                          {alert.window_start?.slice(5, 10)} to {alert.window_end?.slice(5, 10)}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-8 bg-slate-50 border-dashed">
                <AlertTriangle className="w-8 h-8 text-krishi-green mx-auto mb-1 opacity-70" />
                <p className="text-xs font-bold text-krishi-text">
                  No active outbreak clusters detected nearby
                </p>
                <p className="text-[11px] text-krishi-grey mt-0.5">
                  Your registered farms are currently free of regional disease flare-ups.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
