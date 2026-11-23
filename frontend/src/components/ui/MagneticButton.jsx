"use client";

import React, { useRef, useState, useEffect } from "react";

/**
 * MagneticButton:
 * Applies a gentle, elegant magnetic pull effect to primary CTA buttons.
 * Only triggers on non-touch pointer devices and respects prefers-reduced-motion.
 */
export default function MagneticButton({
  children,
  className = "",
  strength = 0.28,
  onClick,
  ...props
}) {
  const buttonRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isTouchRef = useRef(false);

  useEffect(() => {
    isTouchRef.current =
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const handleMouseMove = (e) => {
    if (isTouchRef.current || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    setOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        transition: offset.x === 0 && offset.y === 0 ? "transform 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.25)" : "transform 0.1s ease-out",
        willChange: "transform",
      }}
      className={`inline-block ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
