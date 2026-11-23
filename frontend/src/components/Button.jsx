import React from "react";
import { hapticLight } from "../lib/haptics";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary", // "primary" | "outline" | "danger" | "ghost"
  size = "md", // "sm" (40px) | "md" (52px) | "lg" (56px)
  disabled = false,
  loading = false,
  icon: Icon,
  className = "",
  ...props
}) {
  const heightClasses = {
    sm: "h-10 text-xs px-3.5 rounded-xl",
    md: "h-[52px] text-[15px] px-5 rounded-btn",
    lg: "h-14 text-base px-6 rounded-btn",
  }[size] || "h-[52px] text-[15px] px-5 rounded-btn";

  const baseClasses =
    `w-full ${heightClasses} font-semibold flex items-center justify-center gap-2.5 transition-all duration-200 ease-spring active:scale-[0.96] active:duration-75 disabled:opacity-50 disabled:pointer-events-none select-none min-h-touch tracking-tight shadow-sm`;

  const variantClasses = {
    primary:
      "bg-krishi-green text-white hover:bg-krishi-dark active:bg-krishi-dark shadow-[0_2px_8px_rgba(46,125,50,0.25)] border-t border-white/25",
    outline:
      "bg-white/90 backdrop-blur text-krishi-green border border-krishi-green/40 hover:bg-krishi-light/60 active:bg-krishi-light shadow-apple-card",
    danger:
      "bg-krishi-red text-white hover:bg-red-800 active:bg-red-900 shadow-[0_2px_8px_rgba(198,40,40,0.25)] border-t border-white/20",
    ghost:
      "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:bg-slate-200/80 shadow-none",
  };

  const handlePointerDown = (e) => {
    if (!disabled && !loading) {
      hapticLight();
    }
    if (props.onPointerDown) {
      props.onPointerDown(e);
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      onPointerDown={handlePointerDown}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5 flex-shrink-0 transition-transform" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
