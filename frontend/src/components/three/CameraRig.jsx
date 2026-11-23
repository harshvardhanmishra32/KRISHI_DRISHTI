"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getInterpolatedCamera } from "../../lib/scrollTimeline";

const targetVec = new THREE.Vector3();
const lookAtVec = new THREE.Vector3();

export default function CameraRig({ scrollProgress = 0, isMobile = false }) {
  const currentPosRef = useRef(new THREE.Vector3(0, 1.8, 4.5));
  const currentLookAtRef = useRef(new THREE.Vector3(0, 1.2, 0));

  useFrame((state, delta) => {
    // 1. Get destination vectors from centralized scroll timeline keyframes
    const { pos, lookAt } = getInterpolatedCamera(scrollProgress);
    targetVec.set(pos[0], pos[1], pos[2]);
    lookAtVec.set(lookAt[0], lookAt[1], lookAt[2]);

    // 2. Add subtle interactive mouse parallax (disabled on mobile for stability)
    if (!isMobile) {
      targetVec.x += state.pointer.x * 0.2;
      targetVec.y += state.pointer.y * 0.15;
    }

    // 3. Smooth dampening (lerp) toward target for organic physical momentum
    const lerpFactor = Math.min(1, delta * 4.5);
    currentPosRef.current.lerp(targetVec, lerpFactor);
    currentLookAtRef.current.lerp(lookAtVec, lerpFactor);

    state.camera.position.copy(currentPosRef.current);
    state.camera.lookAt(currentLookAtRef.current);
  });

  return null;
}
