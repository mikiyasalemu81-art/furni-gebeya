"use client";

import * as React from "react";
import { Download, X, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(false);

  React.useEffect(() => {
    // 1. Register Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("[PWA] Service worker registered"))
        .catch((err) => console.warn("[PWA] Service worker registration failed", err));
    }

    // 2. Offline / Online event listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (!navigator.onLine) setIsOffline(true);

    // 3. BeforeInstallPrompt Event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user previously dismissed
      const dismissed = localStorage.getItem("furni_pwa_dismissed");
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    localStorage.setItem("furni_pwa_dismissed", "true");
  };

  return (
    <>
      {/* Offline Status Banner */}
      {isOffline && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-amber-500 text-black py-1.5 px-4 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You are offline. Showing cached listings and app shell.</span>
        </div>
      )}

      {/* PWA Install Prompt Banner */}
      {showInstallBanner && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-card/95 backdrop-blur-md border border-border rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent-blue text-white flex items-center justify-center font-black shrink-0">
              FG
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-foreground">Install Furni Gebeya App</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                Install to your home screen for instant access, offline mode & faster loading.
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <Button size="sm" onClick={handleInstallClick} className="h-7 text-xs font-bold gap-1 px-3">
                  <Download className="w-3.5 h-3.5" />
                  Install
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss} className="h-7 text-xs text-muted-foreground">
                  Later
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
