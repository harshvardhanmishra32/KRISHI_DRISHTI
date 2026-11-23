"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import NeuralLeaf from "./NeuralLeaf";
import CropField from "./CropField";
import WaveRing from "./WaveRing";
import SprayColumns from "./SprayColumns";
import SoilStrata from "./SoilStrata";
import SpatialOutbreakMap from "./SpatialOutbreakMap";
import MandiDepartureBoard from "./MandiDepartureBoard";

/**
 * Creates a soft radial alpha gradient texture for warm, round pollen sprites
 * eliminating square particle artifacts completely.
 */
function createPollenTexture() {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(245, 158, 11, 0.95)");
  grad.addColorStop(0.3, "rgba(217, 119, 6, 0.55)");
  grad.addColorStop(0.65, "rgba(217, 119, 6, 0.15)");
  grad.addColorStop(1, "rgba(217, 119, 6, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export default function PlaceholderField({ scrollProgress = 0, isMobile = false, lowQuality = false }) {
  const sproutGroupRef = useRef();
  const scanRingRef = useRef();
  const terrainRef = useRef();
  const particlesRef = useRef();
  const compassRingRef = useRef();

  // Flag to keep old leaf available behind NEXT_PUBLIC_OLD_LEAF=true for comparison
  const useOldLeaf = process.env.NEXT_PUBLIC_OLD_LEAF === "true";

  // 1. Procedural Golden-Hour Pollen Vortex (Scaled down on mobile-lite)
  const particleCount = isMobile || lowQuality ? 60 : 240;
  const [positions, initialPhases] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const radius = 1.2 + Math.random() * 8.5;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3 + 0] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = 0.2 + Math.random() * 5.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return [pos, phases];
  }, [particleCount]);

  // Soft round pollen texture
  const pollenTexture = useMemo(() => createPollenTexture(), []);

  // 2. Procedural Terraced Drone LIDAR Topographic Grid
  const terrainGeometry = useMemo(() => {
    const segs = isMobile || lowQuality ? 20 : 48;
    const geo = new THREE.PlaneGeometry(36, 36, segs, segs);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x * x + y * y);
      const elevation =
        Math.sin(x * 0.25) * 0.25 +
        Math.cos(y * 0.22) * 0.2 +
        Math.sin(dist * 0.4) * 0.15;
      pos.setZ(i, elevation);
    }
    geo.computeVertexNormals();
    return geo;
  }, [isMobile, lowQuality]);

  // 3. Fallback Leaf Curve for old leaf mode
  const leafCurve = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.35, 0.6, 0.15, 1.3);
    shape.quadraticCurveTo(0.0, 1.45, 0.0, 1.5);
    shape.quadraticCurveTo(-0.15, 1.1, -0.35, 0.6);
    shape.quadraticCurveTo(-0.15, 0.15, 0, 0);
    return new THREE.ShapeGeometry(shape, 16);
  }, []);

  // Cleanup geometries/textures on unmount
  useEffect(() => {
    return () => {
      terrainGeometry.dispose();
      leafCurve.dispose();
      if (pollenTexture) pollenTexture.dispose();
    };
  }, [terrainGeometry, leafCurve, pollenTexture]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Organic Sprout Levitation for old leaf mode
    if (sproutGroupRef.current) {
      sproutGroupRef.current.position.y =
        1.15 + Math.sin(time * 1.8) * 0.05 + Math.cos(time * 0.9) * 0.03;
      sproutGroupRef.current.rotation.y = time * 0.25 + scrollProgress * Math.PI * 1.5;
    }

    // Biometric Laser Scan Sweep (old leaf mode)
    if (scanRingRef.current) {
      scanRingRef.current.position.y = 0.3 + ((Math.sin(time * 2.2) + 1) / 2) * 1.25;
      scanRingRef.current.rotation.z += delta * 0.8;
    }

    // Slow orbital rotation of geospatial compass ring
    if (compassRingRef.current) {
      compassRingRef.current.rotation.z -= delta * 0.15;
    }

    // Floating Pollen Motes Harmonic Swirl
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        const currentY = posAttr.getY(i);
        const newY = currentY + Math.sin(time + initialPhases[i]) * 0.003;
        posAttr.setY(i, newY > 5.5 ? 0.3 : newY < 0.2 ? 5.2 : newY);
      }
      posAttr.needsUpdate = true;
      particlesRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group>
      {/* 1. Terraced Topographic LIDAR Field (Precision Survey Elevation) */}
      <mesh
        ref={terrainRef}
        geometry={terrainGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.15, 0]}
      >
        <meshStandardMaterial
          color="#F1F5F9"
          roughness={0.85}
          metalness={0.05}
          wireframe={false}
        />
      </mesh>

      {/* Topographic Elevation Contour Lines */}
      <mesh
        geometry={terrainGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.14, 0]}
      >
        <meshBasicMaterial
          color="#86EFAC"
          wireframe
          transparent
          opacity={0.22}
        />
      </mesh>

      {/* Instanced Swaying Crop Field (Vertex-Shader Wind) */}
      <CropField count={isMobile ? 500 : 1200} />

      {/* 2. Primary Hero 3D Object: Neural Leaf OR Legacy Leaf */}
      {useOldLeaf ? (
        <group ref={sproutGroupRef} position={[0.7, 1.15, 0]}>
          <mesh
            geometry={leafCurve}
            rotation={[0.15, 0.2, -0.1]}
            scale={[1.1, 1.1, 1.1]}
          >
            <meshStandardMaterial
              color="#166534"
              emissive="#15803D"
              emissiveIntensity={0.25}
              roughness={0.35}
              metalness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh
            geometry={leafCurve}
            rotation={[-0.1, Math.PI - 0.2, 0.25]}
            scale={[0.85, 0.85, 0.85]}
            position={[0, 0.1, 0]}
          >
            <meshStandardMaterial
              color="#22C55E"
              emissive="#16A34A"
              emissiveIntensity={0.2}
              roughness={0.4}
              metalness={0.08}
              side={THREE.DoubleSide}
            />
          </mesh>
          <group ref={scanRingRef} position={[0, 0.6, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.42, 0.46, 36]} />
              <meshBasicMaterial
                color="#34D399"
                transparent
                opacity={0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </group>
      ) : (
        <NeuralLeaf
          scrollProgress={scrollProgress}
          isMobile={isMobile}
          position={[1.75, 0.75, 0.2]}
        />
      )}

      {/* 3. Voice Engine WaveRing (Acoustic Waveform for Chapter 3) */}
      <WaveRing scrollProgress={scrollProgress} isMobile={isMobile} />

      {/* 4. Safe Spray 48-Hour Hourly Weather Columns (Chapter 4) */}
      <SprayColumns scrollProgress={scrollProgress} isMobile={isMobile} />

      {/* 5. Soil Strata Cross-Section & pH Dial (Chapter 5) */}
      <SoilStrata scrollProgress={scrollProgress} isMobile={isMobile} />

      {/* 6. PostGIS Spatial Outbreak Map & DBSCAN Clusters (Chapter 6) */}
      <SpatialOutbreakMap scrollProgress={scrollProgress} isMobile={isMobile} />

      {/* 7. Mandi Departure Board & Comparative P&L Bars (Chapter 7) */}
      <MandiDepartureBoard scrollProgress={scrollProgress} isMobile={isMobile} />

      {/* 3. Concentric Geospatial Target Discs (LIDAR Survey Coordinates) */}
      <group position={useOldLeaf ? [0.7, 0.05, 0] : [1.75, 0.05, 0.2]}>
        {/* Inner Pulse Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 0.84, 48]} />
          <meshBasicMaterial
            color="#22C55E"
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Outer Compass / Ticks Ring */}
        <group ref={compassRingRef}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.3, 1.34, 64]} />
            <meshBasicMaterial
              color="#7EE0B0"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.8, 1.82, 48]} />
            <meshBasicMaterial
              color="#94A3B8"
              transparent
              opacity={0.18}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      </group>

      {/* 4. Swirling Golden-Hour Round Pollen Motes */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.12}
          color="#F59E0B"
          map={pollenTexture}
          transparent
          opacity={0.65}
          alphaTest={0.01}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* 5. Chapter Waypoint Markers in Deep Space */}
      <group position={[-1.2, 0.1, 3.2]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.54, 32]} />
          <meshBasicMaterial color="#3B82F6" transparent opacity={0.35} />
        </mesh>
      </group>

      <group position={[0, 0.1, 2.5]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.74, 32]} />
          <meshBasicMaterial color="#10B981" transparent opacity={0.35} />
        </mesh>
      </group>
    </group>
  );
}
