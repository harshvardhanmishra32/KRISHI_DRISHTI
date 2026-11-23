/**
 * Krishi Drishti (कृषि दृष्टि) - Master Scroll Timeline & Keyframe Engine
 * Defines all 8 cinematic storytelling chapters, 3D camera vector trajectories,
 * and normalized progress bounds [0.0, 1.0].
 *
 * Designed for straightforward college viva explanation:
 * As the user scrolls, Lenis normalizes window scroll into a float from 0.0 to 1.0.
 * GSAP ScrollTrigger updates camera coordinates by interpolating between these keyframes.
 */

export interface Chapter {
  id: string;
  number: number;
  titleEn: string;
  titleHi: string;
  start: number; // 0.0 to 1.0
  end: number;   // 0.0 to 1.0
  camera: {
    pos: [number, number, number];
    lookAt: [number, number, number];
  };
}

export const CHAPTERS: Chapter[] = [
  {
    id: "hero",
    number: 1,
    titleEn: "Field Vision",
    titleHi: "खेत और दृष्टि",
    start: 0.0,
    end: 0.14,
    camera: {
      pos: [0, 1.8, 4.5],
      lookAt: [0, 1.2, 0],
    },
  },
  {
    id: "scanner",
    number: 2,
    titleEn: "Leaf Scanner",
    titleHi: "पत्ती रोग स्कैनर",
    start: 0.14,
    end: 0.28,
    camera: {
      pos: [0.9, 1.15, 2.3],
      lookAt: [1.3, 0.9, 0],
    },
  },
  {
    id: "voice",
    number: 3,
    titleEn: "Voice Engine",
    titleHi: "ध्वनि सहायक",
    start: 0.28,
    end: 0.42,
    camera: {
      pos: [-0.65, 1.15, 2.5],
      lookAt: [-0.9, 1.05, 0],
    },
  },
  {
    id: "spray",
    number: 4,
    titleEn: "Safe Spray",
    titleHi: "सुरक्षित छिड़काव",
    start: 0.42,
    end: 0.57,
    camera: {
      pos: [0, 2.5, 4.0],
      lookAt: [0, 0.5, 0],
    },
  },
  {
    id: "soil",
    number: 5,
    titleEn: "Soil & Yield",
    titleHi: "मृदा एवं उपज",
    start: 0.57,
    end: 0.71,
    camera: {
      pos: [1.0, -0.5, 3.5],
      lookAt: [0, -0.5, 0],
    },
  },
  {
    id: "outbreaks",
    number: 6,
    titleEn: "Spatial Outbreaks",
    titleHi: "स्थानिक प्रकोप",
    start: 0.71,
    end: 0.85,
    camera: {
      pos: [0, 4.0, 1.5],
      lookAt: [0, 0, 0],
    },
  },
  {
    id: "mandi",
    number: 7,
    titleEn: "Mandi Ledger",
    titleHi: "मंडी और बहीखाता",
    start: 0.85,
    end: 0.95,
    camera: {
      pos: [-0.8, 0.5, 3.0],
      lookAt: [0, 0.5, 0],
    },
  },
  {
    id: "action",
    number: 8,
    titleEn: "Deploy Platform",
    titleHi: "प्रारंभ करें",
    start: 0.95,
    end: 1.0,
    camera: {
      pos: [0, 1.2, 3.8],
      lookAt: [0, 1.0, 0],
    },
  },
];

/**
 * Returns the active chapter at the given scroll progress (0.0 to 1.0)
 */
export function getActiveChapter(progress: number): Chapter {
  const p = Math.max(0, Math.min(1, progress));
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (p >= CHAPTERS[i].start) {
      return CHAPTERS[i];
    }
  }
  return CHAPTERS[0];
}

/**
 * Linear interpolation helper for vector numbers
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Computes smooth camera position and lookAt vectors based on current scroll progress
 */
export function getInterpolatedCamera(progress: number): {
  pos: [number, number, number];
  lookAt: [number, number, number];
} {
  const p = Math.max(0, Math.min(1, progress));

  // Find the two surrounding chapters to interpolate between
  let startChapter = CHAPTERS[0];
  let endChapter = CHAPTERS[1];

  for (let i = 0; i < CHAPTERS.length - 1; i++) {
    if (p >= CHAPTERS[i].start && p <= CHAPTERS[i + 1].start) {
      startChapter = CHAPTERS[i];
      endChapter = CHAPTERS[i + 1];
      break;
    }
  }

  const span = endChapter.start - startChapter.start || 0.001;
  const localT = Math.max(0, Math.min(1, (p - startChapter.start) / span));

  // Smooth ease-in-out easing
  const smoothT = localT * localT * (3 - 2 * localT);

  return {
    pos: [
      lerp(startChapter.camera.pos[0], endChapter.camera.pos[0], smoothT),
      lerp(startChapter.camera.pos[1], endChapter.camera.pos[1], smoothT),
      lerp(startChapter.camera.pos[2], endChapter.camera.pos[2], smoothT),
    ],
    lookAt: [
      lerp(startChapter.camera.lookAt[0], endChapter.camera.lookAt[0], smoothT),
      lerp(startChapter.camera.lookAt[1], endChapter.camera.lookAt[1], smoothT),
      lerp(startChapter.camera.lookAt[2], endChapter.camera.lookAt[2], smoothT),
    ],
  };
}
