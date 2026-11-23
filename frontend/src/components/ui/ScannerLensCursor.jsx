"use client";

import React, { useEffect, useState, useRef } from "react";

/**
 * ScannerLensCursor:
 * - Bespoke studio cursor that follows the mouse with smooth spring inertia.
 * - Expands over buttons, links, and cards.
 * - Over 3D leaf / interactive targets, displays an edge pathology reticle.
 * - Strictly hidden on touch devices and when prefers-reduced-motion is active.
 */
export default function ScannerLensCursor() {
  const cursorRef = useRef(null);
  const dotRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isLeaf, setIsLeaf] = useState(false);

  useEffect(() => {
    // 1. Disable on touch devices or reduced motion
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isTouch || prefersReducedMotion) return;

    setVisible(true);

    let mouseX = -100;
    let mouseY = -100;
    let cursorX = -100;
    let cursorY = -100;
    let rafId = null;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Check if hovering interactive target
      const target = e.target;
      if (!target) return;

      const isInteractive = target.closest(
        "button, a, input, select, textarea, [role='button'], .interactive-hover"
      );
      setHovered(!!isInteractive);

      // Check if cursor is over the 3D canvas / leaf area
      const isOverLeaf = target.closest("canvas, #hero, #scanner");
      setIsLeaf(!!isOverLeaf && !isInteractive);
    };

    const onMouseLeave = () => {
      setVisible(false);
    };

    const onMouseEnter = () => {
      setVisible(true);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // Spring interpolation loop (60fps)
    const animate = () => {
      // Ease factor 0.18 gives a satisfying snappy precision feel
      cursorX += (mouseX - cursorX) * 0.18;
      cursorY += (mouseY - cursorY) * 0.18;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Outer Spring Lens Ring */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className={`fixed top-0 left-0 pointer-events-none z-50 rounded-full transition-all duration-200 ease-out border ${
          hovered
            ? "w-14 h-14 border-emerald-500/80 bg-emerald-500/10 shadow-[0_0_15px_rgba(126,224,176,0.35)]"
            : isLeaf
            ? "w-12 h-12 border-[#7EE0B0] bg-[#7EE0B0]/15 shadow-[0_0_20px_rgba(126,224,176,0.5)]"
            : "w-8 h-8 border-slate-700/60 bg-transparent"
        }`}
        style={{ willChange: "transform" }}
      >
        {/* Reticle tick marks when hovering 3D leaf or scanner */}
        {isLeaf && (
          <>
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-[#7EE0B0]" />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-[#7EE0B0]" />
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-[#7EE0B0]" />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-[#7EE0B0]" />
          </>
        )}
      </div>

      {/* Center Precise Aim Point */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className={`fixed top-0 left-0 pointer-events-none z-50 rounded-full transition-transform duration-75 ${
          hovered
            ? "w-1.5 h-1.5 bg-emerald-500"
            : isLeaf
            ? "w-2 h-2 bg-[#7EE0B0] shadow-xs"
            : "w-1.5 h-1.5 bg-slate-800"
        }`}
        style={{ willChange: "transform" }}
      />
    </>
  );
}
