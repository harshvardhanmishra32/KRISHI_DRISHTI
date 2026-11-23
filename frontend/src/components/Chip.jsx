import React from "react";

export default function Chip({
  label,
  children,
  variant = "default", // "default" | "success" | "warning" | "danger" | "info"
  className = "",
  icon: Icon,
}) {
  const variantStyles = {
    default: "border-slate-200 text-slate-700 bg-slate-50/80",
    success: "border-emerald-200 text-emerald-800 bg-emerald-50/90",
    warning: "border-amber-200 text-amber-900 bg-amber-50/90",
    danger: "border-rose-200 text-rose-800 bg-rose-50/90",
    info: "border-sky-200 text-sky-800 bg-sky-50/90",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold border backdrop-blur-sm tracking-tight transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{children || label}</span>
    </span>
  );
}
