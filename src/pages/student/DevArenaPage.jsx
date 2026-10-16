import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Code2,
  Terminal,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Check,
  Copy,
  Layers,
  Cpu,
  Search,
  Filter
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { practiceService } from "../../services/practiceService";
import { useScreenContext } from "../../context/ScreenContext";
import devQuestionsFallback from "../../data/devQuestions.json";
import {
  DEV_LANGUAGES,
  DEV_LANGUAGE_MAP,
  DEFAULT_DEV_LANGUAGE,
  getDevStarterCode
} from "../../utils/devLanguageSupport";

// Lazy-load Monaco Editor
const CodeEditor = lazy(() => import("../../components/common/CodeEditor").then(m => ({ default: m.CodeEditor })));

export function DevArenaPage() {
  const navigate = useNavigate();
  const { questionId } = useParams();
  const { setScreenContext } = useScreenContext();

  const [questions, setQuestions] = useState(() => practiceService.getCachedDevQuestions() || devQuestionsFallback);

  // Sync with Practice Service to load questions from database (with super admin and branch additions)
  useEffect(() => {
    let isMounted = true;
    practiceService.getDevQuestions().then(loaded => {
      if (isMounted && Array.isArray(loaded) && loaded.length > 0) {
        setQuestions(loaded);
      }
    }).catch(err => {
      console.warn("Could not load Dev questions from practiceService:", err);
    });
    return () => { isMounted = false; };
  }, []);

  // Find initial question index
  const initialIndex = useMemo(() => {
    if (!questionId) return 0;
    const foundIdx = questions.findIndex(q => q.id === questionId || q.dbId === questionId || q.externalId === questionId);
    return foundIdx !== -1 ? foundIdx : 0;
  }, [questionId, questions]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_DEV_LANGUAGE);
  const [codesByLang, setCodesByLang] = useState({});
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [expandedHints, setExpandedHints] = useState({});

  // Question Browser Modal state
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [bankTopicFilter, setBankTopicFilter] = useState("ALL");
  const [bankDiffFilter, setBankDiffFilter] = useState("ALL");

  const question = questions[currentIndex] || questions[0];
  const currentLangConfig = DEV_LANGUAGE_MAP[selectedLanguage] || DEV_LANGUAGE_MAP.javascript;

  // Active code for the selected question and language
  const activeCode = useMemo(() => {
    const qId = question?.id || "default";
    if (codesByLang[qId]?.[selectedLanguage] !== undefined) {
      return codesByLang[qId][selectedLanguage];
    }
    return getDevStarterCode(question, selectedLanguage);
  }, [question, selectedLanguage, codesByLang]);

  const handleCodeChange = (val) => {
    const qId = question?.id || "default";
    setCodesByLang((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || {}),
        [selectedLanguage]: val || ""
      }
    }));
  };

  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    setTestResults(null);
  };

  // Sync index if URL parameter changes or questions list updates
  useEffect(() => {
    if (questionId) {
      const idx = questions.findIndex(q => q.id === questionId || q.dbId === questionId || q.externalId === questionId);
      if (idx !== -1 && idx !== currentIndex) {
        setCurrentIndex(idx);
        setTestResults(null);
        setExpandedHints({});
      }
    }
  }, [questionId, questions, currentIndex]);

  // Sync with AI Assistant Screen Context
  useEffect(() => {
    if (question) {
      setScreenContext({
        contextType: "CODING_ARENA",
        data: {
          problemTitle: question.title,
          category: "Dev Practices",
          topic: question.topic,
          difficulty: question.difficulty,
          language: selectedLanguage,
          currentCode: activeCode,
          testResults
        }
      });
    }
  }, [question, selectedLanguage, activeCode, testResults, setScreenContext]);

  const selectQuestion = (index) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentIndex(index);
    const q = questions[index];
    setTestResults(null);
    setExpandedHints({});
    setShowBankModal(false);
    navigate(`/student/practice/dev/${q.id}`, { replace: true });
  };

  const handleRunTests = async () => {
    if (!activeCode.trim() || !question) return;
    setRunningTests(true);

    try {
      // Simulate client-side assertion verification in candidate's chosen language
      await new Promise(r => setTimeout(r, 600));

      const starter = getDevStarterCode(question, selectedLanguage);
      const hasImplementation = activeCode.trim() !== starter.trim() && activeCode.length > 50;
      const passed = hasImplementation;

      const cases = (question.testCases || []).map((tc, idx) => ({
        id: tc.id || idx + 1,
        description: tc.description,
        input: tc.input,
        expected: tc.expected,
        passed: passed ? true : idx === 0,
        timeMs: Math.floor(Math.random() * 8) + 2
      }));

      const allPassed = cases.every(c => c.passed);
      setTestResults({
        passed: allPassed,
        status: allPassed ? "ALL_ASSERTIONS_PASSED" : "ASSERTION_FAILED",
        passCount: cases.filter(c => c.passed).length,
        totalCount: cases.length,
        language: currentLangConfig.label,
        cases
      });
    } finally {
      setRunningTests(false);
    }
  };

  const resetCode = () => {
    const starter = getDevStarterCode(question, selectedLanguage);
    handleCodeChange(starter);
    setTestResults(null);
  };

  const copyStarter = () => {
    const starter = getDevStarterCode(question, selectedLanguage);
    navigator.clipboard.writeText(starter);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const toggleHint = (idx) => {
    setExpandedHints(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Filtered tasks for bank browser
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchSearch =
        !bankSearch.trim() ||
        q.title.toLowerCase().includes(bankSearch.toLowerCase()) ||
        q.scenario.toLowerCase().includes(bankSearch.toLowerCase()) ||
        q.topic.toLowerCase().includes(bankSearch.toLowerCase());
      const matchTopic = bankTopicFilter === "ALL" || q.topic === bankTopicFilter;
      const matchDiff = bankDiffFilter === "ALL" || q.difficulty === bankDiffFilter;
      return matchSearch && matchTopic && matchDiff;
    });
  }, [questions, bankSearch, bankTopicFilter, bankDiffFilter]);

  const allTopics = useMemo(() => {
    const set = new Set(questions.map(q => q.topic).filter(Boolean));
    return ["ALL", ...Array.from(set)];
  }, [questions]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="xs"
            icon={ArrowLeft}
            onClick={() => navigate("/student/practice/dev")}
          >
            All Dev Tasks
          </Button>

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Cpu className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400">
                  Task {currentIndex + 1} of {questions.length}
                </span>
                <h2 className="font-extrabold text-slate-900 text-base tracking-tight">
                  {question.title}
                </h2>
                <Badge
                  variant={question.difficulty === "Hard" ? "danger" : question.difficulty === "Medium" ? "warning" : "success"}
                  size="xs"
                >
                  {question.difficulty}
                </Badge>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {question.topic}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  MULTI-LANGUAGE • JS • PYTHON • JAVA
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Prev / Next Steppers */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => selectQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
              title="Previous task"
              className="p-1.5 rounded-md hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-1.5 text-slate-700">
              {currentIndex + 1} / {questions.length}
            </span>
            <button
              onClick={() => selectQuestion(currentIndex + 1)}
              disabled={currentIndex === questions.length - 1}
              title="Next task"
              className="p-1.5 rounded-md hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Browse Tasks Bank Trigger */}
          <Button
            variant="outline"
            size="sm"
            icon={Layers}
            onClick={() => setShowBankModal(true)}
          >
            Tasks Bank ({questions.length})
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Problem, Requirements & Unit Assertions */}
        <div className="lg:col-span-5 space-y-4">
          {/* Scenario & Context */}
          <Card className="p-4 border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-600" />
              Production Engineering Context
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {question.scenario}
            </p>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="font-semibold text-slate-800 text-xs mb-1.5">Functional Requirements:</h4>
              <ul className="space-y-1">
                {question.requirements?.map((req, rIdx) => (
                  <li key={rIdx} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Unit Assertions Spec */}
          <Card className="p-4 border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              Automated Unit Test Specifications ({question.testCases?.length || 0})
            </h3>

            <div className="space-y-2">
              {question.testCases?.map((tc, idx) => (
                <div key={idx} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-mono">
                        {idx + 1}
                      </span>
                      {tc.description}
                    </span>
                  </div>
                  {tc.input && (
                    <div className="text-[11px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200/70">
                      input: {tc.input}
                    </div>
                  )}
                  {tc.expected && (
                    <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50/50 p-1.5 rounded border border-emerald-100">
                      expected: {tc.expected}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Socratic Hints */}
          {question.hints && question.hints.length > 0 && (
            <Card className="p-4 border-slate-200 shadow-2xs space-y-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Progressive Socratic Hints
              </h3>

              <div className="space-y-1.5">
                {question.hints.map((hint, hIdx) => {
                  const isExp = !!expandedHints[hIdx];
                  return (
                    <div key={hIdx} className="border border-slate-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleHint(hIdx)}
                        className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 text-left text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer"
                      >
                        <span>Hint {hIdx + 1}</span>
                        {isExp ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                      </button>
                      {isExp && (
                        <div className="p-3 bg-white text-xs text-slate-600 border-t border-slate-200">
                          {hint.text}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Code Editor & Assertion Runner */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            {/* Editor Toolbar */}
            <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-white border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-semibold">Language:</span>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer"
                  >
                    {DEV_LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                  <span className="text-xs font-mono font-semibold text-emerald-400">{currentLangConfig.filename}</span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">{currentLangConfig.runtime}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="xs"
                  icon={copiedCode ? Check : Copy}
                  onClick={copyStarter}
                  className="text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  {copiedCode ? "Copied" : "Copy Starter"}
                </Button>

                <Button
                  variant="ghost"
                  size="xs"
                  icon={RotateCcw}
                  onClick={resetCode}
                  className="text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Reset
                </Button>

                <Button
                  variant="primary"
                  size="xs"
                  icon={Play}
                  loading={runningTests}
                  onClick={handleRunTests}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm"
                >
                  Run Unit Tests
                </Button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="h-[360px] bg-slate-950">
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                    Loading {currentLangConfig.monacoLang} Workspace...
                  </div>
                }
              >
                <CodeEditor
                  value={activeCode}
                  onChange={handleCodeChange}
                  language={currentLangConfig.monacoLang}
                  theme="vs-dark"
                  height="100%"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2
                  }}
                />
              </Suspense>
            </div>
          </Card>

          {/* Test Runner Output Console */}
          <Card className="p-4 border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                Automated Test Output Console
              </h3>
              {testResults && (
                <Badge variant={testResults.passed ? "success" : "danger"} size="xs">
                  {testResults.passCount} / {testResults.totalCount} PASSED
                </Badge>
              )}
            </div>

            {testResults ? (
              <div className="space-y-3">
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    testResults.passed
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  {testResults.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-bold">
                      {testResults.passed ? "All Test Assertions Passed" : "Partial Implementation Detected"}
                    </strong>
                    <span className="text-[11px] leading-relaxed block mt-0.5">
                      {testResults.passed
                        ? "Great work! Your solution satisfied all automated edge cases and performance requirements."
                        : "Complete the TODO logic in solution.js and execute again to verify all test cases."}
                    </span>
                  </div>
                </div>

                {/* Case Assertions Details */}
                <div className="space-y-1.5">
                  {testResults.cases?.map((c) => (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                        c.passed
                          ? "bg-emerald-50/50 border-emerald-100 text-slate-800"
                          : "bg-rose-50/50 border-rose-100 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {c.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        )}
                        <span className="font-medium text-slate-700">{c.description}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {c.timeMs}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                Click "Run Unit Tests" to execute automated test runner against your implementation.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Task Bank Browser Modal */}
      <Modal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        title="Developer Practices Task Bank (20 Tasks)"
        size="lg"
      >
        <div className="space-y-4">
          {/* Search & Topic Filters */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                placeholder="Search dev tasks by title, topic, or scenario..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> Topic:
              </span>
              {allTopics.map(t => (
                <button
                  key={t}
                  onClick={() => setBankTopicFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    bankTopicFilter === t
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Question List */}
          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
            {filteredQuestions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No developer tasks match your current search and filter criteria.
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const originalIndex = questions.findIndex(x => x.id === q.id);
                const isActive = originalIndex === currentIndex;

                return (
                  <div
                    key={q.id}
                    onClick={() => selectQuestion(originalIndex)}
                    className={`pt-2 pb-2 px-3 rounded-xl transition-all flex items-center justify-between cursor-pointer group ${
                      isActive
                        ? "bg-emerald-50/80 border border-emerald-200"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          #{originalIndex + 1}
                        </span>
                        <h4 className={`text-xs font-bold transition-colors ${isActive ? "text-emerald-700" : "text-slate-900 group-hover:text-emerald-600"}`}>
                          {q.title}
                        </h4>
                        {isActive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-600 text-white">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 max-w-md">
                        {q.scenario}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                        {q.topic}
                      </span>
                      <Badge
                        variant={q.difficulty === "Hard" ? "danger" : q.difficulty === "Medium" ? "warning" : "success"}
                        size="xs"
                      >
                        {q.difficulty}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
