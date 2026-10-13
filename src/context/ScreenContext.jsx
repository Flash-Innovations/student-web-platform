import React, { createContext, useContext, useState, useCallback, useMemo } from "react";

const ScreenContext = createContext(null);

export function ScreenProvider({ children }) {
  const [screenContext, setScreenContextState] = useState({
    contextType: "GENERAL",
    data: {},
    timestamp: Date.now()
  });

  const [assistantOpen, setAssistantOpen] = useState(false);
  const [activeQueryTrigger, setActiveQueryTrigger] = useState(null);

  const setScreenContext = useCallback((context) => {
    setScreenContextState({
      contextType: context.contextType || "GENERAL",
      data: context.data || {},
      timestamp: Date.now()
    });
  }, []);

  const clearScreenContext = useCallback(() => {
    setScreenContextState({
      contextType: "GENERAL",
      data: {},
      timestamp: Date.now()
    });
  }, []);

  const openAssistantWithQuery = useCallback((query, action = "AUTO") => {
    setActiveQueryTrigger({ query, action, ts: Date.now() });
    setAssistantOpen(true);
  }, []);

  const clearActiveQueryTrigger = useCallback(() => {
    setActiveQueryTrigger(null);
  }, []);

  const value = useMemo(() => ({
    screenContext,
    setScreenContext,
    clearScreenContext,
    assistantOpen,
    setAssistantOpen,
    activeQueryTrigger,
    openAssistantWithQuery,
    clearActiveQueryTrigger
  }), [
    screenContext,
    setScreenContext,
    clearScreenContext,
    assistantOpen,
    setAssistantOpen,
    activeQueryTrigger,
    openAssistantWithQuery,
    clearActiveQueryTrigger
  ]);

  return (
    <ScreenContext.Provider value={value}>
      {children}
    </ScreenContext.Provider>
  );
}

export function useScreenContext() {
  const context = useContext(ScreenContext);
  if (!context) {
    return {
      screenContext: { contextType: "GENERAL", data: {} },
      setScreenContext: () => {},
      clearScreenContext: () => {},
      assistantOpen: false,
      setAssistantOpen: () => {},
      activeQueryTrigger: null,
      openAssistantWithQuery: () => {},
      clearActiveQueryTrigger: () => {}
    };
  }
  return context;
}
