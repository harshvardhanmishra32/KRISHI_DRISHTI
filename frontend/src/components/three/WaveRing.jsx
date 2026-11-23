"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Procedural WaveRing Shader Material
 * Undulating acoustic voice ring with:
 * - Real-time audio waveform deformation (harmonics modulation)
 * - Indigo-to-mint gradient (#3B4FD8 to #7EE0B0)
 * - Organic breathing and radial expansion
 */
const WaveRingShader = {
  uniforms: {
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uColorA: { value: new THREE.Color("#3B4FD8") }, // Indigo voice accent
    uColorB: { value: new THREE.Color("#7EE0B0") }, // Mint tech accent
  },
  vertexShader: `
    varying vec2 vUv;
    varying float vWave;
    uniform float uTime;

    void main() {
      vUv = uv;
      vec3 pos = position;

      // Acoustic waveform displacement: sinusoidal modulation simulating human speech harmonics
      float angle = atan(pos.y, pos.x);
      float wave1 = sin(angle * 7.0 + uTime * 4.5) * 0.08;
      float wave2 = cos(angle * 13.0 - uTime * 6.2) * 0.04;
      float wave3 = sin(angle * 3.0 + uTime * 2.1) * 0.06;

      float displacement = wave1 + wave2 + wave3;
      vWave = displacement;

      pos.x += cos(angle) * displacement;
      pos.y += sin(angle) * displacement;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    varying float vWave;
    uniform float uTime;
    uniform float uOpacity;
    uniform vec3 uColorA;
    uniform vec3 uColorB;

    void main() {
      // Color gradient modulated by acoustic waveform height
      float waveFactor = smoothstep(-0.08, 0.08, vWave);
      vec3 col = mix(uColorA, uColorB, waveFactor);

      // Radial luminescence
      float glow = 0.75 + sin(uTime * 3.0) * 0.25;
      gl_FragColor = vec4(col * glow, uOpacity);
    }
  `,
};

export default function WaveRing({ scrollProgress = 0, isMobile = false }) {
  const groupRef = useRef();
  const materialRef = useRef();

  // Torus geometry with fine radial segments for smooth acoustic waves
  const geometry = useMemo(() => new THREE.TorusGeometry(0.85, 0.035, 16, 128), []);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(WaveRingShader.uniforms),
      vertexShader: WaveRingShader.vertexShader,
      fragmentShader: WaveRingShader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime;

    // Calculate visibility envelope for Chapter 3: Voice Engine (active between 25% and 43% scroll)
    const inRange = scrollProgress >= 0.25 && scrollProgress <= 0.43;
    let targetOpacity = 0;
    if (inRange) {
      if (scrollProgress < 0.28) {
        targetOpacity = (scrollProgress - 0.25) / 0.03;
      } else if (scrollProgress > 0.38) {
        targetOpacity = 1 - (scrollProgress - 0.38) / 0.05;
      } else {
        targetOpacity = 1;
      }
    }

    if (material.uniforms) {
      material.uniforms.uTime.value = time;
      material.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        material.uniforms.uOpacity.value,
        targetOpacity,
        delta * 5
      );
    }

    if (groupRef.current) {
      // Slow orbital rotation
      groupRef.current.rotation.z += delta * 0.25;
      groupRef.current.rotation.x = Math.sin(time * 0.8) * 0.15;
      groupRef.current.rotation.y = Math.cos(time * 0.6) * 0.15;
    }
  });

  return (
    <group
      ref={groupRef}
      position={isMobile ? [0, 1.6, 0.6] : [-0.95, 1.05, 0.4]}
      scale={isMobile ? [0.65, 0.65, 0.65] : [1, 1, 1]}
    >
      <mesh geometry={geometry} material={material} />

      {/* Outer ambient wave ring */}
      <mesh rotation={[0, 0, Math.PI / 4]} scale={[1.25, 1.25, 1.25]}>
        <torusGeometry args={[0.85, 0.015, 12, 96]} />
        <meshBasicMaterial
          color="#3B4FD8"
          transparent
          opacity={scrollProgress >= 0.26 && scrollProgress <= 0.42 ? 0.35 : 0}
        />
      </mesh>
    </group>
  );
}
