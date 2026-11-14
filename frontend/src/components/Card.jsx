import React from "react";

export default function Card({ children, className = "", onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white text-krishi-text rounded-card border border-krishi-border p-4 shadow-sm transition-all ${
        onClick
          ? "cursor-pointer active:scale-[0.99] hover:border-krishi-green/50 hover:shadow"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
