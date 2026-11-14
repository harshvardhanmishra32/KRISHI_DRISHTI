"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Sprout, Camera, CloudSun, FlaskConical, IndianRupee } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import Button from "../components/Button";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();

  const handleScanClick = () => {
    if (user) {
      router.push("/scan");
    } else {
      router.push("/login?redirect=/scan");
    }
  };

  return (
    <div className="p-6 flex flex-col justify-between min-h-screen text-center bg-gradient-to-b from-krishi-light/40 via-white to-white">
      {/* Top Bar with Language Switcher */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-krishi-light flex items-center justify-center text-krishi-green">
            <Sprout className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold tracking-tight text-krishi-dark">
            Krishi Drishti
          </span>
        </div>
        <LanguageSwitcher />
      </div>

      {/* Hero Section */}
      <div className="my-auto py-8 space-y-6">
        <div className="w-24 h-24 mx-auto bg-krishi-light rounded-full flex items-center justify-center text-krishi-green shadow-sm ring-8 ring-green-50">
          <Sprout className="w-12 h-12" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-krishi-text tracking-tight font-sans">
            {t("app_name")}
          </h1>
          <p className="text-sm text-krishi-grey max-w-[280px] mx-auto leading-relaxed">
            {t("tagline")}
          </p>
        </div>

        {/* Primary Call to Action */}
        <div className="space-y-3 pt-4 max-w-xs mx-auto">
          <Button
            onClick={handleScanClick}
            icon={Camera}
            className="w-full text-base font-bold shadow-md"
          >
            {t("scan_tile")}
          </Button>

          {user ? (
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              {t("nav_home")}
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => router.push("/login")}
            >
              {t("login")} / {t("signup")}
            </Button>
          )}
        </div>

        {/* 3 Quick Preview Tiles */}
        <div className="grid grid-cols-3 gap-3 pt-6">
          <button
            onClick={() => router.push("/weather")}
            className="p-3 bg-white rounded-card border border-krishi-border shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all hover:border-krishi-green/40"
          >
            <div className="p-2 rounded-full bg-blue-50 text-krishi-blue">
              <CloudSun className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-krishi-text">
              {t("weather_tile")}
            </span>
          </button>
          <button
            onClick={() => router.push("/soil")}
            className="p-3 bg-white rounded-card border border-krishi-border shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all hover:border-krishi-green/40"
          >
            <div className="p-2 rounded-full bg-amber-50 text-amber-600">
              <FlaskConical className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-krishi-text">
              {t("soil_tile")}
            </span>
          </button>
          <button
            onClick={() => router.push("/tracker")}
            className="p-3 bg-white rounded-card border border-krishi-border shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-all hover:border-krishi-green/40"
          >
            <div className="p-2 rounded-full bg-emerald-50 text-krishi-green">
              <IndianRupee className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-krishi-text">
              {t("expenses_tile")}
            </span>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pb-4 text-center">
        <span className="text-xs text-krishi-grey">
          कृषि दृष्टि • Made for Indian Farmers
        </span>
      </div>
    </div>
  );
}
