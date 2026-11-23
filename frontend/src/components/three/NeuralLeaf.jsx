"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Procedural Organic Leaf Geometry with:
 * - Subdivided parametric curvature (pointed tip, rounded base, longitudinal arch, V-curl)
 * - Exact smooth normals
 * - Branching vein coordinates attribute
 */
function createParametricLeafGeometry() {
  const lengthSegments = 64;
  const widthSegments = 32;

  const positions = [];
  const normals = [];
  const uvs = [];
  const veinCoords = [];
  const indices = [];

  for (let i = 0; i <= lengthSegments; i++) {
    const u = i / lengthSegments; // 0 (base) to 1 (tip)

    // Leaf profile width: organic teardrop with pointed apex
    let widthFactor;
    if (u < 0.08) {
      // Petiole / Stem base
      widthFactor = 0.06 + (u / 0.08) * 0.18;
    } else {
      const bodyU = (u - 0.08) / 0.92;
      widthFactor =
        Math.sin(bodyU * Math.PI) *
        (0.68 + 0.32 * Math.sin(bodyU * 1.8)) *
        (1.0 - 0.3 * bodyU);
    }

    // Natural longitudinal leaf spine curl
    const spineY = u * 2.2;
    const spineZ = Math.sin(u * Math.PI) * 0.22 - Math.pow(u, 1.8) * 0.15;
    const spineX = Math.sin(u * Math.PI * 0.8) * 0.06; // slight graceful S-curve

    for (let j = 0; j <= widthSegments; j++) {
      const v = (j / widthSegments) * 2 - 1; // -1 to +1

      // Lateral V-cup and margin droop
      const lateralCup = -Math.pow(Math.abs(v), 1.7) * (0.28 * Math.sin(u * Math.PI));
      const marginWave = Math.sin(u * 14.0 + v * 4.0) * Math.pow(Math.abs(v), 2.5) * 0.02;

      const x = spineX + v * widthFactor * 0.9;
      const y = spineY;
      const z = spineZ + lateralCup + marginWave;

      positions.push(x, y, z);
      uvs.push(u, (v + 1) / 2);
      veinCoords.push(u, v);
    }
  }

  // Generate face indices
  for (let i = 0; i < lengthSegments; i++) {
    for (let j = 0; j < widthSegments; j++) {
      const a = i * (widthSegments + 1) + j;
      const b = (i + 1) * (widthSegments + 1) + j;
      const c = (i + 1) * (widthSegments + 1) + (j + 1);
      const d = i * (widthSegments + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute(
    "aVeinCoord",
    new THREE.Float32BufferAttribute(veinCoords, 2)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Neural Leaf Shader Material
 * - Deep green body (#214F3F to #2F6B3A)
 * - Emissive mint (#7EE0B0) branching neural veins with propagating light pulses
 * - Periodic sweeping scan beam revealing amber (#B45309) disease hotspots
 * - Soft Fresnel rim lighting and subsurface chlorophyll translucency
 */
const NeuralLeafShader = {
  uniforms: {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uBaseColor: { value: new THREE.Color("#214F3F") },
    uSurfaceColor: { value: new THREE.Color("#2F6B3A") },
    uVeinColor: { value: new THREE.Color("#7EE0B0") },
    uHotspotColor: { value: new THREE.Color("#B45309") },
    uRimColor: { value: new THREE.Color("#A7F3D0") },
  },
  vertexShader: `
    attribute vec2 aVeinCoord;
    varying vec2 vVeinCoord;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    uniform float uTime;
    uniform float uScroll;

    void main() {
      vUv = uv;
      vVeinCoord = aVeinCoord;
      
      vec3 transformed = position;
      float u = aVeinCoord.x;
      float v = aVeinCoord.y;

      // 1. Organic Breathing & Edge Flutter
      float breathing = sin(uTime * 1.5 + u * 2.0) * 0.015;
      float edgeFlutter = sin(uTime * 3.8 + u * 8.0) * pow(abs(v), 2.0) * 0.025;
      transformed += normal * (breathing + edgeFlutter);

      vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
      vWorldPosition = worldPosition.xyz;

      vec4 mvPosition = viewMatrix * worldPosition;
      vViewPosition = -mvPosition.xyz;
      vNormal = normalize(normalMatrix * normal);

      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec2 vVeinCoord;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;

    uniform float uTime;
    uniform float uScroll;
    uniform vec3 uBaseColor;
    uniform vec3 uSurfaceColor;
    uniform vec3 uVeinColor;
    uniform vec3 uHotspotColor;
    uniform vec3 uRimColor;

    void main() {
      float u = vVeinCoord.x;
      float v = vVeinCoord.y;

      vec3 N = normalize(vNormal);
      vec3 V = normalize(vViewPosition);

      // 1. Base Chlorophyll Body (Deep Forest to Vibrant Field Green)
      float bodyGradient = smoothstep(0.05, 0.95, u);
      vec3 baseGreen = mix(uBaseColor, uSurfaceColor, bodyGradient * 0.85);

      // 2. Vein Architecture (Central Midrib + 45° Branching Lateral Veins)
      float midrib = 1.0 - smoothstep(0.005, 0.038, abs(v));

      // 45-degree branching side veins
      float branchAngle = u - 0.45 * abs(v);
      float branchPattern = abs(fract(branchAngle * 10.0) - 0.5);
      float sideVeins = (1.0 - smoothstep(0.005, 0.032, branchPattern)) 
                        * smoothstep(0.98, 0.12, abs(v))
                        * smoothstep(0.05, 0.25, u);

      float totalVeins = max(midrib, sideVeins);

      // 3. Neural Signal Light Pulses (Propagating Waves)
      float midribPulse = sin(u * 22.0 - uTime * 4.2);
      float branchPulse = sin(branchAngle * 18.0 - uTime * 4.8);
      float neuralSignal = clamp(max(midribPulse, branchPulse) * 0.5 + 0.5, 0.0, 1.0);
      neuralSignal = pow(neuralSignal, 7.0);

      // 4. Sweeping Diagnostic Scan Beam (Every 4.5 seconds)
      float beamCycle = mod(uTime, 4.5);
      float beamPos = (beamCycle / 2.8) * 1.3 - 0.15; // Sweeps base to tip in 2.8s
      float beamDist = abs(u - beamPos);
      float scanBeam = exp(-pow(beamDist / 0.065, 2.0)) * 1.6;

      // 5. Revealed Amber Disease Hotspots (Fade out after scan beam passes)
      // Spot A: Right lobe (u = 0.44, v = 0.35)
      float spotDistA = distance(vec2(u, v), vec2(0.44, 0.35));
      float spotActiveA = step(0.44, beamPos) * clamp(1.0 - (beamPos - 0.44) * 2.0, 0.0, 1.0);
      float spotA = smoothstep(0.13, 0.02, spotDistA) * spotActiveA;

      // Spot B: Left apex lobe (u = 0.72, v = -0.28)
      float spotDistB = distance(vec2(u, v), vec2(0.72, -0.28));
      float spotActiveB = step(0.72, beamPos) * clamp(1.0 - (beamPos - 0.72) * 2.2, 0.0, 1.0);
      float spotB = smoothstep(0.11, 0.02, spotDistB) * spotActiveB;

      float totalHotspot = max(spotA, spotB);

      // 6. Fresnel Rim Lighting & Subsurface Scatter
      float fresnel = pow(1.0 - max(0.0, dot(N, V)), 2.6);
      vec3 rimLight = uRimColor * fresnel * 0.75;

      // 7. Composite Color Assembly
      vec3 color = baseGreen;

      // Add vein network with resting mint luminescence + neural pulse surges
      vec3 veinEmission = uVeinColor * (0.35 + neuralSignal * 1.2);
      color = mix(color, veinEmission, totalVeins * 0.85);

      // Add scan beam illumination (soft mint laser wave)
      color += uVeinColor * scanBeam * 0.65;

      // Add disease hotspots in signature amber (#B45309)
      color = mix(color, uHotspotColor * 1.4, totalHotspot * 0.9);

      // Add rim light
      color += rimLight;

      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export default function NeuralLeaf({
  position = [1.75, 0.8, 0.2],
  scale = [1.1, 1.1, 1.1],
  scrollProgress = 0,
  isMobile = false,
}) {
  const meshRef = useRef();
  const materialRef = useRef();
  const groupRef = useRef();

  // Create geometry once with explicit memoization
  const geometry = useMemo(() => createParametricLeafGeometry(), []);

  // Create custom shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(NeuralLeafShader.uniforms),
      vertexShader: NeuralLeafShader.vertexShader,
      fragmentShader: NeuralLeafShader.fragmentShader,
      side: THREE.DoubleSide,
    });
  }, []);

  // Cleanup on unmount (requirement: dispose geometries/materials)
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Pointer parallax tracking with inertia
  const targetRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (typeof window === "undefined") return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      targetRotation.current = {
        x: ny * 0.18,
        y: nx * 0.28,
      };
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    if (material.uniforms) {
      material.uniforms.uTime.value = time;
      material.uniforms.uScroll.value = scrollProgress;
    }

    if (groupRef.current) {
      // 1. Idle float & breathing
      const idleY = Math.sin(time * 1.4) * 0.05;
      const idleTilt = Math.sin(time * 1.1) * 0.03;

      // Smoothly shift the leaf out to the right when entering Voice Engine (scrollProgress > 0.24)
      const exitProgress = Math.max(0, Math.min(1, (scrollProgress - 0.24) / 0.08));
      const exitShiftX = exitProgress * 4.2;
      const exitScale = Math.max(0.001, 1 - exitProgress);

      // Responsive positioning
      if (isMobile) {
        // Position above the headline on mobile so text is completely unobstructed
        groupRef.current.position.set(0, 2.18 + idleY + exitProgress * 3.0, 0.2);
        groupRef.current.scale.set(0.56 * exitScale, 0.56 * exitScale, 0.56 * exitScale);
      } else {
        // Desktop: lower-right of the hero headline, gliding right when exiting to Voice Engine
        groupRef.current.position.set(position[0] + exitShiftX, position[1] + idleY, position[2]);
        groupRef.current.scale.set(scale[0] * exitScale, scale[1] * exitScale, scale[2] * exitScale);
      }

      // 2. Parallax rotation with spring inertia
      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        0.15 + idleTilt + targetRotation.current.x,
        4,
        delta
      );
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        -0.35 + time * 0.12 + targetRotation.current.y + scrollProgress * Math.PI * 1.6,
        4,
        delta
      );
      groupRef.current.rotation.z = THREE.MathUtils.damp(
        groupRef.current.rotation.z,
        -0.12 + Math.cos(time * 0.9) * 0.04,
        4,
        delta
      );
    }
  });

  return (
    <group ref={groupRef} scale={isMobile ? [0.75, 0.75, 0.75] : scale}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        castShadow={false}
      />

      {/* 3D Diagnostic Pathology Reticle & Bounding Box for Leaf Scanner Chapter */}
      {scrollProgress >= 0.10 && scrollProgress <= 0.26 && (
        <group position={[0.32, 0.82, 0.08]}>
          {/* Diagnostic Bounding Box */}
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(0.36, 0.36, 0.08)]} />
            <lineBasicMaterial color="#B45309" transparent opacity={0.85} />
          </lineSegments>
          {/* Pulsing Target Ring */}
          <mesh rotation={[0, 0, 0]}>
            <ringGeometry args={[0.20, 0.22, 28]} />
            <meshBasicMaterial color="#7EE0B0" transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}
