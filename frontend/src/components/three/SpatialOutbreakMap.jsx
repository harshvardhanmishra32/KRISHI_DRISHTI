"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 3D Stylized Spatial Outbreak Map & DBSCAN Cluster Beacons (Chapter 6)
 * - Topographic relief plane representing Uttar Pradesh farm coordinates
 * - Glowing farm point beacons with DBSCAN cluster centers
 * - Expanding 25km spatial containment query ring (ST_DWithin)
 * - Vector alert lines radiating to neighboring holdings and KVK nodes
 */
export default function SpatialOutbreakMap({ scrollProgress = 0, isMobile = false }) {
  const groupRef = useRef();
  const pulseRingRef = useRef();
  const alertLinesRef = useRef();

  // 1. Generate 36 synthetic farm point locations clustered around 3 epidemic nodes
  const { farmPoints, clusters, alertLineGeo } = useMemo(() => {
    const points = [];
    const clusterCenters = [
      { x: -0.4, z: 0.1, radius: 0.65, count: 16, color: "#EF4444" }, // Azamgarh primary outbreak (Red)
      { x: 0.6, z: -0.3, radius: 0.45, count: 12, color: "#F59E0B" }, // Varanasi alert (Amber)
      { x: 0.1, z: 0.5, radius: 0.35, count: 8, color: "#10B981" },   // Mirzapur contained (Green)
    ];

    const lines = [];

    clusterCenters.forEach((c) => {
      for (let i = 0; i < c.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.pow(Math.random(), 0.7) * c.radius;
        const px = c.x + Math.cos(angle) * dist;
        const pz = c.z + Math.sin(angle) * dist;
        points.push({ x: px, z: pz, color: c.color });

        // Connect outbreak center to nearest 3 neighbors with alert lines
        if (i < 4) {
          lines.push(c.x, 0.05, c.z);
          lines.push(px, 0.05, pz);
        }
      }
    });

    const linePositions = new Float32Array(lines);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    return { farmPoints: points, clusters: clusterCenters, alertLineGeo: lineGeo };
  }, []);

  // Shared geometry
  const beaconGeo = useMemo(() => new THREE.CylinderGeometry(0.02, 0.02, 0.25, 12), []);
  const mapGridGeo = useMemo(() => new THREE.PlaneGeometry(2.8, 2.2, 14, 11), []);

  const mapMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#1E293B",
        wireframe: true,
        transparent: true,
        opacity: 0,
      }),
    []
  );

  const pulseMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#EF4444",
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
      }),
    []
  );

  const lineMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#F59E0B",
        transparent: true,
        opacity: 0,
      }),
    []
  );

  useEffect(() => {
    return () => {
      beaconGeo.dispose();
      mapGridGeo.dispose();
      alertLineGeo.dispose();
      mapMat.dispose();
      pulseMat.dispose();
      lineMat.dispose();
    };
  }, [beaconGeo, mapGridGeo, alertLineGeo, mapMat, pulseMat, lineMat]);

  useFrame((state, delta) => {
    // Visibility envelope for Chapter 6: Spatial Outbreaks (0.68 to 0.86)
    const inRange = scrollProgress >= 0.68 && scrollProgress <= 0.86;
    let targetOpacity = 0;

    if (inRange) {
      if (scrollProgress < 0.72) {
        targetOpacity = (scrollProgress - 0.68) / 0.04;
      } else if (scrollProgress > 0.81) {
        targetOpacity = 1 - (scrollProgress - 0.81) / 0.05;
      } else {
        targetOpacity = 0.95;
      }
    }

    const currentOp = THREE.MathUtils.lerp(mapMat.opacity, targetOpacity, delta * 6);
    mapMat.opacity = currentOp * 0.45;
    lineMat.opacity = currentOp * 0.7;

    // Expanding spatial query radius animation (ST_DWithin pulse)
    if (pulseRingRef.current && targetOpacity > 0.01) {
      const time = state.clock.elapsedTime;
      const cycle = (time * 1.2) % 1.0;
      const scaleVal = 0.2 + cycle * 1.6;
      pulseRingRef.current.scale.set(scaleVal, scaleVal, scaleVal);
      pulseMat.opacity = (1 - cycle) * currentOp * 0.8;
    }

    if (groupRef.current) {
      // Top-down angled tilt for cartographic relief
      groupRef.current.rotation.x = -Math.PI / 3.4;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      groupRef.current.position.y = 0.55 + Math.sin(state.clock.elapsedTime * 1.1) * 0.03;
    }
  });

  return (
    <group
      ref={groupRef}
      position={isMobile ? [0, 0.65, 0.6] : [-1.15, 0.7, 0.4]}
      scale={isMobile ? [0.65, 0.65, 0.65] : [1, 1, 1]}
    >
      {/* 1. Coordinate Grid Relief Map */}
      <mesh geometry={mapGridGeo} material={mapMat} />

      {/* 2. Expanding 25km DBSCAN Outbreak Radius (Azamgarh epicenter) */}
      <mesh
        ref={pulseRingRef}
        position={[-0.4, 0.02, 0.1]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.55, 0.58, 36]} />
        <primitive object={pulseMat} attach="material" />
      </mesh>

      {/* 3. Inter-Farm Alert Propagation Lines */}
      <lineSegments ref={alertLinesRef} geometry={alertLineGeo} material={lineMat} />

      {/* 4. Farm Beacons */}
      {farmPoints.map((pt, idx) => (
        <mesh
          key={idx}
          geometry={beaconGeo}
          position={[pt.x, 0.12, pt.z]}
        >
          <meshBasicMaterial
            color={pt.color}
            transparent
            opacity={mapMat.opacity > 0 ? 0.9 : 0}
          />
        </mesh>
      ))}
    </group>
  );
}
