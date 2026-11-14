"use client";

import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageSwitcher({ className = "" }) {
  const { language, changeLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={() => changeLanguage(language === "hi" ? "en" : "hi")}
      aria-label="Switch Language"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-krishi-light text-krishi-dark font-medium text-xs border border-green-200 hover:bg-green-100 active:scale-95 transition-all ${className}`}
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{language === "hi" ? "हिन्दी | EN" : "English | हि"}</span>
    </button>
  );
}
