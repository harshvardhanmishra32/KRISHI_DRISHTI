"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 3D Kinetic Mandi Departure Board & P&L Bars (Chapter 7)
 * - Kinetic flipping departure-board commodity tiles
 * - 3D comparative P&L expense bars (Seed, Fertilizer, Diesel, Labor, Net Margin)
 * - Active between scrollProgress 0.82 and 0.97
 */
export default function MandiDepartureBoard({ scrollProgress = 0, isMobile = false }) {
  const groupRef = useRef();
  const tile1Ref = useRef();
  const tile2Ref = useRef();
  const tile3Ref = useRef();

  // Shared geometry for departure board slabs
  const tileGeo = useMemo(() => new THREE.BoxGeometry(0.7, 0.28, 0.04), []);
  const barGeo = useMemo(() => new THREE.BoxGeometry(0.12, 1, 0.12), []);

  // Materials
  const tileMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0F172A", // Dark ink departure tile
        roughness: 0.3,
        metalness: 0.4,
        transparent: true,
        opacity: 0,
      }),
    []
  );

  const profitMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#10B981", // Emerald profit bar
        emissive: "#059669",
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0,
      }),
    []
  );

  const expenseMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#F59E0B", // Amber expense bar
        emissive: "#D97706",
        emissiveIntensity: 0.25,
        transparent: true,
        opacity: 0,
      }),
    []
  );

  useEffect(() => {
    return () => {
      tileGeo.dispose();
      barGeo.dispose();
      tileMat.dispose();
      profitMat.dispose();
      expenseMat.dispose();
    };
  }, [tileGeo, barGeo, tileMat, profitMat, expenseMat]);

  useFrame((state, delta) => {
    // Visibility envelope for Chapter 7: Mandi Ledger (0.82 to 0.97)
    const inRange = scrollProgress >= 0.82 && scrollProgress <= 0.97;
    let targetOpacity = 0;

    if (inRange) {
      if (scrollProgress < 0.85) {
        targetOpacity = (scrollProgress - 0.82) / 0.03;
      } else if (scrollProgress > 0.94) {
        targetOpacity = 1 - (scrollProgress - 0.94) / 0.03;
      } else {
        targetOpacity = 0.95;
      }
    }

    const currentOp = THREE.MathUtils.lerp(tileMat.opacity, targetOpacity, delta * 6);
    tileMat.opacity = currentOp;
    profitMat.opacity = currentOp;
    expenseMat.opacity = currentOp;

    const time = state.clock.elapsedTime;

    // Flip kinetics simulating arrival board updates
    if (tile1Ref.current) {
      tile1Ref.current.rotation.x = Math.sin(time * 2.2) * 0.15;
    }
    if (tile2Ref.current) {
      tile2Ref.current.rotation.x = Math.sin(time * 2.2 + 0.8) * 0.15;
    }
    if (tile3Ref.current) {
      tile3Ref.current.rotation.x = Math.sin(time * 2.2 + 1.6) * 0.15;
    }

    if (groupRef.current) {
      groupRef.current.rotation.y = -0.25 + Math.sin(time * 0.8) * 0.05;
      groupRef.current.position.y = 0.6 + Math.sin(time * 1.3) * 0.03;
    }
  });

  return (
    <group
      ref={groupRef}
      position={isMobile ? [0, 0.65, 0.8] : [-1.15, 0.65, 0.5]}
      scale={isMobile ? [0.65, 0.65, 0.65] : [1, 1, 1]}
    >
      {/* 1. Kinetic Mandi Price Departure Tiles */}
      <group position={[-0.45, 0.45, 0]}>
        <mesh ref={tile1Ref} geometry={tileGeo} material={tileMat} position={[0, 0.35, 0]} />
        <mesh ref={tile2Ref} geometry={tileGeo} material={tileMat} position={[0, 0, 0]} />
        <mesh ref={tile3Ref} geometry={tileGeo} material={tileMat} position={[0, -0.35, 0]} />
      </group>

      {/* 2. 3D P&L Ledger Comparative Input Expense & Net Margin Bars */}
      <group position={[0.55, 0.25, 0]}>
        {/* Seed Expense */}
        <mesh geometry={barGeo} material={expenseMat} scale={[1, 0.45, 1]} position={[-0.3, 0.22, 0]} />
        {/* Fertilizer Expense */}
        <mesh geometry={barGeo} material={expenseMat} scale={[1, 0.75, 1]} position={[-0.15, 0.37, 0]} />
        {/* Diesel/Irrigation */}
        <mesh geometry={barGeo} material={expenseMat} scale={[1, 0.55, 1]} position={[0, 0.27, 0]} />
        {/* Labor */}
        <mesh geometry={barGeo} material={expenseMat} scale={[1, 0.4, 1]} position={[0.15, 0.2, 0]} />
        {/* Net Harvest Profit Margin (Tall Emerald Pillar) */}
        <mesh geometry={barGeo} material={profitMat} scale={[1, 1.25, 1]} position={[0.35, 0.62, 0]} />
      </group>
    </group>
  );
}
