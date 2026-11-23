"use client";

import React, { Suspense, useState, useEffect, useRef, Component } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import CameraRig from "./CameraRig";
import PlaceholderField from "./PlaceholderField";

function AdaptiveQualityMonitor({ onDowngrade }) {
  const frameDeltas = useRef([]);
  const hasDowngraded = useRef(false);

  useFrame((_, delta) => {
    if (hasDowngraded.current) return;
    frameDeltas.current.push(delta);

    // Check performance every 90 frames (~1.5 to 2.0 seconds)
    if (frameDeltas.current.length >= 90) {
      const avgDelta =
        frameDeltas.current.reduce((sum, d) => sum + d, 0) / frameDeltas.current.length;
      const currentFps = 1 / avgDelta;

      if (currentFps < 45) {
        hasDowngraded.current = true;
        onDowngrade();
      }
      frameDeltas.current = [];
    }
  });

  return null;
}

class CanvasErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn("WebGL Context initialization failed, falling back to ambient background:", error?.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC] via-[#F0FDF4]/30 to-[#F8FAFC] pointer-events-none" />
      );
    }
    return this.props.children;
  }
}

export default function Scene({ scrollProgress = 0, isMobile = false }) {
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [lowQuality, setLowQuality] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      if (!gl) {
        setWebGLSupported(false);
      }
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  if (!webGLSupported) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#F0FDF4]/30 to-[#F8FAFC]" />
    );
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <CanvasErrorBoundary>
        <Canvas
          camera={{ position: [0, 1.8, 4.5], fov: 45, near: 0.1, far: 50 }}
          dpr={isMobile || lowQuality ? 1 : [1, 1.75]}
          gl={{
            antialias: !lowQuality,
            alpha: true,
            powerPreference: "high-performance",
            preserveDrawingBuffer: false,
          }}
          className="w-full h-full"
        >
          {/* Real-time FPS Quality Governor */}
          <AdaptiveQualityMonitor onDowngrade={() => setLowQuality(true)} />

          {/* Soft morning fog matching page background #F8FAFC */}
          <color attach="background" args={["#F8FAFC"]} />
          <fog attach="fog" args={["#F8FAFC", 6, 25]} />

          {/* Ambient & Golden-Hour Lighting Rig */}
          <ambientLight intensity={0.8} color="#E8F5E9" />
          <hemisphereLight
            skyColor="#E8F5E9"
            groundColor="#F1F5F9"
            intensity={0.6}
          />
          <directionalLight
            position={[6, 10, 4]}
            intensity={1.4}
            color="#FFF8E7"
            castShadow={false}
          />
          <directionalLight
            position={[-6, 4, -4]}
            intensity={0.4}
            color="#7EE0B0"
          />

          <Suspense fallback={null}>
            <CameraRig scrollProgress={scrollProgress} isMobile={isMobile} />
            <PlaceholderField
              scrollProgress={scrollProgress}
              isMobile={isMobile}
              lowQuality={lowQuality}
            />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
