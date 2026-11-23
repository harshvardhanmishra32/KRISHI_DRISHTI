/**
 * Krishi Drishti - Soundtrack & Audio Telemetry Engine
 * Soundtrack: Hans Zimmer - Interstellar Main Theme (Extra Extended Soundtrack)
 *
 * Features:
 * - HTML5 Audio with Web Audio API gain node for cinematic smooth fade-ins and fade-outs
 * - LocalStorage persistence for user audio preference (default OFF)
 * - Soft synthesized Web Audio chapter-change tick when crossing story chapters
 */

let audioElement: HTMLAudioElement | null = null;
let audioCtx: AudioContext | null = null;
let isAudioRunning = false;
let fadeInterval: NodeJS.Timeout | null = null;

const TRACK_PATH = "/audio/interstellar-main-theme.mp3";
const STORAGE_KEY = "krishi_audio_preference";

export function isSoundtrackPlaying(): boolean {
  return isAudioRunning;
}

export function getSavedAudioPreference(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Plays a subtle, tactile audio tick when the user crosses chapter boundaries
 */
export function playChapterTick(): void {
  if (typeof window === "undefined" || !isAudioRunning) return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    // Gentle frequency ramp from 600Hz down to 320Hz simulating a soft wooden tick
    osc.frequency.setValueAtTime(600, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(320, audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.045, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.045);
  } catch {
    // Fail silently if audio context unavailable
  }
}

export function toggleFieldAudio(onStateChange?: (active: boolean) => void): boolean {
  if (typeof window === "undefined") return false;

  // 1. If currently playing: smoothly fade out and pause
  if (isAudioRunning && audioElement) {
    if (fadeInterval) clearInterval(fadeInterval);

    try {
      localStorage.setItem(STORAGE_KEY, "false");
    } catch {
      // ignore
    }

    const fadeOutSteps = 16;
    const initialVolume = audioElement.volume;
    let step = 0;

    fadeInterval = setInterval(() => {
      step++;
      const factor = 1 - step / fadeOutSteps;
      if (audioElement) {
        audioElement.volume = Math.max(0, initialVolume * factor);
      }
      if (step >= fadeOutSteps) {
        if (fadeInterval) clearInterval(fadeInterval);
        if (audioElement) {
          audioElement.pause();
        }
        isAudioRunning = false;
        onStateChange?.(false);
      }
    }, 45);

    return false;
  }

  // 2. If stopped or first time: initialize and smoothly fade in
  try {
    if (!audioElement) {
      audioElement = new Audio(TRACK_PATH);
      audioElement.loop = true;
      audioElement.preload = "auto";
    }

    if (fadeInterval) clearInterval(fadeInterval);

    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }

    audioElement.volume = 0.001;
    const playPromise = audioElement.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isAudioRunning = true;
          onStateChange?.(true);

          const targetVolume = 0.72;
          const fadeInSteps = 24;
          let step = 0;

          fadeInterval = setInterval(() => {
            step++;
            const factor = step / fadeInSteps;
            if (audioElement && isAudioRunning) {
              audioElement.volume = Math.min(targetVolume, targetVolume * factor);
            }
            if (step >= fadeInSteps) {
              if (fadeInterval) clearInterval(fadeInterval);
            }
          }, 55);
        })
        .catch((err) => {
          console.warn("Audio autoplay blocked by browser policy until interaction:", err);
          isAudioRunning = false;
          onStateChange?.(false);
        });
    }

    return true;
  } catch (err) {
    console.warn("Soundtrack initialization error:", err);
    isAudioRunning = false;
    onStateChange?.(false);
    return false;
  }
}
