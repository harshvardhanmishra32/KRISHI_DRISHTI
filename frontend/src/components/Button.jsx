import React from "react";

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
    sm: "h-10 text-xs px-3 rounded-lg",
    md: "h-[52px] text-base px-5 rounded-btn",
    lg: "h-14 text-base px-6 rounded-btn",
  }[size] || "h-[52px] text-base px-5 rounded-btn";

  const baseClasses =
    `w-full ${heightClasses} font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none min-h-touch`;

  const variantClasses = {
    primary:
      "bg-krishi-green text-white hover:bg-krishi-dark shadow-sm",
    outline:
      "bg-white text-krishi-green border-2 border-krishi-green hover:bg-krishi-light/50",
    danger:
      "bg-krishi-red text-white hover:bg-red-800 shadow-sm",
    ghost:
      "bg-transparent text-krishi-grey hover:text-krishi-text hover:bg-gray-100",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
