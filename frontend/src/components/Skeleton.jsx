import React from "react";

export default function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded-[12px] ${className}`}
      aria-hidden="true"
    />
  );
}
