"use client";

import React, { useState } from "react";
import { X, MapPin, Navigation, Sprout } from "lucide-react";
import { api } from "../lib/api";
import { useLanguage } from "../context/LanguageContext";
import Button from "./Button";
import Card from "./Card";
import ErrorBox from "./ErrorBox";

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

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
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
        }

        setLatitude(lat);
        setLongitude(lon);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setError("Could not retrieve GPS location: " + err.message);
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
      if (onSuccess) {
        onSuccess(result);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add farm. Please check values.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl relative border-krishi-border">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-krishi-grey hover:text-krishi-text rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-krishi-light rounded-xl text-krishi-green">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-krishi-text">
              {t("add_farm")}
            </h2>
            <p className="text-xs text-krishi-grey">
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
            <label className="block text-xs font-bold text-krishi-text mb-1">
              {t("farm_name")}
            </label>
            <input
              type="text"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="e.g. North Acre / उत्तर वाला खेत"
              className="w-full px-3 py-2.5 border border-krishi-border rounded-button text-sm focus:ring-2 focus:ring-krishi-green focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-krishi-text mb-1">
                {t("area_acres")}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={areaAcres}
                onChange={(e) => setAreaAcres(e.target.value)}
                className="w-full px-3 py-2.5 border border-krishi-border rounded-button text-sm focus:ring-2 focus:ring-krishi-green focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-krishi-text mb-1">
                {t("district")}
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2.5 border border-krishi-border rounded-button text-sm focus:ring-2 focus:ring-krishi-green focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-krishi-text mb-1">
              {t("state")}
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2.5 border border-krishi-border rounded-button text-sm focus:ring-2 focus:ring-krishi-green focus:outline-none"
              required
            />
          </div>

          {/* Location button & preview */}
          <div className="p-3 bg-slate-50 rounded-xl border border-krishi-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-krishi-text flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-krishi-green" />
                GPS Coordinates
              </span>
              <button
                type="button"
                onClick={handleUseLocation}
                disabled={locating}
                className="text-xs font-bold text-krishi-green flex items-center gap-1 hover:underline disabled:opacity-50"
              >
                <Navigation className={`w-3.5 h-3.5 ${locating ? "animate-spin" : ""}`} />
                {locating ? "Locating..." : t("use_my_location")}
              </button>
            </div>
            <div className="text-[11px] font-mono text-krishi-grey">
              Lat: {latitude.toFixed(4)}, Lon: {longitude.toFixed(4)}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
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
      </Card>
    </div>
  );
}
