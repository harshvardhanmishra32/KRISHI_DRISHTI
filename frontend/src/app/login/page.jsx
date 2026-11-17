"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Phone, Lock, Sprout, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ErrorBox from "../../components/ErrorBox";
import LanguageSwitcher from "../../components/LanguageSwitcher";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";
  const initialPhone = searchParams.get("phone") || "";

  const { login, demoLogin, demoOfficerLogin } = useAuth();
  const { t } = useLanguage();

  const [phone, setPhone] = useState(initialPhone);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatPhone = (val) => {
    let cleaned = val.trim().replace(/\s+/g, "").replace(/-/g, "");
    if (cleaned.startsWith("+91")) cleaned = cleaned.slice(3);
    else if (cleaned.startsWith("91") && cleaned.length === 12) cleaned = cleaned.slice(2);
    else if (cleaned.startsWith("0") && cleaned.length === 11) cleaned = cleaned.slice(1);
    return cleaned.replace(/\D/g, "");
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await demoLogin();
      window.location.href = redirectPath;
    } catch (err) {
      console.error("Demo login failed:", err);
      setError(err.message || "Failed to start demo session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoOfficerLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await demoOfficerLogin();
      window.location.href = redirectPath;
    } catch (err) {
      console.error("Officer demo login failed:", err);
      setError(err.message || "Failed to start officer demo session.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = formatPhone(phone);
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      await login(cleanPhone, password);
      window.location.href = redirectPath;
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message || "Invalid phone number or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="my-auto py-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-krishi-text">
          {t("login_button")}
        </h1>
        <p className="text-xs text-krishi-grey mt-1">
          Access your farm weather, disease scans & crop records
        </p>
      </div>

      <Card className="shadow-md border-krishi-border">
        {error && (
          <div className="mb-4">
            <ErrorBox error={error} onDismiss={() => setError(null)} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-krishi-green/40 text-krishi-dark font-bold text-xs rounded-button flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50"
          >
            <Sprout className="w-4 h-4 text-krishi-green" />
            <span>🌾 Farmer Demo</span>
          </button>

          <button
            type="button"
            onClick={handleDemoOfficerLogin}
            disabled={loading}
            className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 font-bold text-xs rounded-button flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 disabled:opacity-50"
          >
            <Lock className="w-4 h-4 text-blue-600" />
            <span>🛡️ Officer Demo</span>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[11px] font-bold text-krishi-grey uppercase tracking-wider">
            or log in with password
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                onChange={(e) => setPhone(e.target.value)}
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
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-3 border border-krishi-border rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-krishi-green focus:border-transparent font-medium"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              loading={loading}
              icon={ArrowRight}
              className="w-full"
            >
              {t("login_button")}
            </Button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-krishi-border/60 text-center">
          <span className="text-[11px] text-krishi-grey block mb-1.5 font-medium">
            Demo Credentials (click to fill):
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPhone("9876543210");
                setPassword("Farmer@123");
              }}
              className="text-[11px] font-mono font-bold px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md border border-emerald-200 transition-colors"
            >
              Farmer (9876543210)
            </button>
            <button
              type="button"
              onClick={() => {
                setPhone("9123456780");
                setPassword("Officer@123");
              }}
              className="text-[11px] font-mono font-bold px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-md border border-blue-200 transition-colors"
            >
              Officer (9123456780)
            </button>
          </div>
        </div>
      </Card>

      <div className="text-center mt-6">
        <Link
          href={`/signup?redirect=${encodeURIComponent(redirectPath)}`}
          className="text-xs font-semibold text-krishi-green hover:underline"
        >
          {t("no_account")}
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const { t } = useLanguage();

  return (
    <div className="p-4 sm:p-6 min-h-screen flex flex-col justify-between bg-gradient-to-b from-krishi-light/30 via-white to-white">
      {/* Top Bar */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2 text-krishi-green font-bold">
          <Sprout className="w-6 h-6" />
          <span className="text-base font-extrabold">{t("app_name")}</span>
        </div>
        <LanguageSwitcher />
      </div>

      <Suspense fallback={<div className="p-8 text-center text-xs text-krishi-grey">Loading login form...</div>}>
        <LoginForm />
      </Suspense>

      {/* Footer Info */}
      <div className="text-center pb-4 text-[11px] text-krishi-grey">
        Krishi Drishti • Final Year AI Agritech Project
      </div>
    </div>
  );
}
