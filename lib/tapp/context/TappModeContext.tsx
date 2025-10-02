"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * Tapp AMM Mode: DEMO (mock data) or LIVE (blockchain data)
 */
export type TappMode = "DEMO" | "LIVE";

interface TappModeContextType {
  mode: TappMode;
  setMode: (mode: TappMode) => void;
  isDemo: boolean;
  isLive: boolean;
}

const TappModeContext = createContext<TappModeContextType | undefined>(
  undefined,
);

const STORAGE_KEY = "verifi_tapp_mode";

export function TappModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<TappMode>("DEMO");

  // Load mode from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "LIVE" || saved === "DEMO") {
      setModeState(saved);
    }
  }, []);

  const setMode = (newMode: TappMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  return (
    <TappModeContext.Provider
      value={{
        mode,
        setMode,
        isDemo: mode === "DEMO",
        isLive: mode === "LIVE",
      }}
    >
      {children}
    </TappModeContext.Provider>
  );
}

export function useTappMode() {
  const context = useContext(TappModeContext);
  if (!context) {
    throw new Error("useTappMode must be used within TappModeProvider");
  }
  return context;
}
