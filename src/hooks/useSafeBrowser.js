import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Cross-browser Fullscreen API helper
 */
function isDocumentFullscreen() {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

async function requestFullscreenElement(element = document.documentElement) {
  if (!element) return false;
  try {
    if (element.requestFullscreen) {
      await element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      await element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      await element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      await element.msRequestFullscreen();
    }
    return true;
  } catch (err) {
    console.warn("Safe Browser: Fullscreen request was not permitted or dismissed:", err);
    return false;
  }
}

async function exitFullscreenElement() {
  if (typeof document === "undefined") return false;
  try {
    if (document.exitFullscreen && isDocumentFullscreen()) {
      await document.exitFullscreen();
    } else if (document.webkitExitFullscreen && isDocumentFullscreen()) {
      await document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen && isDocumentFullscreen()) {
      await document.mozCancelFullScreen();
    } else if (document.msExitFullscreen && isDocumentFullscreen()) {
      await document.msExitFullscreen();
    }
    return true;
  } catch (err) {
    console.warn("Safe Browser: Exit fullscreen encountered notice:", err);
    return false;
  }
}

/**
 * Parse creator-configured safe browser settings embedded in assessment/contest descriptions
 */
export function parseProctoringConfig(text) {
  if (!text || typeof text !== "string") {
    return { enabled: true, maxViolations: 3 };
  }
  const match = text.match(/\[SAFE_BROWSER:(\{.*?\})\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      return {
        enabled: parsed.enabled !== false,
        maxViolations: Number(parsed.maxViolations) || 3
      };
    } catch (e) {}
  }
  return { enabled: true, maxViolations: 3 };
}

/**
 * Hook: useSafeBrowser
 * Provides comprehensive proctoring and exam-integrity controls:
 * - Mandatory Fullscreen enforcement
 * - Tab switch & window blur detection
 * - Developer Tools shortcut interception (F12, Ctrl+Shift+I, etc.)
 * - Strict clipboard lockdown (Copy/Paste/Cut disabled)
 * - Right-click context menu suppression
 * - Configurable strike/violation ceiling (creator-chosen, default: 3)
 * - Auto-submission callback on terminal violation
 */
export function useSafeBrowser({
  enabled = true,
  maxViolations = 3,
  blockClipboard = true,
  onViolation = null,
  onTerminated = null,
  toastNotifier = null
} = {}) {
  // Pre-flight gate: Candidate must click to enter fullscreen before exam unlocks
  const [isArmed, setIsArmed] = useState(false);
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);

  // Violations & Warning State
  const [violationCount, setViolationCount] = useState(0);
  const [violations, setViolations] = useState([]);
  const [activeWarning, setActiveWarning] = useState(null);
  const [isTerminated, setIsTerminated] = useState(false);

  // References to prevent stale closure loops and duplicate debounce triggers
  const isArmedRef = useRef(isArmed);
  const isTerminatedRef = useRef(isTerminated);
  const violationCountRef = useRef(violationCount);
  const lastViolationTimeRef = useRef(0);
  const maxViolationsRef = useRef(maxViolations);
  const onViolationRef = useRef(onViolation);
  const onTerminatedRef = useRef(onTerminated);

  // Synchronize refs
  useEffect(() => {
    isArmedRef.current = isArmed;
  }, [isArmed]);

  useEffect(() => {
    isTerminatedRef.current = isTerminated;
  }, [isTerminated]);

  useEffect(() => {
    violationCountRef.current = violationCount;
  }, [violationCount]);

  useEffect(() => {
    maxViolationsRef.current = maxViolations;
  }, [maxViolations]);

  useEffect(() => {
    onViolationRef.current = onViolation;
    onTerminatedRef.current = onTerminated;
  }, [onViolation, onTerminated]);

  // Dispatch notice to student via toast if provided
  const notifyNotice = useCallback((msg, type = "warning") => {
    if (typeof toastNotifier === "function") {
      toastNotifier(msg, type);
    }
  }, [toastNotifier]);

  /**
   * Register a security violation strike
   */
  const recordViolation = useCallback((type, label, reason) => {
    if (!enabled || !isArmedRef.current || isTerminatedRef.current) return;

    const now = Date.now();
    // 1500ms debounce to prevent tab switch from registering both visibilitychange + window blur
    if (now - lastViolationTimeRef.current < 1500) {
      return;
    }
    lastViolationTimeRef.current = now;

    const newCount = violationCountRef.current + 1;
    violationCountRef.current = newCount;
    setViolationCount(newCount);

    const record = {
      id: `viol_${now}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      label,
      reason,
      strike: newCount,
      maxViolations: maxViolationsRef.current,
      timestamp: new Date().toISOString()
    };

    setViolations((prev) => [...prev, record]);

    if (onViolationRef.current) {
      onViolationRef.current(record);
    }

    // Check if terminal threshold reached
    if (newCount >= maxViolationsRef.current) {
      setIsTerminated(true);
      isTerminatedRef.current = true;
      setActiveWarning({
        ...record,
        isTerminal: true
      });

      if (onTerminatedRef.current) {
        onTerminatedRef.current({
          totalStrikes: newCount,
          record,
          violations: [...violations, record]
        });
      }
    } else {
      // Show warning modal
      setActiveWarning({
        ...record,
        isTerminal: false
      });
    }
  }, [enabled, violations]);

  /**
   * Launch Safe Browser and Enter Fullscreen
   */
  const launchSafeBrowser = useCallback(async () => {
    const success = await requestFullscreenElement();
    setIsFullscreenActive(isDocumentFullscreen());
    setIsArmed(true);
    return success;
  }, []);

  /**
   * Dismiss Warning modal and restore Fullscreen
   */
  const dismissWarning = useCallback(async () => {
    if (isTerminatedRef.current) return;
    setActiveWarning(null);
    await requestFullscreenElement();
    setIsFullscreenActive(isDocumentFullscreen());
  }, []);

  // Monitor Fullscreen State Changes
  useEffect(() => {
    if (!enabled) return;

    const handleFullscreenChange = () => {
      const isFs = isDocumentFullscreen();
      setIsFullscreenActive(isFs);

      // If proctoring is armed and student exits fullscreen, record violation
      if (isArmedRef.current && !isTerminatedRef.current && !isFs) {
        recordViolation(
          "EXIT_FULLSCREEN",
          "Exited Fullscreen Mode",
          "You have exited the mandatory full-screen proctoring environment."
        );
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [enabled, recordViolation]);

  // Monitor Tab Switching and Window Minimization
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden && isArmedRef.current && !isTerminatedRef.current) {
        recordViolation(
          "TAB_SWITCH",
          "Tab Switch / Minimization",
          "You navigated away from the exam tab or minimized the browser."
        );
      }
    };

    const handleWindowBlur = () => {
      if (isArmedRef.current && !isTerminatedRef.current && !document.hidden) {
        // Blur detected while document not marked hidden (e.g. secondary monitor or clicking external app)
        recordViolation(
          "WINDOW_BLUR",
          "Lost Window Focus",
          "The exam window lost active focus. Switching between applications or secondary monitors is prohibited."
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [enabled, recordViolation]);

  // Intercept DevTools and Clipboard shortcuts
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      if (!isArmedRef.current || isTerminatedRef.current) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      const key = e.key ? e.key.toLowerCase() : "";

      // 1. Block F12 (DevTools)
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        notifyNotice("Developer Tools (F12) are disabled in proctored mode.", "error");
        recordViolation("DEVTOOLS_ATTEMPT", "Developer Tools Interception", "Attempted to open browser developer tools.");
        return;
      }

      // 2. Block DevTools Shortcuts (Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C)
      if (isCtrlOrCmd && e.shiftKey && ["i", "j", "c"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        notifyNotice("Inspect Element / Developer Console is disabled.", "error");
        recordViolation("DEVTOOLS_ATTEMPT", "Developer Tools Interception", "Attempted to open browser developer tools.");
        return;
      }

      // 3. Block View Source (Ctrl+U)
      if (isCtrlOrCmd && key === "u") {
        e.preventDefault();
        e.stopPropagation();
        notifyNotice("View Source is disabled.", "error");
        return;
      }

      // 4. Block Copy / Paste / Cut if blockClipboard is active
      if (blockClipboard && isCtrlOrCmd && ["c", "v", "x"].includes(key)) {
        e.preventDefault();
        e.stopPropagation();
        const actionLabel = key === "v" ? "Pasting" : key === "c" ? "Copying" : "Cutting";
        notifyNotice(`${actionLabel} content is disabled during this proctored session.`, "warning");
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [enabled, blockClipboard, notifyNotice, recordViolation]);

  // Block Context Menu (Right Click) and Clipboard events
  useEffect(() => {
    if (!enabled || !isArmed) return;

    const handleContextMenu = (e) => {
      e.preventDefault();
      notifyNotice("Right-click context menu is disabled in safe browser mode.", "warning");
    };

    const handleCopy = (e) => {
      if (blockClipboard) {
        e.preventDefault();
        notifyNotice("Copying text is prohibited during this assessment.", "warning");
      }
    };

    const handlePaste = (e) => {
      if (blockClipboard) {
        e.preventDefault();
        notifyNotice("Pasting external content is prohibited. Please write your solution directly.", "warning");
      }
    };

    const handleCut = (e) => {
      if (blockClipboard) {
        e.preventDefault();
        notifyNotice("Cut operation is prohibited.", "warning");
      }
    };

    document.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("paste", handlePaste, true);
    document.addEventListener("cut", handleCut, true);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("paste", handlePaste, true);
      document.removeEventListener("cut", handleCut, true);
    };
  }, [enabled, isArmed, blockClipboard, notifyNotice]);

  // Warn on accidental tab close / reload
  useEffect(() => {
    if (!enabled || !isArmed) return;

    const handleBeforeUnload = (e) => {
      if (!isTerminatedRef.current) {
        e.preventDefault();
        e.returnValue = "Leaving or reloading this page may terminate your active exam session. Are you sure?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, isArmed]);

  return {
    isArmed,
    isFullscreenActive,
    violationCount,
    maxViolations,
    remainingStrikes: Math.max(0, maxViolations - violationCount),
    violations,
    activeWarning,
    isTerminated,
    launchSafeBrowser,
    dismissWarning,
    exitFullscreen: exitFullscreenElement
  };
}
