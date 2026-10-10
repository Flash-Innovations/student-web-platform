import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Brain,
  MessageSquare,
  ShieldAlert,
  Sliders,
  Check,
  Plus,
  X,
  Code,
  Users
} from "lucide-react";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { ProgressBar } from "../../components/common/ProgressBar";
import { useAuth } from "../../context/AuthContext";
import { studentService } from "../../services/studentService";
import { interviewService } from "../../services/interviewService";
import { useMockInterview } from "../../hooks/useMockInterview";
import { SkillSelector } from "../../components/common/SkillSelector";

export function MockInterviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Profile and Configuration State
  const [studentProfile, setStudentProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [configStatus, setConfigStatus] = useState({ isConfigured: true, message: "" });
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Setup Options
  const [interviewType, setInterviewType] = useState("Technical Interview"); // "Technical Interview" | "HR Interview"
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [activeTab, setActiveTab] = useState("simulator"); // simulator, history

  // Mock Interview Custom Hook
  const {
    session,
    status, // idle, connecting, speaking, listening, processing, evaluating, completed, error
    errorMessage,
    errorDetails,
    currentQuestionIndex,
    completedQuestionsCount,
    totalQuestions,
    aiTranscript,
    studentTranscript,
    conversationHistory,
    finalReport,
    isRecording,
    isMicMuted,
    micVolume,
    isFinalizing,
    startInterview,
    endInterview,
    startRecording,
    stopRecording,
    finishSpeaking,
    submitAnswer,
    toggleMute,
    resetInterview
  } = useMockInterview();

  // Load student profile & interview roles
  useEffect(() => {
    async function loadInitialData() {
      setLoadingProfile(true);
      try {
        const [profile, configRes] = await Promise.all([
          studentService.getCurrentStudent().catch(() => null),
          interviewService.checkConfigStatus().catch(() => ({ isConfigured: false }))
        ]);

        if (profile) {
          setStudentProfile(profile);
          const initialSkills = Array.isArray(profile.skills) && profile.skills.length > 0
            ? profile.skills.slice(0, 6)
            : ["JavaScript", "Data Structures", "Algorithms", "Web Development"];
          setSelectedSkills(initialSkills);
        }

        if (configRes) {
          setConfigStatus(configRes);
        }
      } catch (err) {
        console.error("Failed to load initial mock interview data:", err);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadInitialData();
  }, []);

  // Fetch student interview history
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await interviewService.getInterviewHistory();
      setInterviewHistory(history);
    } catch (err) {
      console.warn("Could not fetch interview history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history" || status === "completed") {
      fetchHistory();
    }
  }, [activeTab, status]);

  // Skill selection helpers
  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = (e) => {
    e.preventDefault();
    const trimmed = customSkillInput.trim();
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills((prev) => [...prev, trimmed]);
      setCustomSkillInput("");
    }
  };

  const removeSkill = (skill) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  // Start interview trigger
  const handleStart = () => {
    startInterview({
      interviewType,
      roleTitle: interviewType,
      candidateName: studentProfile?.name,
      course: studentProfile?.course,
      branch: studentProfile?.branch,
      selectedSkills: interviewType === "Technical Interview" ? selectedSkills : [],
      totalQuestions: questionCount
    });
  };

  // Status badge config
  const statusConfig = useMemo(() => {
    switch (status) {
      case "connecting":
        return { label: "Connecting to Gemini Live...", variant: "warning", color: "text-amber-600" };
      case "speaking":
        return { label: "AI Interviewer Speaking", variant: "primary", color: "text-indigo-600" };
      case "listening":
        return isRecording
          ? { label: "Recording Voice Answer...", variant: "success", color: "text-emerald-600" }
          : { label: "Ready to Speak", variant: "neutral", color: "text-slate-600" };
      case "processing":
        return { label: "Processing Answer...", variant: "warning", color: "text-amber-600" };
      case "evaluating":
        return { label: "Evaluating Response...", variant: "warning", color: "text-amber-600" };
      case "completed":
        return { label: "Interview Complete", variant: "success", color: "text-emerald-600" };
      case "error":
        return { label: "Connection Error", variant: "danger", color: "text-rose-600" };
      case "idle":
      default:
        return { label: "Ready to Start", variant: "neutral", color: "text-slate-600" };
    }
  }, [status, isRecording]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Mic className="w-8 h-8 text-indigo-600" />
            AI Mock Interview Simulator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time speech-to-speech technical and behavioral placement interviews powered by Google Gemini Live API.
          </p>
        </div>

        {/* Tab Switcher */}
        {status === "idle" && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setActiveTab("simulator")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "simulator"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Simulator Arena
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Past Interviews ({interviewHistory.length})
            </button>
          </div>
        )}
      </div>

      {/* Server Gemini API Key Alert if not configured */}
      {!configStatus.isConfigured && status === "idle" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-xs">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <div className="font-semibold text-amber-950">Gemini Live API Setup Required</div>
            <p className="text-amber-800 leading-relaxed">
              The server needs a valid Gemini API key to establish real-time voice streaming with Gemini Live models.
              Add <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-amber-900">GEMINI_API_KEY=your_gemini_api_key_here</code> to your <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-amber-900">AI-backend/.env</code> file and restart the AI backend server.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {status === "error" && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-2 flex-1">
            <div className="font-semibold text-rose-950">Interview Session Encountered an Issue</div>
            <p className="text-rose-800 leading-relaxed">{errorMessage}</p>
            {errorDetails === "TOKEN_EXPIRED" || errorDetails === "AUTH_REQUIRED" || errorDetails === "TOKEN_INVALID" || errorMessage?.toLowerCase().includes("token") || errorMessage?.toLowerCase().includes("signature") || errorMessage?.toLowerCase().includes("log in") ? (
              <div className="pt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="primary" onClick={() => {
                  try {
                    localStorage.removeItem("sips_token");
                  } catch (e) {}
                  navigate("/login");
                }}>
                  Log In to Student Account
                </Button>
                <Button size="sm" variant="outline" onClick={resetInterview} icon={RotateCcw}>
                  Back to Setup
                </Button>
              </div>
            ) : errorDetails === "GEMINI_NOT_CONFIGURED" ? (
              <>
                <p className="text-rose-700 text-xs">
                  Tip: Ensure <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> is set in <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">AI-backend/.env</code>.
                </p>
                <div className="pt-1">
                  <Button size="sm" variant="outline" onClick={resetInterview} icon={RotateCcw}>
                    Back to Interview Setup
                  </Button>
                </div>
              </>
            ) : errorMessage?.toLowerCase().includes("evaluation") || errorMessage?.toLowerCase().includes("report") || errorMessage?.toLowerCase().includes("finalize") ? (
              <div className="pt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="primary" onClick={endInterview} disabled={isFinalizing}>
                  {isFinalizing ? "Retrying..." : "Retry Generating Evaluation"}
                </Button>
                <Button size="sm" variant="outline" onClick={resetInterview} icon={RotateCcw}>
                  Back to Interview Setup
                </Button>
              </div>
            ) : (
              <div className="pt-1">
                <Button size="sm" variant="outline" onClick={resetInterview} icon={RotateCcw}>
                  Back to Interview Setup
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. SETUP STAGE                                          */}
      {/* ======================================================== */}
      {status === "idle" && activeTab === "simulator" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration Card */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border-slate-200/90 shadow-xs">
              <CardHeader
                title="Interview Configuration"
                subtitle="Select your interview format to begin your live speech-to-speech mock session."
                action={<Badge variant="primary">Speech-to-Speech</Badge>}
              />

              <div className="space-y-6">
                {/* Interview Type Selector */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-2">
                    Interview Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInterviewType("Technical Interview")}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between ${
                        interviewType === "Technical Interview"
                          ? "bg-indigo-50/70 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20"
                          : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Code className={`w-4 h-4 ${interviewType === "Technical Interview" ? "text-indigo-600" : "text-slate-400"}`} />
                          <span className={`text-sm font-bold ${interviewType === "Technical Interview" ? "text-indigo-900" : "text-slate-800"}`}>
                            Technical Interview
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Core data structures, algorithms, coding fundamentals, system architecture, and domain technical skills.
                        </p>
                      </div>
                      {interviewType === "Technical Interview" && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 ml-2" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setInterviewType("HR Interview")}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between ${
                        interviewType === "HR Interview"
                          ? "bg-indigo-50/70 border-indigo-500 shadow-xs ring-1 ring-indigo-500/20"
                          : "bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Users className={`w-4 h-4 ${interviewType === "HR Interview" ? "text-indigo-600" : "text-slate-400"}`} />
                          <span className={`text-sm font-bold ${interviewType === "HR Interview" ? "text-indigo-900" : "text-slate-800"}`}>
                            HR Interview
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Behavioral questions, cultural fit, teamwork, leadership scenarios (STAR method), ethics, and aspirations.
                        </p>
                      </div>
                      {interviewType === "HR Interview" && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 ml-2" />}
                    </button>
                  </div>
                </div>

                {/* Technical Skills Focus Selector (Only for Technical Interview) */}
                {interviewType === "Technical Interview" ? (
                  <div>
                    <SkillSelector
                      selectedSkills={selectedSkills}
                      onChange={setSelectedSkills}
                      maxSkills={12}
                      label="Technical Skills in Focus"
                      helperText="Focus technical interview questions on verified catalogue competencies"
                      placeholder="Search catalogue to add focus skills (e.g. React, Python, System Design)..."
                    />
                  </div>
                ) : (
                  /* HR Interview Info Callout (No skills asked) */
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs sm:text-sm flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-900">No skill selection required for HR Interview</div>
                      <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                        The AI interviewer will ask questions focused on behavioral competencies, teamwork, handling pressure, situational problem-solving, and culture fit.
                      </p>
                    </div>
                  </div>
                )}

                {/* Question Length */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                      Interview Length
                    </label>
                    <span className="text-xs font-medium text-slate-600">
                      {questionCount} Questions (~{questionCount * 2} minutes)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[3, 5, 7].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                          questionCount === num
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {num} Questions
                      </button>
                    ))}
                  </div>
                </div>

                {/* Start Action */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mic className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Microphone will be requested on start</span>
                  </div>
                  <Button
                    size="lg"
                    variant="primary"
                    icon={Play}
                    onClick={handleStart}
                    disabled={status === "connecting" || (interviewType === "Technical Interview" && selectedSkills.length === 0)}
                    className="w-full sm:w-auto px-8 font-semibold shadow-md"
                  >
                    {status === "connecting" ? "Connecting Session..." : "Start Mock Interview"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Candidate Profile Context & Tips Card */}
          <div className="space-y-6">
            <Card className="p-6 border-slate-200/90 shadow-xs">
              <CardHeader
                title="Candidate Snapshot"
                subtitle="Synchronized from university records"
              />

              {loadingProfile ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                </div>
              ) : (
                <div className="space-y-4 text-xs sm:text-sm text-slate-600">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                    <div className="text-slate-500 text-xs font-medium">Candidate Name</div>
                    <div className="text-slate-900 font-bold text-sm">
                      {studentProfile?.name || user?.name || "Student Candidate"}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                    <div className="text-slate-500 text-xs font-medium">Academic Program & Branch</div>
                    <div className="text-slate-900 font-medium">
                      {studentProfile?.course || user?.course || "B.Tech"} in {studentProfile?.branch || user?.branch || "Computer Science & Engineering"}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                    <div className="text-slate-500 text-xs font-medium">Readiness Benchmark</div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">Placement Score:</span>
                      <span className="text-indigo-600">{studentProfile?.readinessScore || 75}%</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6 border-slate-200/90 bg-slate-50/50">
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-bold text-sm">
                <Brain className="w-4 h-4 text-indigo-600" />
                Voice Interview Recommendations
              </div>
              <ul className="text-xs text-slate-600 space-y-2.5">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Wear headphones to prevent microphone audio echo and unintended interruptions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Structure behavioral answers with the <strong>STAR method</strong> (Situation, Task, Action, Result).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Explain the trade-offs and complexity for algorithms before jumping to code.</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. ACTIVE LIVE SPEECH-TO-SPEECH INTERVIEW ARENA          */}
      {/* ======================================================== */}
      {(status === "connecting" ||
        status === "speaking" ||
        status === "listening" ||
        status === "processing" ||
        status === "evaluating") && (
        <div className="space-y-6">
          {/* Active Status & Control Ribbon */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge variant={statusConfig.variant} size="lg" className="animate-pulse">
                {statusConfig.label}
              </Badge>
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                Question {currentQuestionIndex} of {totalQuestions}
                <span className="text-xs text-slate-500 font-normal ml-2">
                  ({completedQuestionsCount} completed)
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Mute Mic Button */}
              <Button
                variant={isMicMuted ? "danger" : "outline"}
                size="sm"
                icon={isMicMuted ? MicOff : Mic}
                onClick={toggleMute}
                disabled={isFinalizing}
              >
                {isMicMuted ? "Unmute Mic" : "Mute Mic"}
              </Button>

              {/* End Interview Button */}
              <Button
                variant="danger"
                size="sm"
                icon={Square}
                onClick={endInterview}
                disabled={isFinalizing || status === "evaluating"}
              >
                {isFinalizing ? "Generating Report..." : "End & Evaluate"}
              </Button>
            </div>
          </div>

          {/* Main Dual Stage View: AI Interviewer (Left) & Candidate Arena (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: AI Interviewer */}
            <Card className="p-6 border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/50 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shadow-indigo-200">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Gemini AI Placement Panel
                      </h3>
                      <p className="text-xs text-slate-500">Live Voice Interviewer • {session?.roleTitle || session?.interviewType || interviewType}</p>
                    </div>
                  </div>

                  {status === "speaking" && (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-4 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.1s]" />
                      <span className="w-1.5 h-6 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-8 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.3s]" />
                      <span className="w-1.5 h-5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.15s]" />
                    </div>
                  )}
                </div>

                {/* AI Spoken Audio & Transcript Box */}
                <div className="p-4 rounded-xl bg-white border border-indigo-100/90 shadow-xs space-y-2 mb-4 min-h-[140px]">
                  <div className="flex items-center justify-between text-xs font-semibold text-indigo-700">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-indigo-600" /> Interviewer Speech
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Streaming PCM 24kHz</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {aiTranscript || (status === "connecting" ? "Connecting to interviewer session..." : "Listening attentively...")}
                  </p>
                </div>
              </div>

              {/* Tips & Progress Bar */}
              <div className="pt-3 border-t border-slate-100">
                <ProgressBar
                  value={completedQuestionsCount}
                  max={totalQuestions}
                  label={`Session Trajectory: ${completedQuestionsCount} of ${totalQuestions} Questions Completed`}
                  variant="primary"
                  size="sm"
                />
              </div>
            </Card>

            {/* Right Card: Candidate Live Voice Workspace */}
            <Card className="p-6 border-slate-200/90 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Candidate Answer Workspace
                      </h3>
                      <p className="text-xs text-slate-500">Live Microphone Stream • 16kHz PCM</p>
                    </div>
                  </div>

                  {/* Mic Volume Level Bar */}
                  {isRecording && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-500">Vol:</span>
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-75"
                          style={{ width: `${Math.min(100, micVolume)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Candidate Speech Transcript Box */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 mb-4 min-h-[140px]">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600" /> Recognized Speech Transcript
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Realtime STT</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                    {studentTranscript ? (
                      `"${studentTranscript}"`
                    ) : isRecording ? (
                      <span className="text-emerald-600 font-medium">Recording in progress... Speak your answer clearly into your microphone, then click "Finish Speaking".</span>
                    ) : status === "listening" ? (
                      <span className="text-slate-500">Question presented. Formulate your thoughts and click "Start Speaking" below when you are ready.</span>
                    ) : status === "speaking" ? (
                      <span className="text-slate-400">Interviewer is speaking... Listening will be enabled after the question.</span>
                    ) : status === "evaluating" || status === "processing" ? (
                      <span className="text-amber-600">Evaluating your submitted response...</span>
                    ) : (
                      <span className="text-slate-400">Waiting for candidate turn...</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Functional Microphone Control Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isRecording
                        ? "bg-emerald-500 animate-ping"
                        : status === "speaking"
                        ? "bg-indigo-500"
                        : status === "evaluating" || status === "processing"
                        ? "bg-amber-500 animate-pulse"
                        : "bg-slate-300"
                    }`}
                  />
                  <span>
                    {isRecording
                      ? "Recording your voice — click 'Finish Speaking' to submit"
                      : status === "speaking"
                      ? "AI Interviewer speaking"
                      : status === "evaluating" || status === "processing"
                      ? "Evaluating response..."
                      : "Microphone idle — click 'Start Speaking' to begin answering"}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {status === "evaluating" || status === "processing" ? (
                    <Button size="md" variant="secondary" disabled className="w-full sm:w-auto opacity-75">
                      Evaluating Response...
                    </Button>
                  ) : status === "speaking" ? (
                    <Button size="md" variant="secondary" disabled icon={Volume2} className="w-full sm:w-auto opacity-75">
                      Interviewer Speaking...
                    </Button>
                  ) : isRecording ? (
                    <Button
                      size="md"
                      variant="primary"
                      icon={Check}
                      onClick={finishSpeaking || submitAnswer}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 font-semibold"
                    >
                      Finish Speaking & Submit
                    </Button>
                  ) : (
                    <Button
                      size="md"
                      variant="primary"
                      icon={Mic}
                      onClick={startRecording}
                      className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 font-semibold"
                    >
                      Start Speaking
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Conversation Progress History */}
          {conversationHistory.length > 0 && (
            <Card className="p-5 border-slate-200/90 shadow-xs">
              <h4 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" /> Previous Question Turns
              </h4>
              <div className="space-y-3">
                {conversationHistory.map((turn, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/60 text-xs sm:text-sm space-y-1.5"
                  >
                    <div className="font-semibold text-indigo-900">
                      Question {turn.questionIndex} Turn:
                    </div>
                    <div className="text-slate-800 font-medium">{turn.aiText}</div>
                    {turn.studentText && (
                      <div className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                        Candidate: "{turn.studentText}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. COMPLETED INTERVIEW REPORT                           */}
      {/* ======================================================== */}
      {status === "completed" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold mb-1 uppercase tracking-wider">
                <Award className="w-4 h-4 text-indigo-300" /> Placement Interview Intelligence Report
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Mock Interview Complete: {session?.roleTitle || session?.interviewType || interviewType}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200 mt-1">
                Evaluation generated from live conversational cadence, technical accuracy, and reasoning.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 text-center shrink-0">
              <div className="text-3xl font-black text-white">
                {finalReport?.overallScore || 85}
                <span className="text-sm font-semibold text-indigo-200">/100</span>
              </div>
              <div className="text-xs text-indigo-200 font-medium mt-0.5">Overall Readiness</div>
              <div className="text-[11px] text-indigo-300 font-normal mt-1 border-t border-white/10 pt-1">
                {completedQuestionsCount || finalReport?.totalQuestionsCompleted || totalQuestions} of {totalQuestions} Questions Completed
              </div>
            </div>
          </div>

          {/* Detailed Score & Feedback Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Strengths & Weaknesses */}
            <Card className="p-6 lg:col-span-2 border-slate-200/90 shadow-xs space-y-6">
              <div>
                <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Primary Candidate Strengths
                </h3>
                <div className="space-y-2.5">
                  {(finalReport?.strengths || [
                    "Articulated foundational core concepts with clarity and confidence.",
                    "Demonstrated structured logic when discussing solution trade-offs."
                  ]).map((strength, i) => (
                    <div key={i} className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs sm:text-sm text-emerald-900 flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" /> Areas for Improvement & Gaps
                </h3>
                <div className="space-y-2.5">
                  {(finalReport?.weaknesses || [
                    "Could elaborate more on edge case analysis and asymptotic performance bounds.",
                    "Remember to state quantifiable outcomes when describing past project challenges."
                  ]).map((weakness, i) => (
                    <div key={i} className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-xs sm:text-sm text-amber-900 flex items-start gap-2.5">
                      <ChevronRight className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{weakness}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {finalReport?.recommendations && (
                <div>
                  <h3 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" /> Actionable Placement Recommendations
                  </h3>
                  <div className="space-y-2.5">
                    {finalReport.recommendations.map((rec, i) => (
                      <div key={i} className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs sm:text-sm text-indigo-950 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Performance Rubric & Next Steps */}
            <div className="space-y-6">
              <Card className="p-6 border-slate-200/90 shadow-xs space-y-4">
                <CardHeader title="Evaluation Breakdown" />
                <div className="space-y-3.5">
                  <ProgressBar
                    label="Technical Core Competence"
                    value={finalReport?.technicalScore || 88}
                    max={100}
                    variant="primary"
                  />
                  <ProgressBar
                    label="Problem-Solving & Depth"
                    value={finalReport?.problemSolvingScore || 82}
                    max={100}
                    variant="emerald"
                  />
                  <ProgressBar
                    label="Communication & STAR Cadence"
                    value={finalReport?.communicationScore || 85}
                    max={100}
                    variant="purple"
                  />
                </div>
              </Card>

              <Card className="p-6 border-slate-200/90 shadow-xs space-y-3 text-center">
                <h4 className="font-bold text-slate-900 text-sm">Ready for Another Round?</h4>
                <p className="text-xs text-slate-500">
                  Practicing multiple sessions improves technical speech cadence and STAR structuring.
                </p>
                <div className="pt-2 flex flex-col gap-2">
                  <Button variant="primary" icon={RotateCcw} onClick={resetInterview}>
                    Start New Interview Session
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/student/dashboard")}>
                    Back to Dashboard
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. PAST INTERVIEW HISTORY TAB                            */}
      {/* ======================================================== */}
      {status === "idle" && activeTab === "history" && (
        <Card className="p-6 border-slate-200/90 shadow-xs">
          <CardHeader
            title="Interview History"
            subtitle="Previous speech-to-speech mock interview sessions and evaluations."
          />

          {loadingHistory ? (
            <div className="p-12 text-center text-slate-400">Loading interview records...</div>
          ) : interviewHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Mic className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm">No mock interviews completed yet.</p>
              <Button size="sm" variant="primary" onClick={() => setActiveTab("simulator")}>
                Start Your First Session
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {interviewHistory.map((item) => (
                <div
                  key={item._id}
                  className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {item.roleTitle || "Software Engineer"}
                      </span>
                      <Badge variant="primary" size="sm">
                        {item.status || "COMPLETED"}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-3">
                      <span>{new Date(item.createdAt || item.startedAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{item.questions?.length || item.totalQuestionsTarget || 5} questions answered</span>
                    </div>
                    {item.skills && item.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.skills.map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-600 font-medium"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-lg font-black text-indigo-600">
                        {item.summary?.overallScore || 80}/100
                      </div>
                      <div className="text-[11px] text-slate-400">Readiness Score</div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedHistoryItem(item)}
                    >
                      View Report
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* History Detail Modal */}
      {selectedHistoryItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {selectedHistoryItem.roleTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  Completed on {new Date(selectedHistoryItem.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedHistoryItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 text-center">
              <div className="text-3xl font-black text-indigo-700">
                {selectedHistoryItem.summary?.overallScore || 85}/100
              </div>
              <div className="text-xs text-indigo-900 font-medium mt-1">
                {selectedHistoryItem.summary?.feedbackText || "Solid overall interview performance."}
              </div>
            </div>

            {selectedHistoryItem.summary?.strengths && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-2">Strengths:</h4>
                <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                  {selectedHistoryItem.summary.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedHistoryItem.summary?.weaknesses && (
              <div>
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-2">Areas for Improvement:</h4>
                <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                  {selectedHistoryItem.summary.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedHistoryItem(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
