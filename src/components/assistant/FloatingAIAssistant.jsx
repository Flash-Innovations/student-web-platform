import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Bot,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Code2,
  Briefcase,
  Target,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Zap,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  BookOpen
} from "lucide-react";
import { useScreenContext } from "../../context/ScreenContext";
import { useAuth } from "../../context/AuthContext";
import { screenAssistantService } from "../../services/screenAssistantService";

// Routes where AI Assistant must be completely unmounted for exam integrity
const EXCLUDED_PATTERNS = [
  /^\/student\/assessments/i,
  /^\/student\/contests/i,
  /^\/student\/interview/i,
  /^\/student\/mock-interview/i,
  /\/assessments\//i,
  /\/contests\//i
];

export function FloatingAIAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    screenContext,
    assistantOpen,
    setAssistantOpen,
    activeQueryTrigger,
    clearActiveQueryTrigger
  } = useScreenContext();

  const isExcludedRoute = EXCLUDED_PATTERNS.some((pattern) => pattern.test(location.pathname));

  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Hi! I'm your SIPS AI Placement Coach. I can see your active screen to help with coding hints, job roadmaps, and interview strategies. What would you like to explore?",
      displayType: "GENERAL_ADVICE",
      displayData: null,
      timestamp: Date.now()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState(null);
  const [expandedHints, setExpandedHints] = useState({});

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (assistantOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, assistantOpen, loading]);

  // Speech Recognition Setup (STT)
  useEffect(() => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputQuery(transcript);
          handleSendQuery(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Text-to-Speech (TTS) handler
  const speakText = useCallback(
    (text) => {
      if (isMuted || !synthRef.current || !text) return;

      try {
        synthRef.current.cancel();
        const cleanText = text.replace(/[*#_`~[\]]/g, "").trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
      } catch (err) {
        console.warn("Speech synthesis error:", err);
        setIsSpeaking(false);
      }
    },
    [isMuted]
  );

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Send query to AI assistant
  const handleSendQuery = useCallback(
    async (queryToSend, actionIntent = "AUTO") => {
      const query = (queryToSend || inputQuery).trim();
      if (!query && actionIntent === "AUTO") return;

      const userMsg = {
        sender: "user",
        text: query || `Analyze screen (${screenContext.contextType})`,
        timestamp: Date.now()
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputQuery("");
      setLoading(true);

      const studentProfile = {
        id: user?._id || user?.id,
        name: user?.name || user?.fullName || "Student",
        email: user?.email,
        branch: user?.branch || user?.department || "Engineering",
        course: user?.course || user?.degree || "B.Tech",
        skills: user?.skills || user?.verifiedSkills || [],
        readinessScore: user?.placementReadinessScore || user?.readinessScore || 70
      };

      try {
        const response = await screenAssistantService.interact({
          query,
          screenContext,
          studentProfile,
          action: actionIntent
        });

        const assistantMsg = {
          sender: "assistant",
          text: response.spokenResponse,
          displayType: response.displayType,
          displayData: response.displayData,
          timestamp: Date.now()
        };

        setMessages((prev) => [...prev, assistantMsg]);
        speakText(response.spokenResponse);
      } catch (err) {
        console.error("AI Assistant interaction failed:", err);
        const errorMsg = {
          sender: "assistant",
          text: "I encountered an issue processing your screen state. Please try asking again.",
          displayType: "GENERAL_ADVICE",
          displayData: null,
          timestamp: Date.now()
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [inputQuery, screenContext, user, speakText]
  );

  // Handle external query triggers
  useEffect(() => {
    if (activeQueryTrigger) {
      handleSendQuery(activeQueryTrigger.query, activeQueryTrigger.action);
      clearActiveQueryTrigger();
    }
  }, [activeQueryTrigger, handleSendQuery, clearActiveQueryTrigger]);

  // Voice toggle
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  // Copy code helper
  const handleCopyCode = (code, index) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Toggle hints accordion
  const toggleHint = (index) => {
    setExpandedHints((prev) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // If on blacklisted route, unmount completely
  if (isExcludedRoute) {
    return null;
  }

  // Quick Action Buttons based on Context
  const getQuickActionChips = () => {
    const ctx = screenContext.contextType || "GENERAL";
    switch (ctx) {
      case "CODING_ARENA":
        return [
          { label: "💡 Give Intuition Hint", action: "HINT", query: "Give me progressive hints without spoiling the full solution." },
          { label: "⏱️ Check Time Complexity", action: "BIG_O", query: "What is the time and space complexity of my current approach?" },
          { label: "🧪 Edge Cases Check", action: "EDGE_CASES", query: "What edge cases might break my code?" }
        ];
      case "JOB_DESCRIPTION":
        return [
          { label: "📅 Build 2-Week Study Plan", action: "STUDY_PLAN", query: "Create a 2-week placement roadmap for this job role." },
          { label: "🎯 Matched vs Missing Skills", action: "SKILL_MATCH", query: "What skills am I missing for this specific opening?" },
          { label: "💼 Top Recruiter FAQs", action: "FAQS", query: "What are the most asked interview questions for this job?" }
        ];
      case "SKILL_GAP":
        return [
          { label: "🚀 Bridge High-Impact Skills", action: "BRIDGE_SKILLS", query: "What skills should I add to become market ready?" },
          { label: "📊 Projected Readiness Score", action: "SCORE", query: "How much will my readiness score increase if I learn these?" }
        ];
      case "PRACTICE_MCQ":
        return [
          { label: "⚡ 30-Sec Elimination Hack", action: "ELIMINATION", query: "How do I eliminate the wrong options quickly?" },
          { label: "🎯 Why Correct Option Works", action: "EXPLANATION", query: "Explain why the right answer is correct with concept intuition." }
        ];
      default:
        return [
          { label: "✨ Analyze Current Screen", action: "AUTO", query: "Analyze my current screen and give recommendations." },
          { label: "🏆 Placement Strategy", action: "STRATEGY", query: "What should I focus on today to prepare for upcoming campus drives?" }
        ];
    }
  };

  // Context Badge Label
  const getContextBadge = () => {
    const ctx = screenContext.contextType || "GENERAL";
    const data = screenContext.data || {};
    switch (ctx) {
      case "CODING_ARENA":
        return {
          icon: <Code2 className="w-3.5 h-3.5 text-blue-500" />,
          title: `Coding: ${data.problemTitle || "Problem"}`
        };
      case "JOB_DESCRIPTION":
        return {
          icon: <Briefcase className="w-3.5 h-3.5 text-purple-500" />,
          title: `Job: ${data.jobTitle || "Role"}`
        };
      case "SKILL_GAP":
        return {
          icon: <Target className="w-3.5 h-3.5 text-amber-500" />,
          title: "Skill Gap Analysis"
        };
      case "PRACTICE_MCQ":
        return {
          icon: <Zap className="w-3.5 h-3.5 text-emerald-500" />,
          title: "MCQ Question"
        };
      default:
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" />,
          title: "Placement Assistant"
        };
    }
  };

  const badge = getContextBadge();

  return (
    <>
      {/* Floating Button with AI Aura */}
      {!assistantOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-medium backdrop-blur shadow-lg border border-slate-700/50 animate-fade-in">
            {badge.icon}
            <span className="truncate max-w-[150px]">{badge.title}</span>
          </div>

          <button
            onClick={() => setAssistantOpen(true)}
            aria-label="Open SIPS AI Assistant"
            className="group relative p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer border border-white/20"
          >
            {/* Pulsing ring aura */}
            <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 opacity-40 blur-sm group-hover:opacity-75 transition duration-500 group-hover:duration-200 animate-pulse"></span>
            <div className="relative flex items-center justify-center">
              <Bot className="w-6 h-6 transition-transform group-hover:rotate-12 duration-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white"></span>
            </div>
          </button>
        </div>
      )}

      {/* Slide-Over Panel */}
      {assistantOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 w-[420px] max-w-[95vw] h-[640px] max-h-[85vh] rounded-2xl bg-white border border-slate-200/80 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative p-2 rounded-xl bg-white/10 backdrop-blur border border-white/10">
                <Bot className="w-5 h-5 text-indigo-300" />
                {isSpeaking && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm tracking-tight text-white">SIPS AI Assistant</h3>
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-500/30 text-indigo-200 rounded border border-indigo-400/20">
                    Screen Aware
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-300">
                  {badge.icon}
                  <span className="truncate max-w-[200px]">{badge.title}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  setIsMuted(!isMuted);
                }}
                title={isMuted ? "Unmute Voice" : "Mute Voice"}
                className={`p-1.5 rounded-lg transition-colors ${
                  isMuted ? "text-slate-400 hover:text-slate-200" : "text-emerald-400 hover:bg-white/10"
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  stopSpeaking();
                  setAssistantOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voice Speaking Bar */}
          {isSpeaking && (
            <div className="px-3 py-1.5 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs text-indigo-700 animate-pulse">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-indigo-600 animate-bounce" />
                <span>Speaking answer aloud...</span>
              </div>
              <button
                onClick={stopSpeaking}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 underline"
              >
                Stop Audio
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                {/* Spoken Dialogue Text */}
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm shadow-sm"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-sm shadow-sm"
                  }`}
                >
                  <p>{msg.text}</p>

                  {msg.sender === "assistant" && (
                    <div className="mt-1.5 flex items-center justify-end gap-1">
                      <button
                        onClick={() => speakText(msg.text)}
                        title="Replay Voice"
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Structured Display Cards */}
                {msg.displayData && renderDisplayCard(msg.displayType, msg.displayData, idx)}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl rounded-bl-sm max-w-[85%] shadow-sm">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                </div>
                <span className="text-xs text-slate-500 font-medium">Analyzing active screen...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Context Quick Action Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {getQuickActionChips().map((chip, i) => (
              <button
                key={i}
                disabled={loading}
                onClick={() => handleSendQuery(chip.query, chip.action)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 active:scale-95 transition-all cursor-pointer flex-shrink-0"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Footer Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Talk with your voice"}
                className={`p-2.5 rounded-xl border transition-all ${
                  isListening
                    ? "bg-rose-500 border-rose-600 text-white animate-pulse"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={isListening ? "Listening to your voice..." : "Ask assistant about this screen..."}
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={loading || !inputQuery.trim()}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );

  // Render Rich Visual Cards based on DisplayType
  function renderDisplayCard(type, data, msgIdx) {
    if (!data) return null;

    switch (type) {
      case "CODE_HINT":
        return (
          <div className="w-full mt-2.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-indigo-600" />
                {data.problemTitle || "Algorithmic Diagnostic"}
              </span>
              {data.difficulty && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  {data.difficulty}
                </span>
              )}
            </div>

            {/* Complexity Analysis */}
            {data.complexity && (
              <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Complexity</span>
                  <span className="font-mono font-medium text-rose-600">{data.complexity.currentEstimate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Optimal Target</span>
                  <span className="font-mono font-medium text-emerald-600">{data.complexity.optimalTarget}</span>
                </div>
                {data.complexity.bottleneck && (
                  <div className="col-span-2 pt-1 border-t border-slate-200/50 text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-700">Bottleneck: </span>
                    {data.complexity.bottleneck}
                  </div>
                )}
              </div>
            )}

            {/* Progressive Socratic Hints */}
            {Array.isArray(data.progressiveHints) && data.progressiveHints.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                  Progressive Hints
                </span>
                {data.progressiveHints.map((hint, hIdx) => {
                  const key = `${msgIdx}-hint-${hIdx}`;
                  const isExp = expandedHints[key] !== false; // expanded by default
                  return (
                    <div key={hIdx} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                      <button
                        onClick={() => toggleHint(key)}
                        className="w-full px-2.5 py-1.5 flex items-center justify-between text-left font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">
                            {hint.level || hIdx + 1}
                          </span>
                          {hint.title}
                        </span>
                        {isExp ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                      {isExp && (
                        <div className="px-2.5 py-2 text-slate-600 bg-white border-t border-slate-100 text-[11px] leading-relaxed">
                          {hint.text}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Code Snippet */}
            {data.codeSnippet && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Recommended Pattern</span>
                  <button
                    onClick={() => handleCopyCode(data.codeSnippet, msgIdx)}
                    className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    {copiedCodeIndex === msgIdx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCodeIndex === msgIdx ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {data.codeSnippet}
                </pre>
              </div>
            )}
          </div>
        );

      case "STUDY_PLAN":
        return (
          <div className="w-full mt-2.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{data.jobTitle}</h4>
                <p className="text-[11px] text-slate-500 font-medium">{data.company}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Match Score</span>
                <span className="text-sm font-extrabold text-indigo-600">{data.matchPercentage || 70}%</span>
              </div>
            </div>

            {/* Skill Match Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="font-bold text-emerald-800 block mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Matched Skills
                </span>
                <div className="flex flex-wrap gap-1">
                  {(data.matchedSkills || []).map((s, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-900 text-[10px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                <span className="font-bold text-rose-800 block mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-600" /> Missing / Gap
                </span>
                <div className="flex flex-wrap gap-1">
                  {(data.missingSkills || []).map((s, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-rose-200/60 text-rose-900 text-[10px] font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Week by Week Study Roadmap */}
            {Array.isArray(data.studyPlan) && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Self-Paced Placement Plan
                </span>

                {data.studyPlan.map((plan, pIdx) => (
                  <div key={pIdx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-700">Week {plan.week}: {plan.focusSkill}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{plan.milestone}</span>
                    </div>

                    {Array.isArray(plan.topics) && (
                      <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                        {plan.topics.map((top, tIdx) => (
                          <li key={tIdx}>{top}</li>
                        ))}
                      </ul>
                    )}

                    {plan.practiceModule && (
                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500">Practice Hub:</span>
                        <button
                          onClick={() => {
                            setAssistantOpen(false);
                            navigate("/student/practice");
                          }}
                          className="font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                        >
                          {plan.practiceModule} <ArrowRight className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "MARKET_READINESS":
        return (
          <div className="w-full mt-2.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                {data.targetTrack || "Market Readiness Plan"}
              </span>
              <div className="flex items-center gap-1 text-emerald-600 font-extrabold text-sm">
                <span>{data.currentReadinessScore}%</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="text-indigo-600">{data.projectedReadinessScore}%</span>
              </div>
            </div>

            {/* High Impact Bridge Skills */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                High-Impact Bridge Skills
              </span>

              {Array.isArray(data.bridgeSkills) && data.bridgeSkills.map((bridge, bIdx) => (
                <div key={bIdx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{bridge.skill}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                      {bridge.priority}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{bridge.rationale}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>Est. Time: {bridge.learningTime}</span>
                    <span className="font-medium text-indigo-600">{bridge.practiceModule}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "MCQ_EXPLANATION":
        return (
          <div className="w-full mt-2.5 p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3 animate-fade-in text-xs">
            {/* 30-sec elimination hack banner */}
            {data.eliminationHack && (
              <div className="p-2.5 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-900 flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[11px] block">⚡ 30-Second Elimination Hack</span>
                  <p className="text-[11px] text-amber-800 mt-0.5">{data.eliminationHack}</p>
                </div>
              </div>
            )}

            {/* Conceptual Intuition */}
            <div className="space-y-1">
              <span className="font-bold text-slate-800 text-[11px]">Core Concept Intuition</span>
              <p className="text-slate-600 text-[11px] leading-relaxed">{data.conceptualIntuition}</p>
            </div>

            {/* Distractor Trap Breakdown */}
            {Array.isArray(data.distractorAnalysis) && data.distractorAnalysis.length > 0 && (
              <div className="space-y-1">
                <span className="font-bold text-slate-800 text-[11px]">Trap Options Breakdown</span>
                <div className="space-y-1">
                  {data.distractorAnalysis.map((trap, trIdx) => (
                    <div key={trIdx} className="p-2 rounded bg-rose-50/70 border border-rose-100 text-[11px]">
                      <span className="font-semibold text-rose-800">{trap.option}: </span>
                      <span className="text-rose-700">{trap.trap}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="w-full mt-2 p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-2">
            <span className="font-semibold text-slate-800">{data.title || "Coach Tips"}</span>
            {Array.isArray(data.recommendations) && (
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                {data.recommendations.map((rec, rIdx) => (
                  <li key={rIdx}>{rec}</li>
                ))}
              </ul>
            )}
          </div>
        );
    }
  }
}
