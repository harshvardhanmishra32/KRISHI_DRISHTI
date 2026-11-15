"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Image as ImageIcon,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronDown,
  Info,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import Header from "../../components/Header";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import ErrorBox from "../../components/ErrorBox";

export default function ScanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const fileInputCameraRef = useRef(null);
  const fileInputGalleryRef = useRef(null);

  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Fetch crops & farms on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cropList, farmList] = await Promise.all([
          api.get("/crops").catch(() => []),
          api.get("/farms").catch(() => []),
        ]);
        if (cropList && cropList.length > 0) {
          setCrops(cropList);
          setSelectedCrop(cropList[0].name);
        } else {
          // Fallback popular crops
          setCrops([
            { id: "1", name: "Tomato" },
            { id: "2", name: "Potato" },
            { id: "3", name: "Wheat" },
            { id: "4", name: "Rice" },
            { id: "5", name: "Maize" },
            { id: "6", name: "Cotton" },
          ]);
        }
        if (farmList && farmList.length > 0) {
          setFarms(farmList);
          setSelectedFarmId(farmList[0].id);
        }
      } catch (e) {
        console.error("Error loading scan metadata:", e);
      }
    };
    fetchData();
  }, []);

  // Client-side image resize via HTML Canvas
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          0.82
        );
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    try {
      const compressed = await compressImage(file);
      setImageFile(compressed);
      setImagePreviewUrl(URL.createObjectURL(compressed));
    } catch (err) {
      console.error("Compression error:", err);
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) {
      setError("Please capture or upload a leaf photo first.");
      return;
    }

    setAnalyzing(true);
    setIsSlowNetwork(false);
    setError(null);

    // Slow network trigger after 5 seconds
    const slowTimer = setTimeout(() => {
      setIsSlowNetwork(true);
    }, 5000);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("image", imageFile);
      formData.append("crop", selectedCrop);
      if (selectedFarmId) {
        formData.append("farm_id", selectedFarmId);
      }

      const res = await api.post("/detect-disease", formData);
      clearTimeout(slowTimer);
      setResult(res);
    } catch (err) {
      clearTimeout(slowTimer);
      setError(err.message || "Failed to analyze image. Please try again.");
    } finally {
      setAnalyzing(false);
      setIsSlowNetwork(false);
    }
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setResult(null);
    setError(null);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Text-To-Speech for diagnosis advice
  const handleToggleVoice = () => {
    if (!result) return;
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Text-to-speech is not supported on this device.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const isHealthy =
      result.disease.name.toLowerCase().includes("healthy") ||
      result.confidence < 0.7;

    let textToSpeak = "";
    if (language === "hi") {
      textToSpeak = `फसल ${result.crop}। बीमारी का नाम: ${result.disease.name}। सटीकता: ${(
        result.confidence * 100
      ).toFixed(0)} प्रतिशत। `;
      if (result.plain_explanation) {
        textToSpeak += result.plain_explanation;
      } else if (result.treatments && result.treatments.length > 0) {
        const t0 = result.treatments[0];
        if (t0.pesticide_recommendation) textToSpeak += `दवा: ${t0.pesticide_recommendation}। `;
        if (t0.dosage) textToSpeak += `मात्रा: ${t0.dosage}। `;
      }
    } else {
      textToSpeak = `Crop: ${result.crop}. Detected condition: ${result.disease.name}, with ${(
        result.confidence * 100
      ).toFixed(0)} percent confidence. `;
      if (result.plain_explanation) {
        textToSpeak += result.plain_explanation;
      } else if (result.treatments && result.treatments.length > 0) {
        const t0 = result.treatments[0];
        if (t0.pesticide_recommendation) textToSpeak += `Pesticide: ${t0.pesticide_recommendation}. `;
        if (t0.dosage) textToSpeak += `Dosage: ${t0.dosage}. `;
      }
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  return (
    <ProtectedRoute>
      <div className="pb-24">
        <Header title={t("scan_title")} showBack />

        <div className="p-4 space-y-4">
          {error && <ErrorBox error={error} onDismiss={() => setError(null)} />}

          {/* 1. SELECTION FORM (Only when no result yet) */}
          {!result && (
            <>
              {/* Crop & Farm Picker */}
              <Card className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-krishi-text mb-1">
                      {t("select_crop")}
                    </label>
                    <select
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-krishi-border rounded-button text-xs font-bold text-krishi-text focus:ring-2 focus:ring-krishi-green"
                    >
                      {crops.map((c) => (
                        <option key={c.id || c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-krishi-text mb-1">
                      Farm (Optional)
                    </label>
                    <select
                      value={selectedFarmId}
                      onChange={(e) => setSelectedFarmId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-krishi-border rounded-button text-xs font-bold text-krishi-text focus:ring-2 focus:ring-krishi-green truncate"
                    >
                      <option value="">None / General</option>
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.farm_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              {/* Photo Upload Area */}
              <Card className="text-center p-5 border-dashed border-2 border-krishi-border bg-slate-50/50">
                {imagePreviewUrl ? (
                  <div className="space-y-3">
                    <div className="relative mx-auto w-full max-w-[260px] aspect-square rounded-card overflow-hidden shadow-md border-2 border-krishi-green">
                      <img
                        src={imagePreviewUrl}
                        alt="Captured Leaf"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreviewUrl(null);
                      }}
                      className="text-xs font-bold text-krishi-red hover:underline flex items-center gap-1 mx-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t("retake")}
                    </button>
                  </div>
                ) : (
                  <div className="py-6 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-krishi-light flex items-center justify-center text-krishi-green mx-auto">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-krishi-text">
                        {t("tap_hint")}
                      </h3>
                      <p className="text-[11px] text-krishi-grey mt-0.5">
                        Focus closely on the spots or infected areas
                      </p>
                    </div>

                    <div className="flex gap-2 justify-center pt-2">
                      {/* Native camera trigger */}
                      <button
                        type="button"
                        onClick={() => fileInputCameraRef.current?.click()}
                        className="px-4 py-2.5 bg-krishi-green text-white text-xs font-bold rounded-button shadow-sm flex items-center gap-1.5 hover:bg-krishi-dark active:scale-95 transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        {t("take_photo")}
                      </button>

                      {/* Gallery trigger */}
                      <button
                        type="button"
                        onClick={() => fileInputGalleryRef.current?.click()}
                        className="px-4 py-2.5 bg-white border border-krishi-border text-krishi-text text-xs font-bold rounded-button shadow-xs flex items-center gap-1.5 hover:bg-slate-50 active:scale-95 transition-all"
                      >
                        <ImageIcon className="w-4 h-4 text-krishi-grey" />
                        {t("upload_gallery")}
                      </button>
                    </div>

                    {/* Hidden inputs */}
                    <input
                      ref={fileInputCameraRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                    <input
                      ref={fileInputGalleryRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                    />
                  </div>
                )}
              </Card>

              {/* Action Button */}
              {imageFile && (
                <div className="space-y-2">
                  <Button
                    onClick={handleAnalyze}
                    loading={analyzing}
                    icon={Sparkles}
                    className="w-full text-base font-bold shadow-md"
                  >
                    {analyzing ? t("analyzing") : "Diagnose Leaf Disease"}
                  </Button>

                  {isSlowNetwork && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2 animate-pulse">
                      <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>{t("slow_network")}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* 2. DIAGNOSIS RESULT SCREEN */}
          {result && (
            <div className="space-y-4 animate-fadeIn">
              {/* Header card with Leaf thumbnail & Diagnosis */}
              <Card className="overflow-hidden border-2 border-krishi-green/30 shadow-md">
                <div className="flex gap-3">
                  <div className="w-24 h-24 rounded-card overflow-hidden bg-slate-100 flex-shrink-0 border border-krishi-border">
                    <img
                      src={
                        imagePreviewUrl ||
                        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}${result.image_url}`
                      }
                      alt="Diagnosed Leaf"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-krishi-grey uppercase tracking-wider">
                      {result.crop}
                    </span>
                    <h2 className="text-lg font-black text-krishi-text leading-tight truncate">
                      {result.disease.name}
                    </h2>
                    {result.disease.causal_organism && (
                      <p className="text-[11px] italic text-krishi-grey truncate">
                        {result.disease.causal_organism}
                      </p>
                    )}

                    {/* Confidence Meter */}
                    <div className="mt-2">
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>{t("confidence")}</span>
                        <span
                          className={
                            result.confidence >= 0.70
                              ? "text-krishi-green"
                              : "text-krishi-orange"
                          }
                        >
                          {(result.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            result.confidence >= 0.70
                              ? "bg-krishi-green"
                              : "bg-krishi-orange"
                          }`}
                          style={{ width: `${Math.min(100, result.confidence * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Voice Audio Button */}
                <div className="mt-3 pt-3 border-t border-krishi-border flex items-center justify-between">
                  <button
                    onClick={handleToggleVoice}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      isSpeaking
                        ? "bg-krishi-red text-white"
                        : "bg-krishi-light text-krishi-green hover:bg-emerald-100"
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" /> Stop Audio
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5" /> {t("listen")}
                      </>
                    )}
                  </button>

                  <span className="text-[11px] text-krishi-grey font-mono">
                    {result.inference_time_ms.toFixed(0)} ms latency
                  </span>
                </div>
              </Card>

              {/* Warning Banners */}
              {result.low_confidence && (
                <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-amber-900 text-xs flex items-start gap-2 shadow-xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Low Confidence Alert</span>
                    <span>{t("low_conf_warning")}</span>
                  </div>
                </div>
              )}

              {result.crop_mismatch && (
                <div className="p-3 bg-red-50 border-l-4 border-krishi-red rounded-r-xl text-red-900 text-xs flex items-start gap-2 shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-krishi-red flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Crop Mismatch Warning</span>
                    <span>{t("crop_mismatch_warning")}</span>
                  </div>
                </div>
              )}

              {/* Plain Language Explanation */}
              {result.plain_explanation && (
                <Card className="bg-emerald-50/50 border-krishi-green/20">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-krishi-green mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Doctor&apos;s Summary
                  </div>
                  <p className="text-xs text-krishi-text leading-relaxed">
                    {result.plain_explanation}
                  </p>
                </Card>
              )}

              {/* Top 3 Predictions */}
              {result.top3 && result.top3.length > 0 && (
                <Card className="space-y-2">
                  <h3 className="text-xs font-bold text-krishi-grey uppercase tracking-wider">
                    Model Predictions
                  </h3>
                  <div className="space-y-1.5">
                    {result.top3.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-krishi-text truncate pr-2">
                          {p.class_name.replace(/___/g, " - ").replace(/_/g, " ")}
                        </span>
                        <span className="font-mono font-bold text-krishi-grey">
                          {(p.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Symptoms */}
              {result.disease?.symptoms && (
                <Card className="space-y-1">
                  <h3 className="text-xs font-bold text-krishi-grey uppercase tracking-wider">
                    Symptoms
                  </h3>
                  <p className="text-xs text-krishi-text leading-relaxed">
                    {result.disease.symptoms}
                  </p>
                </Card>
              )}

              {/* Recommended Treatments */}
              {result.treatments && result.treatments.length > 0 ? (
                <Card className="space-y-3">
                  <h3 className="text-xs font-bold text-krishi-grey uppercase tracking-wider">
                    {t("treatments")}
                  </h3>

                  {result.treatments.map((tr, idx) => (
                    <div
                      key={tr.id || idx}
                      className="p-3 bg-slate-50 rounded-xl space-y-2 border border-krishi-border text-xs"
                    >
                      {tr.pesticide_recommendation && (
                        <div>
                          <span className="font-bold text-krishi-text">
                            Pesticide / Fungicide:{" "}
                          </span>
                          <span className="text-krishi-grey">
                            {tr.pesticide_recommendation}
                          </span>
                        </div>
                      )}

                      {tr.organic_option && (
                        <div>
                          <span className="font-bold text-krishi-green">
                            Organic / Bio-control:{" "}
                          </span>
                          <span className="text-krishi-grey">
                            {tr.organic_option}
                          </span>
                        </div>
                      )}

                      {tr.dosage && (
                        <div>
                          <span className="font-bold text-krishi-text">
                            Dosage:{" "}
                          </span>
                          <span className="text-krishi-grey">{tr.dosage}</span>
                        </div>
                      )}

                      {tr.application_method && (
                        <div>
                          <span className="font-bold text-krishi-text">
                            Method:{" "}
                          </span>
                          <span className="text-krishi-grey">
                            {tr.application_method}
                          </span>
                        </div>
                      )}

                      {tr.safety_note && (
                        <div className="pt-1 text-[11px] text-krishi-orange font-medium">
                          ⚠️ {tr.safety_note}
                        </div>
                      )}
                    </div>
                  ))}
                </Card>
              ) : (
                <Card className="p-3 bg-emerald-50 border-krishi-green/20 text-center">
                  <CheckCircle2 className="w-6 h-6 text-krishi-green mx-auto mb-1" />
                  <p className="text-xs font-bold text-krishi-text">
                    Plant is Healthy
                  </p>
                  <p className="text-[11px] text-krishi-grey mt-0.5">
                    No chemical treatment required. Maintain standard irrigation and nutrition.
                  </p>
                </Card>
              )}

              {/* Mandatory Regulatory Disclaimer */}
              <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-krishi-grey flex items-start gap-2">
                <Info className="w-4 h-4 text-krishi-grey flex-shrink-0 mt-0.5" />
                <span>{result.disclaimer || t("disclaimer")}</span>
              </div>

              {/* Reset / Scan Another Leaf */}
              <Button
                variant="outline"
                icon={RotateCcw}
                onClick={handleReset}
                className="w-full"
              >
                {t("scan_another")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
