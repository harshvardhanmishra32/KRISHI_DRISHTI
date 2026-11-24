"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sprout,
  Plus,
  CloudSun,
  Camera,
  FlaskConical,
  IndianRupee,
  Mic,
  AlertTriangle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Droplets,
  Wind,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import Card from "../../components/Card";
import MusicButton from "../../components/ui/MusicButton";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import Skeleton from "../../components/Skeleton";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import AddFarmModal from "../../components/AddFarmModal";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();

  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [weather, setWeather] = useState(null);
  const [recentScan, setRecentScan] = useState(null);
  const [loadingFarms, setLoadingFarms] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);

  // Format today's date in Hindi or English
  const todayFormatted = new Intl.DateTimeFormat(
    language === "hi" ? "hi-IN" : "en-IN",
    { weekday: "long", day: "numeric", month: "short" }
  ).format(new Date());

  // Load farms on mount
  const fetchFarms = async () => {
    try {
      setLoadingFarms(true);
      const data = await api.get("/farms");
      setFarms(data || []);
      if (data && data.length > 0) {
        setSelectedFarm(data[0]);
      }
    } catch (e) {
      console.error("Failed to load farms:", e);
    } finally {
      setLoadingFarms(false);
    }
  };

  // Fetch weather when selectedFarm changes
  useEffect(() => {
    const fetchWeather = async () => {
      setLoadingWeather(true);
      try {
        if (selectedFarm) {
          try {
            const res = await api.get(`/get-weather?farm_id=${selectedFarm.id}`);
            setWeather(res);
          } catch (e) {
            const res = await api.get(
              `/get-weather?lat=${selectedFarm.latitude}&lon=${selectedFarm.longitude}`
            );
            setWeather(res);
          }
        } else if (!loadingFarms) {
          // Regional default weather (Lucknow, UP / North Central India)
          const res = await api.get("/get-weather?lat=26.8467&lon=80.9462");
          setWeather(res);
        }
      } catch (err) {
        console.error("Weather fetch fallback failed:", err);
      } finally {
        setLoadingWeather(false);
      }
    };

    fetchWeather();
  }, [selectedFarm, loadingFarms]);

  // Fetch recent scan activity
  useEffect(() => {
    const fetchRecentScan = async () => {
      try {
        const res = await api.get("/disease-history?limit=1");
        if (res?.items && res.items.length > 0) {
          setRecentScan(res.items[0]);
        }
      } catch (e) {
        // Quietly fail for recent scans
      }
    };

    fetchRecentScan();
  }, []);

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleFarmAdded = (newFarm) => {
    setFarms((prev) => [newFarm, ...prev]);
    setSelectedFarm(newFarm);
  };

  return (
    <ProtectedRoute>
      <div className="p-4 space-y-4 pb-24">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-krishi-light flex items-center justify-center text-krishi-green">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-krishi-text leading-tight">
                {t("greeting")}, {user?.name || "Farmer"}
              </h1>
              <p className="text-[11px] text-krishi-grey capitalize">
                {todayFormatted}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <MusicButton compact />
            <LanguageSwitcher />
            <button
              onClick={logout}
              title={t("logout")}
              className="p-2 text-krishi-grey hover:text-krishi-red rounded-full hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Farm Selector Banner */}
        <div className="flex items-center justify-between bg-white px-3 py-2 rounded-card border border-krishi-border shadow-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xs font-bold text-krishi-grey whitespace-nowrap">
              Farm:
            </span>
            {loadingFarms ? (
              <span className="text-xs text-krishi-grey">Loading...</span>
            ) : farms.length > 0 ? (
              <select
                value={selectedFarm?.id || ""}
                onChange={(e) => {
                  const f = farms.find((farm) => farm.id === e.target.value);
                  if (f) setSelectedFarm(f);
                }}
                className="text-xs font-bold text-krishi-text bg-transparent focus:outline-none truncate max-w-[190px]"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farm_name} ({f.district})
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-krishi-orange font-semibold">
                No farm added yet
              </span>
            )}
          </div>

          <button
            onClick={() => setIsAddFarmOpen(true)}
            className="flex items-center gap-1 text-xs font-bold text-krishi-green hover:underline whitespace-nowrap pl-2"
          >
            <Plus className="w-3.5 h-3.5" />
            {t("add_farm")}
          </button>
        </div>

        {/* Weather Mini-Widget */}
        {loadingWeather ? (
          <Skeleton className="h-28 w-full rounded-card" />
        ) : weather ? (
          <Card
            onClick={() => router.push("/weather")}
            className="bg-gradient-to-r from-krishi-blue/10 via-white to-krishi-light/20 border-krishi-blue/20 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold tracking-wide uppercase text-krishi-blue">
                  {weather.farm_name || selectedFarm?.farm_name || "Current Weather"}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-krishi-text">
                    {Math.round(weather.current.temperature)}°C
                  </span>
                  <span className="text-xs font-semibold text-krishi-grey capitalize">
                    {weather.current.description}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-krishi-grey">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-krishi-blue" />
                    {weather.current.humidity}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="w-3.5 h-3.5 text-krishi-grey" />
                    {weather.current.wind_speed} km/h
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <CloudSun className="w-10 h-10 text-krishi-blue" />
                {weather.disease_risk && weather.disease_risk.level !== "Low" && (
                  <Chip variant="warning" className="text-[10px] py-0.5">
                    {weather.disease_risk.level} Risk
                  </Chip>
                )}
                {weather.spray_advice?.suitable && (
                  <Chip variant="success" className="text-[10px] py-0.5">
                    Safe to Spray
                  </Chip>
                )}
              </div>
            </div>
          </Card>
        ) : !selectedFarm && !loadingFarms ? (
          <Card className="bg-krishi-light/40 border-dashed border-2 border-krishi-green/40 text-center py-5">
            <Sprout className="w-8 h-8 text-krishi-green mx-auto mb-1" />
            <h3 className="text-sm font-bold text-krishi-text">
              Add your farm for local weather
            </h3>
            <p className="text-xs text-krishi-grey mt-0.5 mb-3">
              Get fungal disease risk alerts and safe spray windows
            </p>
            <Button
              size="sm"
              icon={Plus}
              onClick={() => setIsAddFarmOpen(true)}
              className="mx-auto"
            >
              {t("add_farm")}
            </Button>
          </Card>
        ) : null}

        {/* 6 Quick Action Grid */}
        <div>
          <h2 className="text-xs font-bold text-krishi-grey uppercase tracking-wider mb-2.5">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {/* 1. Disease Scan */}
            <button
              onClick={() => router.push("/scan")}
              className="p-3.5 bg-white rounded-card border border-krishi-border shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 group"
            >
              <div className="w-9 h-9 rounded-xl bg-krishi-light flex items-center justify-center text-krishi-green group-hover:scale-105 transition-transform">
                <Camera className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-sm font-bold text-krishi-text block leading-tight">
                  {t("scan_tile")}
                </span>
                <span className="text-[11px] text-krishi-grey">
                  AI Leaf Doctor
                </span>
              </div>
            </button>

            {/* 2. Weather & Spray */}
            <button
              onClick={() => router.push("/weather")}
              className="p-3.5 bg-white rounded-card border border-krishi-border shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 group"
            >
              <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-krishi-blue group-hover:scale-105 transition-transform">
                <CloudSun className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-sm font-bold text-krishi-text block leading-tight">
                  {t("weather_tile")}
                </span>
                <span className="text-[11px] text-krishi-grey">
                  Forecast & Spray
                </span>
              </div>
            </button>

            {/* 3. Soil Health */}
            <button
              onClick={() => router.push("/soil")}
              className="p-3.5 bg-white rounded-card border border-krishi-border shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-krishi-green group-hover:scale-105 transition-transform">
                <FlaskConical className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-sm font-bold text-krishi-text block leading-tight">
                  {t("soil_tile")}
                </span>
                <span className="text-[11px] text-krishi-grey">
                  NPK & Advice
                </span>
              </div>
            </button>

            {/* 4. Expenses & Profit */}
            <button
              onClick={() => router.push("/tracker")}
              className="p-3.5 bg-white rounded-card border border-krishi-border shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 group"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-krishi-orange group-hover:scale-105 transition-transform">
                <IndianRupee className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-sm font-bold text-krishi-text block leading-tight">
                  {t("expenses_tile")}
                </span>
                <span className="text-[11px] text-krishi-grey">
                  Cost & Returns
                </span>
              </div>
            </button>

            {/* 5. Voice Assistant */}
            <button
              onClick={() => router.push("/voice")}
              className="p-3.5 bg-white rounded-card border border-krishi-border shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 group"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700 group-hover:scale-105 transition-transform">
                <Mic className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-sm font-bold text-krishi-text block leading-tight">
                  {t("voice_tile")}
                </span>
                <span className="text-[11px] text-krishi-grey">
                  Hindi & English Help
                </span>
              </div>
            </button>

            {/* 6. Outbreak Alerts */}
            <button
              onClick={() => router.push("/outbreaks")}
              className="p-3.5 bg-white rounded-card border border-krishi-border shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between h-28 group"
            >
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-krishi-red group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-sm font-bold text-krishi-text block leading-tight">
                  {t("outbreaks_tile")}
                </span>
                <span className="text-[11px] text-krishi-grey">
                  Nearby Clusters
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Scan Activity */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-krishi-grey uppercase tracking-wider">
              {t("recent_activity")}
            </h2>
            <div className="flex items-center gap-3">
              <Link
                href="/history"
                className="text-xs font-bold text-krishi-grey hover:text-krishi-text hover:underline"
              >
                View History
              </Link>
              <Link
                href="/scan"
                className="text-xs font-bold text-krishi-green hover:underline flex items-center"
              >
                New Scan <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {recentScan ? (
            <Card
              onClick={() => router.push("/scan")}
              className="p-3 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {recentScan.image_url ? (
                    <img
                      src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}${recentScan.image_url}`}
                      alt={recentScan.disease_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <Camera className="w-5 h-5 text-krishi-grey" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-krishi-text leading-tight">
                    {recentScan.disease_name}
                  </h4>
                  <p className="text-xs text-krishi-grey">
                    {recentScan.crop_name} • {(recentScan.confidence * 100).toFixed(0)}% confidence
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-krishi-grey" />
            </Card>
          ) : (
            <Card className="text-center py-6 bg-slate-50 border-dashed">
              <Camera className="w-8 h-8 text-krishi-grey mx-auto mb-1 opacity-60" />
              <p className="text-xs font-semibold text-krishi-text">
                No scans recorded yet
              </p>
              <p className="text-[11px] text-krishi-grey mt-0.5 mb-3">
                Take a leaf photo to diagnose diseases instantly
              </p>
              <Button
                size="sm"
                onClick={() => router.push("/scan")}
                icon={Camera}
                className="mx-auto"
              >
                Scan Leaf Now
              </Button>
            </Card>
          )}
        </div>

        {/* Modal for Adding a Farm */}
        <AddFarmModal
          isOpen={isAddFarmOpen}
          onClose={() => setIsAddFarmOpen(false)}
          onSuccess={handleFarmAdded}
        />
      </div>
    </ProtectedRoute>
  );
}
