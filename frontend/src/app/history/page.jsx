"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Calendar,
  Filter,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import Header from "../../components/Header";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import Skeleton from "../../components/Skeleton";
import ErrorBox from "../../components/ErrorBox";

const PAGE_SIZE = 10;

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState("");
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detail Modal state
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [reportDetail, setReportDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch crops list for filter
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const cropList = await api.get("/crops");
        setCrops(cropList || []);
      } catch (e) {
        console.warn("Failed to load crops:", e);
      }
    };
    fetchCrops();
  }, []);

  // Fetch scan history with pagination
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/disease-history?limit=${PAGE_SIZE}&offset=${offset}`;
      if (selectedCropId) {
        url += `&crop_id=${selectedCropId}`;
      }
      const data = await api.get(url);
      setReports(data?.items || []);
      setTotal(data?.total || 0);
    } catch (err) {
      setError(err.message || "Failed to load scan history.");
    } finally {
      setLoading(false);
    }
  }, [offset, selectedCropId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Fetch Report Detail
  const handleOpenDetail = async (id) => {
    setSelectedReportId(id);
    setLoadingDetail(true);
    setReportDetail(null);
    try {
      const detail = await api.get(`/disease-reports/${id}`);
      setReportDetail(detail);
    } catch (err) {
      console.warn("Failed to fetch report detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedReportId(null);
    setReportDetail(null);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  return (
    <ProtectedRoute>
      <div className="pb-24">
        <Header title="Scan History" showBack />

        <div className="p-4 space-y-4">
          {error && <ErrorBox error={error} onDismiss={() => setError(null)} />}

          {/* Crop Filter Bar */}
          <Card className="p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-krishi-grey flex items-center gap-1.5 whitespace-nowrap">
                <Filter className="w-3.5 h-3.5" /> Filter by Crop:
              </span>
              <select
                value={selectedCropId}
                onChange={(e) => {
                  setSelectedCropId(e.target.value);
                  setOffset(0);
                }}
                className="text-xs font-bold text-krishi-text bg-white border border-krishi-border rounded-button px-2.5 py-1.5 focus:ring-2 focus:ring-krishi-green truncate max-w-[200px]"
              >
                <option value="">All Crops ({total})</option>
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </Card>

          {/* List of Scans */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-card" />
              ))}
            </div>
          ) : reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((item) => {
                const isHealthy = item.disease_name.toLowerCase().includes("healthy");
                const isLowConf = item.confidence < 0.7;

                return (
                  <Card
                    key={item.id}
                    onClick={() => handleOpenDetail(item.id)}
                    className="p-3 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* Image Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-krishi-border">
                        {item.image_url ? (
                          <img
                            src={
                              item.image_url.startsWith("http")
                                ? item.image_url
                                : `${backendUrl}${item.image_url}`
                            }
                            alt={item.disease_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <Camera className="w-6 h-6 text-krishi-grey opacity-60" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-krishi-grey uppercase truncate">
                            {item.crop_name}
                          </span>
                          <span className="text-[10px] text-krishi-grey">•</span>
                          <span className="text-[10px] text-krishi-grey">
                            {new Date(item.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-krishi-text leading-tight truncate">
                          {item.disease_name}
                        </h4>

                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs font-mono font-bold ${
                              isLowConf
                                ? "text-amber-600"
                                : isHealthy
                                ? "text-krishi-green"
                                : "text-krishi-orange"
                            }`}
                          >
                            {(item.confidence * 100).toFixed(0)}% confidence
                          </span>
                          {isLowConf && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                              Low Conf
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-krishi-grey flex-shrink-0" />
                  </Card>
                );
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setOffset((prev) => Math.max(0, prev - PAGE_SIZE))}
                    className="px-3 py-1.5 text-xs font-bold rounded-button bg-white border border-krishi-border text-krishi-text disabled:opacity-40 flex items-center gap-1 hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <span className="text-xs text-krishi-grey font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setOffset((prev) => prev + PAGE_SIZE)}
                    className="px-3 py-1.5 text-xs font-bold rounded-button bg-white border border-krishi-border text-krishi-text disabled:opacity-40 flex items-center gap-1 hover:bg-slate-50"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Card className="text-center py-10 bg-slate-50 border-dashed">
              <Camera className="w-10 h-10 text-krishi-grey mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-bold text-krishi-text">
                No past scans found
              </h3>
              <p className="text-xs text-krishi-grey mt-0.5 mb-4">
                {selectedCropId
                  ? "No scan records for the selected crop."
                  : "You haven't scanned any crop leaves yet."}
              </p>
              <Button
                size="sm"
                onClick={() => router.push("/scan")}
                icon={Camera}
                className="mx-auto"
              >
                Scan a Leaf Now
              </Button>
            </Card>
          )}

          {/* DETAIL MODAL */}
          {selectedReportId && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white rounded-card max-w-sm w-full max-h-[85vh] overflow-y-auto p-5 space-y-4 shadow-xl relative">
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="absolute top-4 right-4 p-1 text-krishi-grey hover:text-krishi-text rounded-full hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>

                {loadingDetail ? (
                  <div className="py-12 space-y-3">
                    <Skeleton className="h-44 w-full rounded-xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : reportDetail ? (
                  <div className="space-y-4">
                    {/* Leaf Image */}
                    {reportDetail.image_url && (
                      <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 border border-krishi-border">
                        <img
                          src={
                            reportDetail.image_url.startsWith("http")
                              ? reportDetail.image_url
                              : `${backendUrl}${reportDetail.image_url}`
                          }
                          alt={reportDetail.disease?.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Basic Info */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-krishi-grey uppercase tracking-wider">
                          {reportDetail.crop}
                        </span>
                        <span className="text-xs font-mono font-bold text-krishi-green">
                          {(reportDetail.confidence * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-krishi-text mt-0.5">
                        {reportDetail.disease?.name || "Healthy / Undetected"}
                      </h3>
                      <p className="text-[11px] text-krishi-grey">
                        Scanned on{" "}
                        {new Date(reportDetail.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>

                    {/* Symptoms */}
                    {reportDetail.disease?.symptoms && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-krishi-border text-xs space-y-1">
                        <span className="font-bold text-krishi-text block">
                          Observed Symptoms:
                        </span>
                        <p className="text-krishi-grey leading-relaxed">
                          {reportDetail.disease.symptoms}
                        </p>
                      </div>
                    )}

                    {/* Treatments */}
                    {reportDetail.treatments && reportDetail.treatments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-krishi-grey uppercase tracking-wider">
                          Prescribed Treatment
                        </h4>
                        {reportDetail.treatments.map((t, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-emerald-50/60 rounded-xl border border-krishi-green/20 text-xs space-y-1.5"
                          >
                            {t.pesticide_recommendation && (
                              <div>
                                <span className="font-bold text-krishi-text">Chemical: </span>
                                <span className="text-krishi-grey">
                                  {t.pesticide_recommendation}
                                </span>
                              </div>
                            )}
                            {t.organic_option && (
                              <div>
                                <span className="font-bold text-krishi-green">Organic: </span>
                                <span className="text-krishi-grey">
                                  {t.organic_option}
                                </span>
                              </div>
                            )}
                            {t.dosage && (
                              <div>
                                <span className="font-bold text-krishi-text">Dosage: </span>
                                <span className="text-krishi-grey">{t.dosage}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseDetail}
                      className="w-full"
                    >
                      Close Report
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-krishi-grey text-center py-6">
                    Could not load report details.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
