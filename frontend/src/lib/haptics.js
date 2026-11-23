/**
 * Krishi Drishti - Apple Sensory & Haptic Feedback Engine
 * Translates WWDC "Designing Audio-Haptic Experiences" for Web/PWA.
 * Safe no-op on platforms without vibration support.
 */

export function triggerHaptic(pattern = 10) {
  if (typeof window === "undefined" || !("vibrate" in navigator)) {
    return;
  }
  try {
    navigator.vibrate(pattern);
  } catch {
    // Graceful fallback on restricted web contexts
  }
}

/**
 * Subtle tap on button press or navigation tab switch
 */
export function hapticLight() {
  triggerHaptic(10);
}

/**
 * Physical click on selection, dropdown, or switch
 */
export function hapticMedium() {
  triggerHaptic(18);
}

/**
 * Camera shutter snap
 */
export function hapticShutter() {
  triggerHaptic(32);
}

/**
 * Double pulse on successful operation (diagnosis, farm added, sync complete)
 */
export function hapticSuccess() {
  triggerHaptic([15, 30, 25]);
}

/**
 * Warning vibration for fungal risk or low confidence
 */
export function hapticWarning() {
  triggerHaptic([25, 40, 25]);
}

/**
 * Heavy vibration pattern on network error or validation failure
 */
export function hapticError() {
  triggerHaptic([35, 40, 35, 40, 35]);
}
