"use client";

import React, { useState, useEffect } from "react";
import {
  CloudSun,
  Droplets,
  Wind,
  CloudRain,
  AlertTriangle,
  Clock,
  Sparkles,
  Info,
  Calendar,
  Compass,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import Header from "../../components/Header";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import Skeleton from "../../components/Skeleton";
import ErrorBox from "../../components/ErrorBox";

const DEFAULT_REGIONS = [
  { id: "lucknow", name: "Lucknow, Uttar Pradesh", lat: 26.8467, lon: 80.9462 },
  { id: "delhi", name: "Delhi / NCR", lat: 28.6139, lon: 77.2090 },
  { id: "ludhiana", name: "Ludhiana, Punjab", lat: 30.9010, lon: 75.8573 },
  { id: "nashik", name: "Nashik, Maharashtra", lat: 19.9975, lon: 73.7898 },
  { id: "patna", name: "Patna, Bihar", lat: 25.5941, lon: 85.1376 },
];

export default function WeatherPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [farms, setFarms] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_REGIONS[0]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user farms if logged in
  useEffect(() => {
    const fetchFarms = async () => {
      if (!user) return;
      try {
        const userFarms = await api.get("/farms");
        if (userFarms && userFarms.length > 0) {
          const farmOptions = userFarms.map((f) => ({
            id: f.id,
            name: `${f.farm_name} (${f.district})`,
            lat: f.latitude,
            lon: f.longitude,
            isFarm: true,
          }));
          setFarms(farmOptions);
          setSelectedLocation(farmOptions[0]);
        }
      } catch (e) {
        console.warn("Could not load user farms for weather:", e);
      }
    };
    fetchFarms();
  }, [user]);

  // Fetch weather data for selected location
  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        let endpoint = `/get-weather?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}`;
        if (selectedLocation.isFarm) {
          endpoint = `/get-weather?farm_id=${selectedLocation.id}`;
        }

        const data = await api.get(endpoint);
        setWeather(data);
      } catch (err) {
        console.error("Failed to load weather:", err);
        setError(err.message || "Failed to load weather data.");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [selectedLocation]);

  return (
    <div className="pb-24">
      <Header title={t("weather_title")} showBack />

      <div className="p-4 space-y-4">
        {/* Location / Farm Selector */}
        <Card className="p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-krishi-grey whitespace-nowrap flex items-center gap-1">
              <Compass className="w-4 h-4 text-krishi-blue" />
              Location:
            </span>
            <select
              value={selectedLocation.id}
              onChange={(e) => {
                const combined = [...farms, ...DEFAULT_REGIONS];
                const found = combined.find((loc) => loc.id === e.target.value);
                if (found) setSelectedLocation(found);
              }}
              className="text-xs font-bold text-krishi-text bg-white border border-krishi-border rounded-button px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-krishi-blue w-full max-w-[270px] truncate"
            >
              {farms.length > 0 && (
                <optgroup label="My Farms">
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Major Agricultural Regions">
                {DEFAULT_REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </Card>

        {/* Offline / Stale Data Banner */}
        {weather?.stale && (
          <div className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-amber-900 text-xs flex items-center gap-2 shadow-xs">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{t("stale_data")}</span>
          </div>
        )}

        {error && <ErrorBox error={error} onDismiss={() => setError(null)} />}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-44 w-full rounded-card" />
            <Skeleton className="h-28 w-full rounded-card" />
            <Skeleton className="h-32 w-full rounded-card" />
          </div>
        ) : weather ? (
          <div className="space-y-4">
            {/* HERO TEMPERATURE CARD */}
            <Card className="bg-gradient-to-br from-sky-500 via-blue-600 to-emerald-700 text-white p-5 shadow-lg relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider">
                    {weather.current.city_name || selectedLocation.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-5xl font-black tracking-tight">
                      {Math.round(weather.current.temperature)}°
                    </span>
                    <span className="text-xl font-medium text-white/90">C</span>
                  </div>
                  <p className="text-sm font-semibold capitalize text-white/90 mt-1">
                    {weather.current.description}
                  </p>
                  <p className="text-xs text-white/70 mt-0.5">
                    Feels like {Math.round(weather.current.feels_like)}°C • Min {Math.round(weather.current.temp_min)}° / Max {Math.round(weather.current.temp_max)}°
                  </p>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                  <CloudSun className="w-10 h-10 text-white" />
                </div>
              </div>

              {/* Grid of Microclimate Stats */}
              <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/20 text-center">
                <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
                  <span className="text-[10px] text-white/80 block">{t("humidity")}</span>
                  <span className="text-sm font-bold flex items-center justify-center gap-1 mt-0.5">
                    <Droplets className="w-3.5 h-3.5" />
                    {weather.current.humidity}%
                  </span>
                </div>

                <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
                  <span className="text-[10px] text-white/80 block">{t("wind")}</span>
                  <span className="text-sm font-bold flex items-center justify-center gap-1 mt-0.5">
                    <Wind className="w-3.5 h-3.5" />
                    {weather.current.wind_speed} m/s
                  </span>
                </div>

                <div className="bg-white/10 rounded-xl p-2 backdrop-blur-xs">
                  <span className="text-[10px] text-white/80 block">Rainfall</span>
                  <span className="text-sm font-bold flex items-center justify-center gap-1 mt-0.5">
                    <CloudRain className="w-3.5 h-3.5" />
                    {weather.current.rainfall_mm} mm
                  </span>
                </div>
              </div>
            </Card>

            {/* DISEASE RISK ALERT BANNER */}
            {weather.disease_risk && (
              <Card
                className={`p-3.5 border-l-4 shadow-sm ${
                  weather.disease_risk.level === "high"
                    ? "bg-red-50/70 border-krishi-red"
                    : weather.disease_risk.level === "medium"
                    ? "bg-amber-50/70 border-krishi-orange"
                    : "bg-emerald-50/70 border-krishi-green"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      weather.disease_risk.level === "high"
                        ? "text-krishi-red"
                        : weather.disease_risk.level === "medium"
                        ? "text-krishi-orange"
                        : "text-krishi-green"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-krishi-text">
                        {t("disease_risk")}:
                      </h4>
                      <Chip
                        variant={
                          weather.disease_risk.level === "high"
                            ? "danger"
                            : weather.disease_risk.level === "medium"
                            ? "warning"
                            : "success"
                        }
                        className="py-0.5 text-[10px]"
                      >
                        {weather.disease_risk.level.toUpperCase()}
                      </Chip>
                    </div>
                    <p className="text-xs text-krishi-text mt-1 leading-relaxed">
                      {weather.disease_risk.reason}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* SPRAY ADVICE & RECOMMENDED WINDOWS */}
            {weather.spray_advice && (
              <Card className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-krishi-grey uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-krishi-green" />
                    {t("spray_window")}
                  </h3>
                  <Chip
                    variant={weather.spray_advice.is_recommended ? "success" : "danger"}
                    className="text-[10px] py-0.5"
                  >
                    {weather.spray_advice.is_recommended ? "Recommended" : "Not Recommended"}
                  </Chip>
                </div>

                <p className="text-xs font-medium text-krishi-text leading-relaxed">
                  {weather.spray_advice.summary}
                </p>

                {weather.spray_advice.best_windows &&
                  weather.spray_advice.best_windows.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {weather.spray_advice.best_windows.map((win, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-50 rounded-xl border border-krishi-border text-xs flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-krishi-text block">
                              {win.time_window}
                            </span>
                            <span className="text-[11px] text-krishi-grey">
                              {win.reason}
                            </span>
                          </div>
                          <div className="text-right font-mono text-[11px] text-krishi-grey">
                            <span>{win.temperature}°C</span>
                            <span className="mx-1">•</span>
                            <span>{win.wind_speed} m/s</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                <div className="text-[11px] text-krishi-grey italic pt-1 flex items-start gap-1">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-krishi-grey" />
                  <span>{weather.spray_advice.disclaimer}</span>
                </div>
              </Card>
            )}

            {/* 5-DAY FORECAST (HORIZONTAL SCROLL) */}
            {weather.forecast && weather.forecast.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-krishi-grey uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-krishi-blue" />
                  {t("forecast_5d")}
                </h3>

                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {weather.forecast.map((day, idx) => (
                    <div
                      key={day.date || idx}
                      className="min-w-[100px] flex-shrink-0 bg-white p-3 rounded-card border border-krishi-border text-center shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-krishi-text block">
                          {day.day_name.slice(0, 3)}
                        </span>
                        <span className="text-[10px] text-krishi-grey block">
                          {day.date.slice(5)}
                        </span>
                      </div>

                      <div className="my-2">
                        <CloudSun className="w-7 h-7 text-krishi-blue mx-auto" />
                        <span className="text-[11px] font-bold text-krishi-text block mt-1">
                          {Math.round(day.temp_max)}° / {Math.round(day.temp_min)}°
                        </span>
                      </div>

                      <div className="text-[10px] text-krishi-grey">
                        {day.rain_probability > 0 ? (
                          <span className="text-krishi-blue font-semibold">
                            💧 {Math.round(day.rain_probability)}%
                          </span>
                        ) : (
                          <span>Dry</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
