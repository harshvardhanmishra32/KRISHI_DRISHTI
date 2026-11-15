"use client";

import { useEffect } from "react";
import { api } from "../lib/api";
import { syncPendingScans } from "../lib/offlineClassifier";

export default function PwaManager() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // In local development, unregister old service workers and purge caches to avoid stale styles
    if (isLocalhost) {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
            console.log("Purged dev Service Worker:", reg.scope);
          }
        });
      }
      if ("caches" in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
      return;
    }

    // 1. Register Service Worker in production
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("Krishi Drishti SW registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.warn("SW registration failed:", error);
          });
      });
    }

    // 2. Background Sync on Network Reconnection
    const handleOnline = async () => {
      console.log("Device reconnected to network. Syncing offline data...");
      try {
        const result = await syncPendingScans(api);
        if (result.synced > 0) {
          console.log(`Successfully synced ${result.synced} offline scans.`);
        }
      } catch (e) {
        console.warn("Offline sync error:", e);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  return null;
}
