"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Camera, CloudSun, IndianRupee, Mic } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  // Hidden on landing and auth screens
  const hiddenRoutes = ["/", "/login", "/signup"];
  if (hiddenRoutes.includes(pathname)) {
    return null;
  }

  const navItems = [
    { label: t("nav_home"), path: "/dashboard", icon: Home },
    { label: t("nav_scan"), path: "/scan", icon: Camera },
    { label: t("nav_weather"), path: "/weather", icon: CloudSun },
    { label: t("nav_tracker"), path: "/tracker", icon: IndianRupee },
    { label: t("nav_voice"), path: "/voice", icon: Mic },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-krishi-border max-w-[480px] mx-auto shadow-lg pb-safe">
      <div className="flex items-center justify-around h-[60px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[48px] transition-all relative ${
                isActive
                  ? "text-krishi-green font-bold"
                  : "text-krishi-grey hover:text-krishi-text"
              }`}
            >
              <div
                className={`p-1 rounded-full transition-colors ${
                  isActive ? "bg-krishi-light" : ""
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.4]" : "stroke-[1.8]"}`} />
              </div>
              <span className="text-[11px] font-medium tracking-tight mt-0.5">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-[3px] bg-krishi-green rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
