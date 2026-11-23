"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Single Crop Blade Stalk Geometry
 * Low polygon (10 vertices), tapered toward apex.
 */
function createCropBladeGeometry() {
  const geom = new THREE.PlaneGeometry(0.05, 1.15, 1, 4);
  // Shift pivot so base sits at soil level (y = 0)
  geom.translate(0, 0.575, 0);

  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const heightRatio = y / 1.15;
    const currentX = pos.getX(i);
    // Taper width from 100% at base to 15% at tip
    pos.setX(i, currentX * (1.0 - heightRatio * 0.85));
    // Gentle natural curvature
    pos.setZ(i, Math.pow(heightRatio, 2.0) * 0.06);
  }
  geom.computeVertexNormals();
  return geom;
}

export default function CropField({ count = 1200 }) {
  const meshRef = useRef();

  // Low-poly blade geometry
  const geometry = useMemo(() => createCropBladeGeometry(), []);

  // Standard material enhanced with wind vertex deformation via onBeforeCompile
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: "#2F6B3A",
      roughness: 0.85,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };
      
      shader.vertexShader = `
        uniform float uTime;
        varying float vCropHeight;
        ${shader.vertexShader}
      `.replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        vCropHeight = uv.y;
        float heightFactor = pow(uv.y, 1.8);
        #ifdef USE_INSTANCING
          vec3 origin = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #else
          vec3 origin = vec3(0.0);
        #endif
        float wavePhase = uTime * 2.1 + origin.x * 0.32 + origin.z * 0.42;
        float gust = sin(uTime * 0.8 + origin.x * 0.12) * 0.4 + 0.6;
        transformed.x += sin(wavePhase) * gust * heightFactor * 0.22;
        transformed.z += cos(wavePhase * 0.85 + 0.5) * gust * heightFactor * 0.16;
        `
      );

      shader.fragmentShader = `
        varying float vCropHeight;
        ${shader.fragmentShader}
      `.replace(
        "#include <color_fragment>",
        `
        #include <color_fragment>
        // Tonal gradient: Deep forest green at soil to sunlit mint at tips
        vec3 baseGreen = vec3(0.105, 0.263, 0.196); // #1B4332
        vec3 midGreen = vec3(0.184, 0.420, 0.227);  // #2F6B3A
        vec3 tipMint = vec3(0.494, 0.878, 0.690);   // #7EE0B0
        vec3 stalkGrad = mix(baseGreen, midGreen, smoothstep(0.0, 0.6, vCropHeight));
        stalkGrad = mix(stalkGrad, tipMint, smoothstep(0.6, 1.0, vCropHeight) * 0.7);
        diffuseColor.rgb = stalkGrad;
        `
      );

      mat.userData.shader = shader;
    };

    return mat;
  }, []);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  // Distribute instances into agricultural crop furrow rows
  useEffect(() => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;
    const dummy = new THREE.Object3D();

    const rows = 24;
    const perRow = Math.floor(count / rows);

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      const rowZ = (r / (rows - 1) - 0.5) * 16 - 2;

      for (let c = 0; c < perRow; c++) {
        const colX = (c / (perRow - 1) - 0.5) * 22;

        const jitterX = (Math.random() - 0.5) * 0.25;
        const jitterZ = (Math.random() - 0.5) * 0.25;
        const posX = colX + jitterX;
        const posZ = rowZ + jitterZ;

        // Keep generous center clearing open for headline and CTA buttons
        const inCenterHero = Math.abs(posX) < 3.2 && Math.abs(posZ) < 3.2;
        if (inCenterHero) continue;

        // Controlled height so stalks stay grounded in the field
        const scaleY = 0.55 + Math.random() * 0.35;
        const scaleXZ = 0.8 + Math.random() * 0.25;

        dummy.position.set(posX, -0.28, posZ);
        dummy.scale.set(scaleXZ, scaleY, scaleXZ);
        dummy.rotation.y = Math.random() * Math.PI * 2;
        dummy.updateMatrix();

        mesh.setMatrixAt(idx++, dummy.matrix);
      }
    }

    mesh.count = idx;
    mesh.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((state) => {
    if (material.userData?.shader) {
      material.userData.shader.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
