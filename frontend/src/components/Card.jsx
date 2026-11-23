import React from "react";
import { hapticLight } from "../lib/haptics";

export default function Card({ children, className = "", onClick, ...props }) {
  const isInteractive = Boolean(onClick);

  const handlePointerDown = (e) => {
    if (isInteractive) {
      hapticLight();
    }
    if (props.onPointerDown) {
      props.onPointerDown(e);
    }
  };

  return (
    <div
      onClick={onClick}
      onPointerDown={handlePointerDown}
      className={`bg-white text-krishi-text rounded-card border border-slate-200/80 p-4 shadow-apple-card transition-all duration-200 ease-spring ${
        isInteractive
          ? "cursor-pointer active:scale-[0.98] active:duration-75 hover:shadow-apple-hover hover:border-krishi-green/40 select-none"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
