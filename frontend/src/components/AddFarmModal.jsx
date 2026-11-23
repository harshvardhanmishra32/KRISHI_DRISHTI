"use client";

import React, { useState } from "react";
import { X, MapPin, Navigation, Sprout } from "lucide-react";
import { api } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import Button from "./Button";
import ErrorBox from "./ErrorBox";
import { hapticLight, hapticSuccess, hapticError, hapticMedium } from "../lib/haptics";

export default function AddFarmModal({ isOpen, onClose, onSuccess }) {
  const { t } = useLanguage();

  const [farmName, setFarmName] = useState("");
  const [areaAcres, setAreaAcres] = useState("2.5");
  const [state, setState] = useState("Uttar Pradesh");
  const [district, setDistrict] = useState("Lucknow");
  const [latitude, setLatitude] = useState(26.8467);
  const [longitude, setLongitude] = useState(80.9462);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    hapticLight();
    onClose();
  };

  const handleUseLocation = () => {
    hapticMedium();
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      hapticError();
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        let lat = Number(pos.coords.latitude.toFixed(4));
        let lon = Number(pos.coords.longitude.toFixed(4));

        // Clamping to India bounding box if testing from abroad / emulator
        if (lat < 6.0 || lat > 38.0 || lon < 68.0 || lon > 98.0) {
          lat = 26.8467;
          lon = 80.9462;
          setError("Location fell outside India coordinates. Defaulted to Lucknow, UP.");
          hapticWarning();
        } else {
          hapticSuccess();
        }

        setLatitude(lat);
        setLongitude(lon);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError("Could not retrieve GPS location: " + err.message);
        hapticError();
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const areaNum = parseFloat(areaAcres);
    if (isNaN(areaNum) || areaNum <= 0) {
      setError("Area must be a positive number.");
      hapticError();
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        farm_name: farmName.trim() || "My Farm",
        latitude: Number(latitude),
        longitude: Number(longitude),
        area_acres: areaNum,
        state: state.trim() || "Uttar Pradesh",
        district: district.trim() || "Lucknow",
      };

      const result = await api.post("/farms", payload);
      hapticSuccess();
      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err) {
      hapticError();
      setError(err.message || "Failed to add farm. Please check values.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all p-0 sm:p-4">
      <div
        className="w-full max-w-[480px] bg-white rounded-t-[28px] sm:rounded-sheet border border-slate-200/80 p-5 shadow-apple-sheet max-h-[90vh] overflow-y-auto relative animate-in slide-in-from-bottom duration-300 ease-fluid pb-safe"
      >
        {/* iOS Grabber Pill */}
        <div className="w-11 h-1.5 bg-slate-300 rounded-full mx-auto mb-4 cursor-grab select-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-900 rounded-full bg-slate-100/80 active:scale-90 transition-transform"
        >
          <X className="w-4 h-4 stroke-[2.2]" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-krishi-light/90 border border-krishi-green/20 rounded-2xl flex items-center justify-center text-krishi-green shadow-sm">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {t("add_farm")}
            </h2>
            <p className="text-xs text-slate-500">
              Register your land for microclimate & advice
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorBox error={error} onDismiss={() => setError(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 tracking-tight">
              {t("farm_name")}
            </label>
            <input
              type="text"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="e.g. North Acre / उत्तर वाला खेत"
              className="w-full px-3.5 py-3 border border-slate-200 rounded-btn text-sm focus:ring-2 focus:ring-krishi-green focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 tracking-tight">
                {t("area_acres")}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={areaAcres}
                onChange={(e) => setAreaAcres(e.target.value)}
                className="w-full px-3.5 py-3 border border-slate-200 rounded-btn text-sm focus:ring-2 focus:ring-krishi-green focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 tracking-tight">
                {t("district")}
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-3 border border-slate-200 rounded-btn text-sm focus:ring-2 focus:ring-krishi-green focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 tracking-tight">
              {t("state")}
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3.5 py-3 border border-slate-200 rounded-btn text-sm focus:ring-2 focus:ring-krishi-green focus:outline-none"
              required
            />
          </div>

          {/* Location button & preview */}
          <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-krishi-green" />
                GPS Coordinates
              </span>
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={locating}
                className="text-xs font-bold text-krishi-green flex items-center gap-1.5 hover:underline disabled:opacity-50 active:scale-95 transition-transform"
              >
                <Navigation className={`w-3.5 h-3.5 ${locating ? "animate-spin" : ""}`} />
                {locating ? "Locating..." : t("use_my_location")}
              </button>
            </div>
            <div className="text-[11.5px] font-mono text-slate-500 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200/60 inline-block">
              Lat: {latitude.toFixed(4)}, Lon: {longitude.toFixed(4)}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              loading={submitting}
              className="flex-1"
            >
              {t("save")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
