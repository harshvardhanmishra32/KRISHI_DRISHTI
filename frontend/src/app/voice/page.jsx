"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  User as UserIcon,
  Globe,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../lib/api";
import ProtectedRoute from "../../components/ProtectedRoute";
import Header from "../../components/Header";
import Card from "../../components/Card";
import Chip from "../../components/Chip";
import ErrorBox from "../../components/ErrorBox";

export default function VoicePage() {
  const { user } = useAuth();
  const { t, language, changeLanguage } = useLanguage();

  const [activeLang, setActiveLang] = useState(language || "hi");
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [pipelineStage, setPipelineStage] = useState(null); // 'listening' | 'thinking' | 'speaking' | null
  const [textInput, setTextInput] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text:
        language === "hi"
          ? "नमस्ते! मैं कृषि दृष्टि आवाज़ सहायक हूँ। आप मुझसे मौसम, मंडी भाव, पत्तियों के रोग या खाद-बीज के बारे में बोलकर पूछ सकते हैं।"
          : "Namaste! I am your Krishi Drishti Voice Assistant. Ask me about weather, crop diseases, mandi prices, or farming advice.",
      intent: "greeting",
    },
  ]);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const speechRecognitionRef = useRef(null);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Sync language with context
  useEffect(() => {
    if (language) setActiveLang(language);
  }, [language]);

  const handleLanguageToggle = (lang) => {
    setActiveLang(lang);
    changeLanguage(lang);
  };

  const clearRecordingTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const submitTextQuery = async (query) => {
    setError(null);
    setPipelineStage("thinking");
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "user", text: query },
    ]);

    try {
      const formData = new FormData();
      formData.append("query_text", query);
      formData.append("language", activeLang);
      const res = await api.post("/voice-query", formData);
      handleServerResponse(res, false);
    } catch (err) {
      setError(err.message || "Failed to process question.");
      setPipelineStage(null);
    }
  };

  // Use the browser's speech recognition first. It works without the optional
  // server-side Whisper package and returns the transcript before calling the API.
  const startBrowserRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;

    const recognition = new SpeechRecognition();
    recognition.lang = activeLang === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setPipelineStage("listening");
      setRecordSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordSeconds((seconds) => {
          if (seconds >= 29) {
            recognition.stop();
            return 30;
          }
          return seconds + 1;
        });
      }, 1000);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      speechRecognitionRef.current = null;
      clearRecordingTimer();
      setIsRecording(false);
      if (transcript) {
        submitTextQuery(transcript);
      } else {
        setPipelineStage(null);
        setError("I could not hear a question. Please try again.");
      }
    };

    recognition.onerror = (event) => {
      speechRecognitionRef.current = null;
      clearRecordingTimer();
      setIsRecording(false);
      setPipelineStage(null);
      const message =
        event.error === "not-allowed"
          ? "Microphone permission is required for voice questions."
          : event.error === "no-speech"
          ? "I could not hear a question. Please try again."
          : "Voice recognition is unavailable. Please type your question.";
      setError(message);
    };

    recognition.onend = () => {
      clearRecordingTimer();
      setIsRecording(false);
    };

    try {
      speechRecognitionRef.current = recognition;
      recognition.start();
      return true;
    } catch {
      speechRecognitionRef.current = null;
      return false;
    }
  };

  // Start Voice Recording
  const startRecording = async () => {
    setError(null);
    if (startBrowserRecognition()) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(t("mic_error"));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = "audio/webm";
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else {
          mimeType = "";
        }
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        stream.getTracks().forEach((track) => track.stop());
        await processAudioQuery(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setPipelineStage("listening");
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((sec) => {
          if (sec >= 29) {
            mediaRecorder.stop();
            clearRecordingTimer();
            return 30;
          }
          return sec + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      setError("Microphone permission denied or not supported.");
      setIsRecording(false);
      setPipelineStage(null);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    } else if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    clearRecordingTimer();
    setIsRecording(false);
  };

  // Send Audio to Backend
  const processAudioQuery = async (audioBlob) => {
    setPipelineStage("thinking");
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "query.webm");
      formData.append("language", activeLang);

      const res = await api.post("/voice-query", formData);
      handleServerResponse(res);
    } catch (err) {
      setError(err.message || "Failed to process voice query.");
      setPipelineStage(null);
    }
  };

  // Send Text Query Fallback
  const handleTextSubmit = (e) => {
    e.preventDefault();
    const query = textInput.trim();
    if (!query) return;

    setTextInput("");
    submitTextQuery(query);
  };

  // Handle Response from API
  const handleServerResponse = (res, addUserMsg = true) => {
    setPipelineStage("speaking");

    if (addUserMsg && res.transcript) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-user`,
          sender: "user",
          text: res.transcript,
        },
      ]);
    }

    const botMsg = {
      id: `${Date.now()}-bot`,
      sender: "bot",
      text: res.answer_text,
      intent: res.intent,
      audioUrl: res.audio_url,
    };

    setMessages((prev) => [...prev, botMsg]);

    // If audio_url is returned, auto-play it
    if (res.audio_url) {
      const fullUrl = res.audio_url.startsWith("http")
        ? res.audio_url
        : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}${res.audio_url}`;

      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = fullUrl;
        audioPlayerRef.current.play().catch((e) => {
          console.warn("Audio autoplay blocked by browser:", e);
        });
      }
    } else if (typeof window !== "undefined" && window.speechSynthesis) {
      // Browser SpeechSynthesis fallback
      const utterance = new SpeechSynthesisUtterance(res.answer_text);
      utterance.lang = activeLang === "hi" ? "hi-IN" : "en-IN";
      window.speechSynthesis.speak(utterance);
    }

    setTimeout(() => {
      setPipelineStage(null);
    }, 3000);
  };

  return (
    <ProtectedRoute>
      <div className="pb-28">
        <Header title={t("voice_title")} showBack />

        <div className="p-4 space-y-4">
          {/* Language Selector Pill */}
          <div className="flex justify-between items-center bg-white px-3 py-2 rounded-card border border-krishi-border shadow-xs">
            <span className="text-xs font-bold text-krishi-grey flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-krishi-green" />
              Language:
            </span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-krishi-border">
              <button
                type="button"
                onClick={() => handleLanguageToggle("hi")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  activeLang === "hi"
                    ? "bg-krishi-green text-white shadow-xs"
                    : "text-krishi-grey hover:text-krishi-text"
                }`}
              >
                हिंदी (Hindi)
              </button>
              <button
                type="button"
                onClick={() => handleLanguageToggle("en")}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                  activeLang === "en"
                    ? "bg-krishi-green text-white shadow-xs"
                    : "text-krishi-grey hover:text-krishi-text"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {error && <ErrorBox error={error} onDismiss={() => setError(null)} />}

          {/* Central Pulsing Microphone Section */}
          <Card className="p-6 text-center shadow-md bg-gradient-to-b from-white to-slate-50 border-krishi-border relative overflow-hidden">
            <div className="mb-4">
              <h2 className="text-base font-extrabold text-krishi-text">
                {isRecording
                  ? t("listening")
                  : pipelineStage === "thinking"
                  ? t("thinking")
                  : t("tap_speak")}
              </h2>
              <p className="text-xs text-krishi-grey mt-0.5">
                {isRecording
                  ? `Recording... 00:${recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds} (Tap to send)`
                  : 'Ask: "आज का मौसम कैसा रहेगा?" or "टमाटर में झुलसा रोग की दवा"'}
              </p>
            </div>

            {/* BIG MIC BUTTON */}
            <div className="relative inline-block my-2">
              {isRecording && (
                <div className="absolute inset-0 rounded-full bg-krishi-green/30 animate-ping" />
              )}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={pipelineStage === "thinking"}
                className={`w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all relative z-10 active:scale-95 disabled:opacity-50 ${
                  isRecording
                    ? "bg-krishi-red hover:bg-red-700"
                    : "bg-krishi-green hover:bg-krishi-dark"
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-10 h-10" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
            </div>

            {/* Pipeline Stage Badge */}
            {pipelineStage && (
              <div className="mt-3 flex justify-center">
                <Chip
                  variant={
                    pipelineStage === "listening"
                      ? "warning"
                      : pipelineStage === "thinking"
                      ? "info"
                      : "success"
                  }
                  className="py-1 px-3 text-xs flex items-center gap-1.5 animate-pulse"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="capitalize">{pipelineStage}...</span>
                </Chip>
              </div>
            )}
          </Card>

          {/* Conversation Thread */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-krishi-grey uppercase tracking-wider">
              Conversation
            </h3>

            <div className="space-y-2.5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-krishi-light flex-shrink-0 flex items-center justify-center text-krishi-green">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      msg.sender === "user"
                        ? "bg-krishi-green text-white rounded-tr-xs"
                        : "bg-white text-krishi-text border border-krishi-border rounded-tl-xs"
                    }`}
                  >
                    {msg.intent && msg.intent !== "greeting" && (
                      <span className="text-[10px] font-bold text-krishi-green bg-emerald-50 px-1.5 py-0.5 rounded-md uppercase tracking-wider block mb-1">
                        Intent: {msg.intent}
                      </span>
                    )}
                    <p>{msg.text}</p>
                  </div>

                  {msg.sender === "user" && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-600">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM FIXED TEXT QUERY FALLBACK BAR */}
        <div className="fixed bottom-16 left-0 right-0 max-w-[480px] mx-auto p-3 bg-white/95 backdrop-blur-sm border-t border-krishi-border z-30">
          <form onSubmit={handleTextSubmit} className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={
                activeLang === "hi"
                  ? "यहाँ सवाल लिखें (मौसम, भाव, रोग)..."
                  : "Type query here (weather, price, disease)..."
              }
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-krishi-border rounded-button text-xs focus:ring-2 focus:ring-krishi-green focus:outline-none"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || pipelineStage === "thinking"}
              className="px-4 py-2.5 bg-krishi-green text-white rounded-button hover:bg-krishi-dark disabled:opacity-50 transition-colors flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Hidden Audio Player for Generated TTS mp3 */}
        <audio ref={audioPlayerRef} className="hidden" />
      </div>
    </ProtectedRoute>
  );
}
