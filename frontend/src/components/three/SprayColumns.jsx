"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 48 Hourly 3D Weather Columns for Chapter 4: Safe Spray Window
 * - 48 Instanced Cylinders mapping wind speeds and rain risks across a 48h forecast
 * - Color-coded: Emerald Green (#22C55E) for safe windows (wind < 15 km/h, rain < 20%),
 *   Amber (#F59E0B) for risky spray conditions
 * - Stylized 3D spray nozzle target marker hovering over the optimal spray window
 */
export default function SprayColumns({ scrollProgress = 0, isMobile = false }) {
  const instancedMeshRef = useRef();
  const nozzleGroupRef = useRef();
  const markerRingRef = useRef();

  const count = 48;

  // Generate deterministic synthetic 48-hour micrometeorological forecast profile
  const { columnData, firstSafeIndex } = useMemo(() => {
    const data = [];
    let safeIdx = -1;
    for (let i = 0; i < count; i++) {
      // Wind speed cycles with diurnal variation (3 km/h to 24 km/h)
      const windSpeed = 6 + Math.sin(i * 0.35) * 8 + Math.cos(i * 0.15) * 5;
      const rainProb = (Math.sin(i * 0.45 + 1.2) + 1) * 25; // 0% to 50%
      const isSafe = windSpeed < 15 && rainProb < 20;
      if (isSafe && safeIdx === -1 && i >= 2) {
        safeIdx = i; // First optimal spray window found
      }
      data.push({
        windSpeed,
        rainProb,
        isSafe,
        height: Math.max(0.2, (windSpeed / 24) * 1.4),
      });
    }
    return { columnData: data, firstSafeIndex: safeIdx !== -1 ? safeIdx : 4 };
  }, [count]);

  // Cylinder geometry for each hourly pillar
  const geometry = useMemo(() => new THREE.CylinderGeometry(0.045, 0.045, 1, 16), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        metalness: 0.2,
        roughness: 0.35,
        transparent: true,
        opacity: 0,
      }),
    []
  );

  // Reusable dummy object for instance transformation
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const safeColor = useMemo(() => new THREE.Color("#22C55E"), []);
  const riskyColor = useMemo(() => new THREE.Color("#F59E0B"), []);

  useEffect(() => {
    if (instancedMeshRef.current) {
      for (let i = 0; i < count; i++) {
        instancedMeshRef.current.setColorAt(i, columnData[i].isSafe ? safeColor : riskyColor);
      }
      if (instancedMeshRef.current.instanceColor) {
        instancedMeshRef.current.instanceColor.needsUpdate = true;
      }
    }
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material, columnData, safeColor, riskyColor, count]);

  useFrame((state, delta) => {
    // Visibility envelope for Chapter 4: Safe Spray (active 0.39 to 0.58)
    const inRange = scrollProgress >= 0.39 && scrollProgress <= 0.58;
    let targetOpacity = 0;
    let progressInChapter = 0;

    if (inRange) {
      if (scrollProgress < 0.43) {
        progressInChapter = (scrollProgress - 0.39) / 0.04;
        targetOpacity = progressInChapter;
      } else if (scrollProgress > 0.54) {
        progressInChapter = 1 - (scrollProgress - 0.54) / 0.04;
        targetOpacity = progressInChapter;
      } else {
        progressInChapter = 1;
        targetOpacity = 0.95;
      }
    }

    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, delta * 6);

    if (instancedMeshRef.current && targetOpacity > 0.01) {
      const mesh = instancedMeshRef.current;
      const spacing = isMobile ? 0.075 : 0.095;
      const startX = -((count * spacing) / 2);

      for (let i = 0; i < count; i++) {
        const col = columnData[i];
        const x = startX + i * spacing;
        const currentH = col.height * progressInChapter;
        const y = currentH / 2;
        const z = Math.sin((i / count) * Math.PI) * -0.4; // Subtle curved arc

        dummy.position.set(x, y, z);
        dummy.scale.set(1, Math.max(0.01, currentH), 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Animate spray nozzle indicator over the first safe window
    if (nozzleGroupRef.current && targetOpacity > 0.01) {
      const spacing = isMobile ? 0.075 : 0.095;
      const startX = -((count * spacing) / 2);
      const safeX = startX + firstSafeIndex * spacing;
      const safeH = columnData[firstSafeIndex].height * progressInChapter;

      nozzleGroupRef.current.position.set(safeX, safeH + 0.35 + Math.sin(state.clock.elapsedTime * 3) * 0.04, 0);
      if (markerRingRef.current) {
        markerRingRef.current.rotation.z += delta * 1.5;
      }
    }
  });

  return (
    <group position={isMobile ? [0, 0.4, 1.2] : [-0.8, 0.45, 1.0]}>
      {/* 48 Hourly 3D Instanced Pillars */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[geometry, material, count]}
        castShadow={false}
      />

      {/* Floating 3D Spray Nozzle & Target Beacon */}
      <group ref={nozzleGroupRef}>
        {/* Nozzle Cone Silhouette */}
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.08, 0.18, 16]} />
          <meshStandardMaterial color="#22C55E" emissive="#15803D" emissiveIntensity={0.6} />
        </mesh>
        {/* Pulsing Beacon Ring */}
        <mesh ref={markerRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
          <ringGeometry args={[0.12, 0.15, 24]} />
          <meshBasicMaterial color="#7EE0B0" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
