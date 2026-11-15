/**
 * Krishi Drishti - Unified Text-to-Speech & Voice Engine
 * Handles:
 * 1. Audio element playback for server-generated MP3/WAV (gTTS / offline TTS)
 * 2. Client-side SpeechSynthesis fallback with explicit Hindi / Indian English voice selection
 * 3. Asynchronous voice loading for Chrome, Safari, Edge, Firefox, and macOS
 * 4. User-activated replaying of any message
 */

let cachedVoices = [];

// Initialize voices eagerly and cache them
export function initTTSVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const loadVoices = () => {
    try {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) {
        cachedVoices = v;
      }
    } catch {
      // Ignore in environments where speechSynthesis is partially supported
    }
  };

  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

/**
 * Find the most suitable voice for the requested language.
 * On macOS / iOS: "Lekha" is the built-in high-quality Hindi voice.
 * In Chrome: "Google हिन्दी" is the built-in network Hindi voice.
 */
export function findBestVoice(lang = "hi") {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  let voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  if (lang === "hi") {
    // 1. Exact hi-IN match (e.g., Google हिन्दी, Lekha hi_IN)
    const exactHi = voices.find(
      (v) =>
        v.lang === "hi-IN" ||
        v.lang === "hi_IN" ||
        v.name.toLowerCase().includes("lekha") ||
        v.name.toLowerCase().includes("hindi") ||
        v.name.includes("हिन्दी")
    );
    if (exactHi) return exactHi;

    // 2. Any language code starting with 'hi'
    const anyHi = voices.find((v) => v.lang.toLowerCase().startsWith("hi"));
    if (anyHi) return anyHi;
  } else {
    // Indian English preferred, then general English
    const enIn = voices.find(
      (v) =>
        v.lang === "en-IN" ||
        v.lang === "en_IN" ||
        v.name.toLowerCase().includes("india") ||
        v.name.toLowerCase().includes("rishi")
    );
    if (enIn) return enIn;

    const anyEn = voices.find((v) => v.lang.toLowerCase().startsWith("en"));
    if (anyEn) return anyEn;
  }

  return voices[0] || null;
}

/**
 * Speak text using the browser's SpeechSynthesis API with proper voice selection.
 */
export function speakBrowserText(
  text,
  lang = "hi",
  { onStart, onEnd, onError } = {}
) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    if (onError) onError(new Error("SpeechSynthesis not supported"));
    return () => {};
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending speech

    const cleanText = text
      .replace(/[#*_`]/g, "") // Remove markdown
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return () => {};
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const chosenVoice = findBestVoice(lang);
    if (chosenVoice) {
      utterance.voice = chosenVoice;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn("SpeechSynthesis utterance error:", e);
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    // Chrome bug workaround: long utterances can stall if not kept alive
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        clearInterval(keepAlive);
      }
    }, 10000);

    const originalOnEnd = utterance.onend;
    utterance.onend = (e) => {
      clearInterval(keepAlive);
      if (originalOnEnd) originalOnEnd(e);
    };

    window.speechSynthesis.speak(utterance);

    return () => {
      clearInterval(keepAlive);
      window.speechSynthesis.cancel();
    };
  } catch (err) {
    console.error("speakBrowserText failed:", err);
    if (onError) onError(err);
    if (onEnd) onEnd();
    return () => {};
  }
}

/**
 * Play server audio URL with seamless fallback to browser speech synthesis.
 */
export function playServerOrBrowserAudio(
  audioUrl,
  text,
  lang = "hi",
  audioElementRef = null,
  { onStart, onEnd, onError } = {}
) {
  // If we have an audio URL from backend (gTTS / say), prioritize playing it
  if (audioUrl) {
    const fullUrl = audioUrl.startsWith("http")
      ? audioUrl
      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}${audioUrl}`;

    try {
      const audio = audioElementRef?.current || new Audio();
      audio.src = fullUrl;

      audio.onplay = () => {
        if (onStart) onStart();
      };
      audio.onended = () => {
        if (onEnd) onEnd();
      };
      audio.onerror = (e) => {
        console.warn("Server audio playback failed, falling back to browser TTS:", e);
        // Fall back to browser speech synthesis
        speakBrowserText(text, lang, { onStart, onEnd, onError });
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((playErr) => {
          console.warn("Audio play() rejected (autoplay policy), falling back to browser TTS:", playErr);
          speakBrowserText(text, lang, { onStart, onEnd, onError });
        });
      }

      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    } catch (e) {
      console.warn("Failed creating Audio, falling back:", e);
      return speakBrowserText(text, lang, { onStart, onEnd, onError });
    }
  }

  // No audioUrl provided, speak via browser SpeechSynthesis
  return speakBrowserText(text, lang, { onStart, onEnd, onError });
}

export function stopAllSpeech(audioElementRef = null) {
  if (typeof window !== "undefined") {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (audioElementRef?.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
  }
}
