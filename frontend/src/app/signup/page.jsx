"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { User, Phone, Lock, Globe, Sprout, ArrowRight, LogIn, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ErrorBox from "../../components/ErrorBox";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import { hapticLight } from "../../lib/haptics";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const { signup } = useAuth();
  const { t, language, changeLanguage } = useLanguage();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [prefLang, setPrefLang] = useState(language || "hi");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [alreadyRegisteredPhone, setAlreadyRegisteredPhone] = useState(null);

  // Helper to format/strip +91, 0, dashes, spaces
  const formatPhone = (val) => {
    let cleaned = val.trim().replace(/\s+/g, "").replace(/-/g, "");
    if (cleaned.startsWith("+91")) cleaned = cleaned.slice(3);
    else if (cleaned.startsWith("91") && cleaned.length === 12) cleaned = cleaned.slice(2);
    else if (cleaned.startsWith("0") && cleaned.length === 11) cleaned = cleaned.slice(1);
    return cleaned.replace(/\D/g, "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission

    setError(null);
    setAlreadyRegisteredPhone(null);

    const cleanName = name.trim();
    const cleanPhone = formatPhone(phone);

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!/^[6-9]/.test(cleanPhone)) {
      setError("Indian mobile numbers must start with 6, 7, 8, or 9.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await signup({
        name: cleanName,
        phone: cleanPhone,
        password: password,
        preferred_language: prefLang,
      });

      // Synchronize language context
      changeLanguage(prefLang);

      // Perform a direct navigation to ensure auth token state is freshly loaded
      window.location.href = redirectPath;
    } catch (err) {
      console.error("Signup failed:", err);
      const errMsg = err.message || "Failed to create account. Please try again.";

      if (
        err.code === "PHONE_ALREADY_REGISTERED" ||
        errMsg.toLowerCase().includes("already registered")
      ) {
        setAlreadyRegisteredPhone(cleanPhone);
        setError("This mobile number is already registered in Krishi Drishti.");
      } else {
        setError(errMsg);
      }
      setLoading(false);
    }
  };

  return (
    <div className="my-auto py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-krishi-text">
          {t("signup_button")}
        </h1>
        <p className="text-xs text-krishi-grey mt-1">
          Join Krishi Drishti to monitor crop health and weather
        </p>
      </div>

      <Card className="shadow-md border-krishi-border">
        {error && (
          <div className="mb-4">
            <ErrorBox error={error} onDismiss={() => setError(null)} />
          </div>
        )}

        {/* If user is already registered, give them a one-click button to Log In */}
        {alreadyRegisteredPhone && (
          <div className="mb-4 p-3 bg-emerald-50 border border-krishi-green/40 rounded-card text-center space-y-2">
            <p className="text-xs font-bold text-krishi-text">
              Already have an account with {alreadyRegisteredPhone}?
            </p>
            <Button
              size="sm"
              icon={LogIn}
              onClick={() => {
                window.location.href = `/login?phone=${encodeURIComponent(
                  alreadyRegisteredPhone
                )}&redirect=${encodeURIComponent(redirectPath)}`;
              }}
              className="w-full !h-10 text-xs"
            >
              Log In With This Mobile Number
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-krishi-text mb-1">
              {t("name")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-krishi-grey">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full pl-10 pr-3 py-3 border border-krishi-border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-krishi-green focus:border-transparent font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-krishi-text mb-1">
              {t("phone")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-krishi-grey">
                <Phone className="w-5 h-5" />
              </span>
              <input
                type="tel"
                maxLength={14}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setAlreadyRegisteredPhone(null);
                }}
                placeholder="10-digit mobile number (e.g. 9876543210)"
                className="w-full pl-10 pr-3 py-3 border border-krishi-border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-krishi-green focus:border-transparent font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-krishi-text mb-1">
              {t("password")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-krishi-grey">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full pl-10 pr-3 py-3 border border-krishi-border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-krishi-green focus:border-transparent font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-krishi-text mb-1">
              {t("language_pref")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-krishi-grey">
                <Globe className="w-5 h-5" />
              </span>
              <select
                value={prefLang}
                onChange={(e) => {
                  setPrefLang(e.target.value);
                  changeLanguage(e.target.value);
                }}
                className="w-full pl-10 pr-3 py-3 border border-krishi-border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-krishi-green bg-white font-medium"
              >
                <option value="hi">हिंदी (Hindi)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              loading={loading}
              icon={ArrowRight}
              className="w-full"
            >
              {t("signup_button")}
            </Button>
          </div>
        </form>
      </Card>

      <div className="text-center mt-6">
        <Link
          href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
          className="text-xs font-semibold text-krishi-green hover:underline"
        >
          {t("have_account")}
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="p-4 sm:p-6 min-h-screen flex flex-col justify-between bg-gradient-to-b from-krishi-light/30 via-white to-white">
      {/* Top Bar with Back Button to Landing Page */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              hapticLight();
              router.push("/");
            }}
            aria-label="Back to landing page"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 bg-white/90 hover:bg-slate-100 border border-slate-200/80 active:scale-90 transition-all duration-150 ease-spring shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
          </button>
          <button
            type="button"
            onClick={() => {
              hapticLight();
              router.push("/");
            }}
            className="flex items-center gap-2 text-krishi-green font-bold hover:opacity-85 transition-opacity cursor-pointer"
          >
            <Sprout className="w-6 h-6" />
            <span className="text-base font-extrabold text-slate-900">{t("app_name")}</span>
          </button>
        </div>
        <LanguageSwitcher />
      </div>

      <Suspense fallback={<div className="p-8 text-center text-xs text-krishi-grey">Loading signup form...</div>}>
        <SignupForm />
      </Suspense>

      {/* Footer Info */}
      <div className="text-center pb-4 text-[11px] text-krishi-grey">
        Krishi Drishti • Final Year AI Agritech Project
      </div>
    </div>
  );
}
