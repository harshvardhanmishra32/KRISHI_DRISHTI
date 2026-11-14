import React from "react";

export default function Chip({
  label,
  children,
  variant = "default", // "default" | "success" | "warning" | "danger" | "info"
  className = "",
  icon: Icon,
}) {
  const variantStyles = {
    default: "border-krishi-border text-krishi-grey bg-gray-50",
    success: "border-green-300 text-krishi-green bg-krishi-light",
    warning: "border-amber-300 text-amber-800 bg-amber-50",
    danger: "border-red-300 text-krishi-red bg-red-50",
    info: "border-blue-300 text-krishi-blue bg-blue-50",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{children || label}</span>
    </span>
  );
}
