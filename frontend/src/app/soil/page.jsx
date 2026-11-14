"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FlaskConical,
  Sprout,
  Plus,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Camera,
  Layers,
  ArrowRight,
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
import AddFarmModal from "../../components/AddFarmModal";

const SOIL_TYPES = [
  "Alluvial",
  "Black (Regur)",
  "Red & Yellow",
  "Laterite",
  "Sandy Loam",
  "Clay",
];

export default function SoilPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState("manual"); // 'manual' | 'ai'
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);

  // Form State
  const [soilType, setSoilType] = useState("Alluvial");
  const [ph, setPh] = useState(6.8);
  const [nitrogen, setNitrogen] = useState(140);
  const [phosphorus, setPhosphorus] = useState(55);
  const [potassium, setPotassium] = useState(180);
  const [organicCarbon, setOrganicCarbon] = useState(0.65);

  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);

  // Fetch user farms
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const data = await api.get("/farms");
        setFarms(data || []);
        if (data && data.length > 0) {
          setSelectedFarmId(data[0].id);
        }
      } catch (e) {
        console.error("Failed to load farms:", e);
      }
    };
    fetchFarms();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFarmId) {
      setError("Please select or add a farm first.");
      return;
    }

    const phVal = parseFloat(ph);
    if (isNaN(phVal) || phVal < 3.5 || phVal > 9.5) {
      setError("Soil pH must be between 3.5 and 9.5.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Save soil record
      await api.post("/soil-records", {
        farm_id: selectedFarmId,
        soil_type: soilType,
        ph: phVal,
        nitrogen: parseFloat(nitrogen) || 0,
        phosphorus: parseFloat(phosphorus) || 0,
        potassium: parseFloat(potassium) || 0,
        organic_carbon: parseFloat(organicCarbon) || 0,
        source: "lab_test",
      });

      // 2. Fetch AI crop recommendation
      const recRes = await api.get(`/recommend-crops?farm_id=${selectedFarmId}`);
      setRecommendations(recRes);
    } catch (err) {
      setError(err.message || "Failed to analyze soil and generate recommendations.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="pb-24">
        <Header title={t("soil_title")} showBack />

        <div className="p-4 space-y-4">
          {error && <ErrorBox error={error} onDismiss={() => setError(null)} />}

          {/* Farm Selector Banner */}
          <Card className="p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-krishi-grey whitespace-nowrap">
                Farm:
              </span>
              {farms.length > 0 ? (
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="text-xs font-bold text-krishi-text bg-white border border-krishi-border rounded-button px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-krishi-green w-full max-w-[220px] truncate"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farm_name} ({f.district})
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-semibold text-krishi-orange">
                  No farm added yet
                </span>
              )}

              <button
                type="button"
                onClick={() => setIsAddFarmOpen(true)}
                className="p-1.5 bg-krishi-light text-krishi-green rounded-button hover:bg-emerald-100 transition-colors"
                title={t("add_farm")}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </Card>

          {/* Tab Selection */}
          <div className="flex bg-slate-100 p-1 rounded-card border border-krishi-border">
            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === "manual"
                  ? "bg-white text-krishi-green shadow-xs"
                  : "text-krishi-grey hover:text-krishi-text"
              }`}
            >
              {t("tab_manual")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ai")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                activeTab === "ai"
                  ? "bg-white text-krishi-green shadow-xs"
                  : "text-krishi-grey opacity-75 hover:opacity-100"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{t("tab_ai")}</span>
            </button>
          </div>

          {/* TAB 1: MANUAL LAB REPORT FORM */}
          {activeTab === "manual" && (
            <Card className="space-y-4">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-krishi-green" />
                <h3 className="text-sm font-bold text-krishi-text">
                  Enter Soil Test Parameters
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-krishi-text mb-1">
                    {t("soil_type")}
                  </label>
                  <select
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-krishi-border rounded-button text-xs font-bold text-krishi-text focus:ring-2 focus:ring-krishi-green"
                  >
                    {SOIL_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* pH Slider and Input */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-krishi-text">
                      {t("ph")}
                    </label>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-krishi-light text-krishi-green rounded-md">
                      {Number(ph).toFixed(1)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3.5"
                    max="9.5"
                    step="0.1"
                    value={ph}
                    onChange={(e) => setPh(e.target.value)}
                    className="w-full accent-krishi-green cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-krishi-grey font-mono mt-0.5">
                    <span>Acidic (3.5)</span>
                    <span>Neutral (7.0)</span>
                    <span>Alkaline (9.5)</span>
                  </div>
                </div>

                {/* N - P - K Inputs */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-krishi-text mb-1">
                      N (kg/ha)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={nitrogen}
                      onChange={(e) => setNitrogen(e.target.value)}
                      className="w-full px-2.5 py-2 border border-krishi-border rounded-button text-xs font-mono font-bold focus:ring-2 focus:ring-krishi-green"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-krishi-text mb-1">
                      P (kg/ha)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={phosphorus}
                      onChange={(e) => setPhosphorus(e.target.value)}
                      className="w-full px-2.5 py-2 border border-krishi-border rounded-button text-xs font-mono font-bold focus:ring-2 focus:ring-krishi-green"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-krishi-text mb-1">
                      K (kg/ha)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={potassium}
                      onChange={(e) => setPotassium(e.target.value)}
                      className="w-full px-2.5 py-2 border border-krishi-border rounded-button text-xs font-mono font-bold focus:ring-2 focus:ring-krishi-green"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-krishi-text mb-1">
                    {t("organic_carbon")}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={organicCarbon}
                    onChange={(e) => setOrganicCarbon(e.target.value)}
                    className="w-full px-3 py-2 border border-krishi-border rounded-button text-xs font-mono font-bold focus:ring-2 focus:ring-krishi-green"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    loading={loading}
                    icon={Sparkles}
                    className="w-full text-sm font-bold shadow-md"
                  >
                    {t("submit_soil")}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* TAB 2: AI QUICK ESTIMATE (COMING SOON) */}
          {activeTab === "ai" && (
            <Card className="text-center py-8 space-y-3 bg-slate-50/70 border-dashed">
              <div className="w-14 h-14 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                <Camera className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-krishi-text">
                  Photo Soil Texture Estimation
                </h3>
                <p className="text-xs text-krishi-grey max-w-[280px] mx-auto mt-1 leading-relaxed">
                  Optical soil NPK estimation is currently in pilot validation. Please enter certified laboratory or Soil Health Card measurements.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("manual")}
                className="mx-auto"
              >
                Switch to Manual Entry
              </Button>
            </Card>
          )}

          {/* RECOMMENDATIONS RESULT */}
          {recommendations && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-krishi-grey uppercase tracking-wider flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-krishi-green" />
                  {t("top_crops")} ({recommendations.season})
                </h3>
                <Chip variant="success" className="text-[10px] py-0.5">
                  ML + Rule Engine
                </Chip>
              </div>

              {recommendations.recommendations?.map((item, idx) => (
                <Card
                  key={idx}
                  className="space-y-2 border-l-4 border-l-krishi-green shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-krishi-grey uppercase">
                        Rank #{idx + 1}
                      </span>
                      <h4 className="text-base font-black text-krishi-text">
                        {item.crop_name}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-krishi-green">
                        {item.score.toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-krishi-grey block">
                        Suitability
                      </span>
                    </div>
                  </div>

                  {/* Reasons */}
                  {item.reasons && item.reasons.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {item.reasons.map((r, rIdx) => (
                        <div
                          key={rIdx}
                          className="flex items-start gap-1.5 text-xs text-krishi-text"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-krishi-green flex-shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Cautions */}
                  {item.cautions && item.cautions.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-krishi-border/60">
                      {item.cautions.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="flex items-start gap-1.5 text-xs text-amber-800"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-krishi-orange flex-shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}

              {/* Mandatory Soil Disclaimer */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{recommendations.note || t("soil_note")}</span>
              </div>
            </div>
          )}

          {/* Government Soil Testing Lab Portal Link */}
          <Card className="bg-slate-50 border-krishi-border text-center p-4">
            <h4 className="text-xs font-bold text-krishi-text mb-1">
              Need an official Soil Health Card?
            </h4>
            <p className="text-[11px] text-krishi-grey mb-3">
              Government of India Soil Health Card scheme offers subsidized testing.
            </p>
            <a
              href="https://soilhealth.dac.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-krishi-border rounded-button text-xs font-bold text-krishi-green shadow-xs hover:bg-slate-100 transition-colors"
            >
              <span>{t("find_lab")}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Card>
        </div>

        <AddFarmModal
          isOpen={isAddFarmOpen}
          onClose={() => setIsAddFarmOpen(false)}
          onSuccess={(f) => {
            setFarms((prev) => [f, ...prev]);
            setSelectedFarmId(f.id);
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
