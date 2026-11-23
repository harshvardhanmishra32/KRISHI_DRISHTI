"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 3D Layered Soil Strata & pH Gauge for Chapter 5: Soil NPK & Yield Prediction
 * - Cross-section of agricultural soil with glowing N, P, K nutrient layers
 * - Floating 3D orbital pH gauge ring (pH 6.8 Optimal Neutral)
 * - Active between scrollProgress 0.54 and 0.74
 */
export default function SoilStrata({ scrollProgress = 0, isMobile = false }) {
  const groupRef = useRef();
  const dialRef = useRef();
  const nLayerRef = useRef();
  const pLayerRef = useRef();
  const kLayerRef = useRef();

  // Shared geometry for strata slabs
  const slabGeometry = useMemo(() => new THREE.BoxGeometry(2.4, 0.22, 1.4), []);

  // Strata Materials
  const topsoilMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#452B1F", // Dark humus organic loam
        roughness: 0.9,
        transparent: true,
        opacity: 0,
      }),
    []
  );

  const nMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#059669", // Emerald Nitrogen (N)
        emissive: "#10B981",
        emissiveIntensity: 0.35,
        roughness: 0.4,
        transparent: true,
        opacity: 0,
      }),
    []
  );

  const pMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#D97706", // Amber Phosphorus (P)
        emissive: "#F59E0B",
        emissiveIntensity: 0.35,
        roughness: 0.4,
        transparent: true,
        opacity: 0,
      }),
    []
  );

  const kMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#C2410C", // Terracotta Potassium (K)
        emissive: "#EA580C",
        emissiveIntensity: 0.35,
        roughness: 0.4,
        transparent: true,
        opacity: 0,
      }),
    []
  );

  const phRingGeo = useMemo(() => new THREE.TorusGeometry(0.48, 0.02, 16, 64), []);
  const phRingMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#7EE0B0",
        transparent: true,
        opacity: 0,
      }),
    []
  );

  useEffect(() => {
    return () => {
      slabGeometry.dispose();
      phRingGeo.dispose();
      topsoilMat.dispose();
      nMat.dispose();
      pMat.dispose();
      kMat.dispose();
      phRingMat.dispose();
    };
  }, [slabGeometry, phRingGeo, topsoilMat, nMat, pMat, kMat, phRingMat]);

  useFrame((state, delta) => {
    // Visibility envelope for Chapter 5: Soil NPK (0.54 to 0.74)
    const inRange = scrollProgress >= 0.54 && scrollProgress <= 0.74;
    let targetOpacity = 0;

    if (inRange) {
      if (scrollProgress < 0.58) {
        targetOpacity = (scrollProgress - 0.54) / 0.04;
      } else if (scrollProgress > 0.69) {
        targetOpacity = 1 - (scrollProgress - 0.69) / 0.05;
      } else {
        targetOpacity = 0.95;
      }
    }

    const currentOp = THREE.MathUtils.lerp(topsoilMat.opacity, targetOpacity, delta * 5);
    topsoilMat.opacity = currentOp;
    nMat.opacity = currentOp;
    pMat.opacity = currentOp;
    kMat.opacity = currentOp;
    phRingMat.opacity = currentOp * 0.85;

    // Pulse nutrient emission gently
    const time = state.clock.elapsedTime;
    nMat.emissiveIntensity = 0.25 + Math.sin(time * 2.0) * 0.15;
    pMat.emissiveIntensity = 0.25 + Math.sin(time * 2.0 + 1.2) * 0.15;
    kMat.emissiveIntensity = 0.25 + Math.sin(time * 2.0 + 2.4) * 0.15;

    // Slow orbital tilt of the pH ring
    if (dialRef.current) {
      dialRef.current.rotation.z += delta * 0.35;
      dialRef.current.rotation.x = Math.sin(time * 0.8) * 0.2;
    }

    if (groupRef.current) {
      // Slow float
      groupRef.current.position.y = 0.65 + Math.sin(time * 1.2) * 0.04;
      groupRef.current.rotation.y = -0.35 + (scrollProgress - 0.54) * 0.8;
    }
  });

  return (
    <group
      ref={groupRef}
      position={isMobile ? [0, 0.65, 0.8] : [-1.1, 0.65, 0.6]}
      scale={isMobile ? [0.65, 0.65, 0.65] : [1, 1, 1]}
    >
      {/* Layer 1: Topsoil / Humus Loam */}
      <mesh geometry={slabGeometry} material={topsoilMat} position={[0, 0.36, 0]} />

      {/* Layer 2: Nitrogen (N) Active Root Zone */}
      <mesh ref={nLayerRef} geometry={slabGeometry} material={nMat} position={[0, 0.12, 0]} />

      {/* Layer 3: Phosphorus (P) Subsurface Mineral Band */}
      <mesh ref={pLayerRef} geometry={slabGeometry} material={pMat} position={[0, -0.12, 0]} />

      {/* Layer 4: Potassium (K) Deep Clay Reservoir */}
      <mesh ref={kLayerRef} geometry={slabGeometry} material={kMat} position={[0, -0.36, 0]} />

      {/* Floating 3D pH Ring & Agronomic Dial */}
      <group ref={dialRef} position={[0, 0.72, 0.2]}>
        <mesh geometry={phRingGeo} material={phRingMat} />
        {/* Central pH Indicator Core */}
        <mesh>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#34D399" transparent opacity={phRingMat.opacity} />
        </mesh>
      </group>
    </group>
  );
}
