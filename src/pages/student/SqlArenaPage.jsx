import React, { useState, useEffect, useMemo, Suspense, lazy } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Database,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TableProperties,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Check,
  Copy,
  Layers,
  Search,
  Filter,
  Bot
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { codingPracticeAiService } from "../../services/codingPracticeAiService";
import { practiceService } from "../../services/practiceService";
import { useScreenContext } from "../../context/ScreenContext";
import sqlQuestionsFallback from "../../data/sqlQuestions.json";

// Lazy-load Monaco Editor
const CodeEditor = lazy(() => import("../../components/common/CodeEditor").then(m => ({ default: m.CodeEditor })));

export function SqlArenaPage() {
  const navigate = useNavigate();
  const { questionId } = useParams();
  const { setScreenContext, openAssistantWithQuery } = useScreenContext();

  const [questions, setQuestions] = useState(() => practiceService.getCachedSqlQuestions() || sqlQuestionsFallback);

  // Sync with Practice Service to load questions from database (with super admin and branch additions)
  useEffect(() => {
    let isMounted = true;
    practiceService.getSqlQuestions().then(loaded => {
      if (isMounted && Array.isArray(loaded) && loaded.length > 0) {
        setQuestions(loaded);
      }
    }).catch(err => {
      console.warn("Could not load SQL questions from practiceService:", err);
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
  const [activeTableIndex, setActiveTableIndex] = useState(0);
  const [userQuery, setUserQuery] = useState(() => questions[initialIndex]?.starterQuery || "SELECT ");
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [expandedHints, setExpandedHints] = useState({});

  // Question Browser Modal state
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [bankTopicFilter, setBankTopicFilter] = useState("ALL");
  const [bankDiffFilter, setBankDiffFilter] = useState("ALL");

  const question = questions[currentIndex] || questions[0];

  // Sync index if URL parameter changes or questions list updates
  useEffect(() => {
    if (questionId) {
      const idx = questions.findIndex(q => q.id === questionId || q.dbId === questionId || q.externalId === questionId);
      if (idx !== -1 && idx !== currentIndex) {
        setCurrentIndex(idx);
        setUserQuery(questions[idx].starterQuery || "SELECT ");
        setEvalResult(null);
        setActiveTableIndex(0);
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
          category: "SQL Practice",
          topic: question.topic,
          difficulty: question.difficulty,
          scenario: question.scenario,
          tables: question.tables,
          currentCode: userQuery
        }
      });
    }
  }, [question, userQuery, setScreenContext]);

  const selectQuestion = (index) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentIndex(index);
    const q = questions[index];
    setUserQuery(q.starterQuery || "SELECT ");
    setEvalResult(null);
    setActiveTableIndex(0);
    setExpandedHints({});
    setShowBankModal(false);
    navigate(`/student/practice/sql/${q.id}`, { replace: true });
  };

  const handleRunQuery = async () => {
    if (!userQuery.trim() || !question) return;
    setEvaluating(true);
    try {
      const result = await codingPracticeAiService.evaluateSqlQuery({
        query: userQuery,
        expectedSolution: question.solutionQuery,
        tables: question.tables
      });
      setEvalResult(result);
    } catch (e) {
      setEvalResult({ passed: false, status: "ERROR", message: e.message || "Failed to evaluate query." });
    } finally {
      setEvaluating(false);
    }
  };

  const resetQuery = () => {
    if (question?.starterQuery) {
      setUserQuery(question.starterQuery);
      setEvalResult(null);
    }
  };

  const copyStarter = () => {
    if (question?.starterQuery) {
      navigator.clipboard.writeText(question.starterQuery);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const toggleHint = (idx) => {
    setExpandedHints(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Filtered questions for bank browser
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

  const activeTable = question?.tables?.[activeTableIndex] || null;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Top Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="xs"
            icon={ArrowLeft}
            onClick={() => navigate("/student/practice")}
          >
            Practice Hub
          </Button>

          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Database className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400">
                  Question {currentIndex + 1} of {questions.length}
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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {question.topic}
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
              title="Previous question"
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
              title="Next question"
              className="p-1.5 rounded-md hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Browse Question Bank Modal Trigger */}
          <Button
            variant="outline"
            size="sm"
            icon={Layers}
            onClick={() => setShowBankModal(true)}
          >
            Question Bank ({questions.length})
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Bot}
            onClick={() =>
              openAssistantWithQuery(
                `I am solving the SQL challenge: "${question.title}" (${question.topic}). Scenario: ${question.scenario}. Give me progressive hints on how to join or query the tables without giving away the full solution.`,
                "HINT"
              )
            }
          >
            Ask AI Assistant
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Problem & Table Visualizer */}
        <div className="lg:col-span-5 space-y-4">
          {/* Scenario & Requirements */}
          <Card className="p-4 border-slate-200 shadow-2xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <TableProperties className="w-4 h-4 text-indigo-600" />
              Recruiter Problem Scenario
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {question.scenario}
            </p>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="font-semibold text-slate-800 text-xs mb-1.5">Requirements:</h4>
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

          {/* Database Schema & Tables Visualizer */}
          <Card className="p-4 border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                Live Schema Visualizer ({question.tables?.length || 0} Tables)
              </h3>
            </div>

            {/* Table Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-100 pb-2 overflow-x-auto">
              {question.tables?.map((table, tIdx) => (
                <button
                  key={tIdx}
                  onClick={() => setActiveTableIndex(tIdx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeTableIndex === tIdx
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {table.name}
                </button>
              ))}
            </div>

            {/* Active Table Viewer */}
            {activeTable && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 flex items-center justify-between">
                  <span>Table: <strong className="text-slate-800">{activeTable.name}</strong></span>
                  <span>{activeTable.rows?.length || 0} sample rows</span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        {activeTable.columns?.map((col, cIdx) => (
                          <th key={cIdx} className="px-3 py-2 border-r border-slate-200 last:border-r-0">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {activeTable.rows?.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                          {row.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-3 py-1.5 border-r border-slate-100 last:border-r-0 whitespace-nowrap">
                              {cell !== null && cell !== undefined ? String(cell) : <span className="text-slate-400 italic">null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Card>

          {/* Progressive Hints */}
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

        {/* Right Column: Code Editor & Query Console */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 shadow-2xs overflow-hidden">
            {/* Editor Toolbar */}
            <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-indigo-400">query.sql</span>
                <span className="text-[10px] text-slate-400">PostgreSQL / MySQL Dialect</span>
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
                  onClick={resetQuery}
                  className="text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  Reset
                </Button>

                <Button
                  variant="primary"
                  size="xs"
                  icon={Play}
                  loading={evaluating}
                  onClick={handleRunQuery}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-sm"
                >
                  Execute Query
                </Button>
              </div>
            </div>

            {/* Monaco SQL Editor */}
            <div className="h-[360px] bg-slate-950">
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                    Loading SQL Code Studio...
                  </div>
                }
              >
                <CodeEditor
                  value={userQuery}
                  onChange={(val) => setUserQuery(val || "")}
                  language="sql"
                  theme="vs-dark"
                  height="100%"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: "on"
                  }}
                />
              </Suspense>
            </div>
          </Card>

          {/* Results Console */}
          <Card className="p-4 border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-indigo-600" />
                Query Execution Console
              </h3>
              {evalResult && (
                <Badge variant={evalResult.passed ? "success" : "danger"} size="xs">
                  {evalResult.passed ? "QUERY PASSED" : "TEST FAILED"}
                </Badge>
              )}
            </div>

            {evalResult ? (
              <div className="space-y-3">
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    evalResult.passed
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                  }`}
                >
                  {evalResult.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-bold">
                      {evalResult.passed ? "All Test Assertions Passed" : "Query Execution Mismatch"}
                    </strong>
                    <span className="text-[11px] leading-relaxed block mt-0.5">
                      {evalResult.message || (evalResult.passed ? "Returned dataset matches expected output." : "Query results differed from expected solution dataset.")}
                    </span>
                  </div>
                </div>

                {/* Expected Output Table Preview */}
                {question.expectedOutput && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-600">Expected Result Set:</span>
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                          <tr>
                            {question.expectedOutput.columns?.map((col, idx) => (
                              <th key={idx} className="px-3 py-1.5 border-r border-slate-200 last:border-r-0">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                          {question.expectedOutput.rows?.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-3 py-1.5 border-r border-slate-100 last:border-r-0">
                                  {cell !== null && cell !== undefined ? String(cell) : "null"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                Run query to compile SQL against schema tables and inspect diff output.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Question Bank Browser Modal */}
      <Modal
        isOpen={showBankModal}
        onClose={() => setShowBankModal(false)}
        title="SQL Practice Question Bank (20 Problems)"
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
                placeholder="Search SQL problems by title, topic, or scenario..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                      ? "bg-indigo-600 text-white shadow-xs"
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
                No SQL problems match your current search and filter criteria.
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
                        ? "bg-indigo-50/80 border border-indigo-200"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          #{originalIndex + 1}
                        </span>
                        <h4 className={`text-xs font-bold transition-colors ${isActive ? "text-indigo-700" : "text-slate-900 group-hover:text-indigo-600"}`}>
                          {q.title}
                        </h4>
                        {isActive && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-600 text-white">
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
