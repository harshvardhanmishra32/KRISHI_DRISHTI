"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import en from "../locales/en.json";
import hi from "../locales/hi.json";

const translations = { en, hi };

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState("hi"); // Default Hindi for Indian farmers

  useEffect(() => {
    try {
      const stored = localStorage.getItem("krishi_lang");
      if (stored && (stored === "hi" || stored === "en")) {
        setLanguageState(stored);
      }
    } catch (e) {
      // localStorage unavailable
    }
  }, []);

  const changeLanguage = (lang) => {
    if (lang === "hi" || lang === "en") {
      setLanguageState(lang);
      try {
        localStorage.setItem("krishi_lang", lang);
      } catch (e) {}
    }
  };

  const t = (key) => {
    const dict = translations[language] || translations["hi"];
    if (dict[key]) return dict[key];
    if (translations["en"][key]) return translations["en"][key];
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
