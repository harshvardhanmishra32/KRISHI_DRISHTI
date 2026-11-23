"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Camera, CloudSun, IndianRupee, Mic } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { hapticLight } from "../lib/haptics";

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

  const handleNavigation = (path) => {
    hapticLight();
    router.push(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-bottom-bar max-w-[480px] mx-auto pb-safe transition-all">
      <div className="flex items-center justify-around h-[62px] px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() => handleNavigation(item.path)}
              onPointerDown={hapticLight}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[52px] active:scale-90 transition-all duration-200 ease-spring select-none relative ${
                isActive
                  ? "text-krishi-green font-bold"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200 ease-spring ${
                  isActive
                    ? "bg-krishi-light/90 shadow-sm border border-krishi-green/15"
                    : "hover:bg-slate-100/60"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? "stroke-[2.4] scale-105" : "stroke-[1.8]"
                  }`}
                />
              </div>
              <span
                className={`text-[10.5px] tracking-tight mt-0.5 transition-all ${
                  isActive ? "font-bold text-krishi-green" : "font-medium text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
