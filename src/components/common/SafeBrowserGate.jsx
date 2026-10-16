import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Maximize2,
  AlertTriangle,
  XCircle,
  Eye,
  ClipboardX,
  Laptop,
  CheckCircle2,
  Lock
} from "lucide-react";
import { Button } from "./Button";
import { Badge } from "./Badge";

/**
 * Pre-Flight Launch Gate Modal
 * Shown before candidate accesses test questions to initialize Fullscreen mode.
 */
export function SafeBrowserLaunchModal({
  isOpen,
  title = "Secure Exam Environment",
  maxViolations = 3,
  blockClipboard = true,
  onLaunch,
  launching = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Proctored Integrity Shield
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              {title}
            </h2>
          </div>
        </div>

        {/* Security Rules Checklist */}
        <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80 text-xs sm:text-sm text-slate-700">
          <div className="flex items-start gap-3">
            <Maximize2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Mandatory Full-Screen Mode</span>
              <p className="text-slate-500 text-xs">Exiting full screen or minimizing the browser window will register a security strike.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Eye className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Tab Switch & Focus Monitoring</span>
              <p className="text-slate-500 text-xs">Navigating away from this tab or clicking onto secondary monitors is strictly logged.</p>
            </div>
          </div>

          {blockClipboard && (
            <div className="flex items-start gap-3">
              <ClipboardX className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">Zero Clipboard Policy</span>
                <p className="text-slate-500 text-xs">Copying questions, pasting external snippets, and right-click context menus are disabled.</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Laptop className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Strike Escalation Limit</span>
              <p className="text-slate-500 text-xs">
                You are allowed a maximum of <strong className="text-slate-900">{maxViolations} violation strikes</strong>. Reaching this limit will automatically terminate and submit your session.
              </p>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-400">
            Clicking below will switch your browser into full screen.
          </p>
          <Button
            variant="primary"
            size="lg"
            icon={Maximize2}
            onClick={onLaunch}
            disabled={launching}
            className="w-full sm:w-auto px-6 font-bold shadow-md cursor-pointer"
          >
            {launching ? "Entering Fullscreen..." : "Enter Fullscreen & Begin"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Active Warning Strike Modal
 * Shown immediately when candidate switches tabs or exits fullscreen.
 */
export function SafeBrowserWarningModal({
  warning,
  onDismiss
}) {
  if (!warning || warning.isTerminal) return null;

  const strikesLeft = Math.max(0, warning.maxViolations - warning.strike);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-amber-400 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Integrity Warning
              </span>
              <span className="text-xs font-mono font-bold text-rose-600">
                Strike {warning.strike} of {warning.maxViolations}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {warning.label || "Security Violation Detected"}
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs sm:text-sm text-amber-900 space-y-2">
          <p className="font-medium leading-relaxed">
            {warning.reason || "You navigated away from the exam or exited full-screen mode."}
          </p>
          <div className="p-2.5 rounded-lg bg-white/80 border border-amber-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              {strikesLeft > 0
                ? `${strikesLeft} strike(s) remaining before automatic session submission & disqualification.`
                : "Final warning! Next violation will terminate your exam."}
            </span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            variant="primary"
            size="md"
            icon={Maximize2}
            onClick={onDismiss}
            className="w-full font-bold shadow-md bg-amber-600 hover:bg-amber-700 border-amber-600 text-white cursor-pointer"
          >
            I Understand — Resume Fullscreen Exam
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Terminal Disqualification Modal
 * Shown when candidate exceeds maximum violation strikes.
 */
export function SafeBrowserTerminatedModal({
  isOpen,
  totalStrikes = 3,
  violations = []
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-rose-500 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded">
              Exam Disqualified
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Session Terminated
            </h2>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/90 text-xs sm:text-sm text-rose-900 space-y-2.5">
          <p className="font-semibold">
            You have accumulated {totalStrikes} integrity violation strikes, exceeding the permitted proctoring threshold.
          </p>
          <p className="text-xs text-rose-700 leading-relaxed">
            Your exam session has been locked and automatically submitted for administrative review. A proctoring telemetry audit has been recorded.
          </p>
        </div>

        {violations.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px]">
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Audit Log:</div>
            {violations.map((v, idx) => (
              <div key={v.id || idx} className="flex items-center justify-between py-1 border-b border-slate-200/60 last:border-0 text-slate-600">
                <span>Strike {v.strike}: {v.label}</span>
                <span className="font-mono text-[10px] text-slate-400">
                  {new Date(v.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="text-center text-xs text-slate-500">
          Redirecting to your result overview...
        </div>
      </div>
    </div>
  );
}

/**
 * Top Header Proctoring Status Pill
 * Compact status pill rendered in exam workspace headers
 */
export function SafeBrowserStatusPill({
  isArmed = true,
  isFullscreen = true,
  violationCount = 0,
  maxViolations = 3,
  onReenterFullscreen = null
}) {
  const hasStrikes = violationCount > 0;
  const isHighRisk = violationCount >= maxViolations - 1;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-2xs transition-all ${
          !isFullscreen
            ? "bg-rose-50 text-rose-800 border-rose-300 animate-pulse"
            : hasStrikes
            ? isHighRisk
              ? "bg-rose-50 text-rose-800 border-rose-300"
              : "bg-amber-50 text-amber-800 border-amber-300"
            : "bg-emerald-50 text-emerald-800 border-emerald-200"
        }`}
        title="Proctored Safe Browser Telemetry"
      >
        <ShieldCheck className={`w-3.5 h-3.5 ${hasStrikes ? "text-amber-600" : "text-emerald-600"}`} />
        <span>Safe Browser</span>
        <span className="text-slate-300 font-light">|</span>
        <span className="font-mono font-bold">
          Strikes: {violationCount}/{maxViolations}
        </span>
      </div>

      {!isFullscreen && onReenterFullscreen && (
        <button
          type="button"
          onClick={onReenterFullscreen}
          className="text-[11px] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2 py-1 rounded-lg border border-rose-300 cursor-pointer transition-colors"
        >
          Re-enter Fullscreen
        </button>
      )}
    </div>
  );
}
