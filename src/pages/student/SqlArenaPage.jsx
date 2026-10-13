import React, { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate } from "react-router-dom";
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
  RefreshCw,
  Lightbulb,
  Check,
  Copy,
  Layers,
  HelpCircle,
  Bot
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { codingPracticeAiService } from "../../services/codingPracticeAiService";
import { useScreenContext } from "../../context/ScreenContext";

// Lazy-load Monaco Editor
const CodeEditor = lazy(() => import("../../components/common/CodeEditor").then(m => ({ default: m.CodeEditor })));

export function SqlArenaPage() {
  const navigate = useNavigate();
  const { setScreenContext, openAssistantWithQuery } = useScreenContext();

  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [activeTableIndex, setActiveTableIndex] = useState(0);
  const [userQuery, setUserQuery] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [expandedHints, setExpandedHints] = useState({});

  // Generate Modal state
  const [showGenModal, setShowGenModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("JOINS");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Medium");

  const loadQuestion = async (topic = "JOINS", diff = "Medium") => {
    setLoading(true);
    setEvalResult(null);
    try {
      const q = await codingPracticeAiService.generateSqlQuestion({ topic, difficulty: diff });
      setQuestion(q);
      setUserQuery(q.starterQuery || "SELECT ");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestion();
  }, []);

  // Sync with AI Assistant Screen Context
  useEffect(() => {
    if (question) {
      setScreenContext({
        contextType: "PRACTICE_MCQ", // Or CODING_ARENA
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

  const handleGenerateFresh = async () => {
    setShowGenModal(false);
    setGenerating(true);
    try {
      await loadQuestion(selectedTopic, selectedDifficulty);
    } finally {
      setGenerating(false);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <h3 className="font-bold text-slate-800 text-base">Synthesizing SQL Schema with AI...</h3>
        <p className="text-xs text-slate-500 max-w-sm text-center">
          Building production database tables, generating seed records, and verifying test datasets.
        </p>
      </div>
    );
  }

  const activeTable = question?.tables?.[activeTableIndex] || null;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Top Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
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
              <h2 className="font-extrabold text-slate-900 text-base tracking-tight flex items-center gap-2">
                {question?.title || "SQL Practice Challenge"}
                <Badge variant={question?.difficulty === "Hard" ? "danger" : question?.difficulty === "Medium" ? "warning" : "success"} size="xs">
                  {question?.difficulty || "Medium"}
                </Badge>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {question?.topic || "JOINS"}
                </span>
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Sparkles}
            loading={generating}
            onClick={() => setShowGenModal(true)}
          >
            Generate Fresh (AI)
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Bot}
            onClick={() =>
              openAssistantWithQuery(
                `I am solving the SQL challenge: ${question?.title}. Give me progressive hints on how to join or query the schema tables without spoiling the solution.`,
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
          <Card className="p-4 border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <TableProperties className="w-4 h-4 text-indigo-600" />
              Recruiter Problem Scenario
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {question?.scenario}
            </p>

            <div className="pt-2 border-t border-slate-100">
              <h4 className="font-semibold text-slate-800 text-xs mb-1.5">Requirements:</h4>
              <ul className="space-y-1">
                {question?.requirements?.map((req, rIdx) => (
                  <li key={rIdx} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Database Schema & Tables Visualizer */}
          <Card className="p-4 border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                Live Schema Visualizer ({question?.tables?.length || 0} Tables)
              </h3>
            </div>

            {/* Table Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-100 pb-2 overflow-x-auto">
              {question?.tables?.map((table, tIdx) => (
                <button
                  key={tIdx}
                  onClick={() => setActiveTableIndex(tIdx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    activeTableIndex === tIdx
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {table.name}
                </button>
              ))}
            </div>

            {/* Active Table Data Grid */}
            {activeTable && (
              <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                      {activeTable.columns.map((col, cIdx) => (
                        <th key={cIdx} className="p-2 border-r border-slate-200 last:border-r-0">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTable.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors text-slate-600">
                        {row.map((val, vIdx) => (
                          <td key={vIdx} className="p-2 border-r border-slate-100 last:border-r-0 font-mono text-[11px]">
                            {val === null ? <span className="text-slate-300 italic">NULL</span> : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Progressive Hints Accordion */}
          {question?.hints?.length > 0 && (
            <Card className="p-3 border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Socratic Hints
              </span>
              {question.hints.map((hint, hIdx) => {
                const isExp = expandedHints[hIdx] !== false;
                return (
                  <div key={hIdx} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50 text-xs">
                    <button
                      onClick={() => toggleHint(hIdx)}
                      className="w-full px-2.5 py-1.5 flex items-center justify-between text-left font-medium text-slate-700 hover:bg-slate-100"
                    >
                      <span>Hint #{hint.level || hIdx + 1}</span>
                      {isExp ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                    {isExp && (
                      <div className="px-2.5 py-2 text-slate-600 bg-white border-t border-slate-100 leading-relaxed text-[11px]">
                        {hint.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          )}
        </div>

        {/* Right Column: Code Editor & Execution Results */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Editor Top Bar */}
            <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="font-mono text-slate-300 font-semibold">PostgreSQL / ANSI SQL</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyStarter}
                  className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copied" : "Copy Template"}</span>
                </button>
                <button
                  onClick={() => setUserQuery(question?.starterQuery || "SELECT ")}
                  className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors ml-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* SQL Code Editor */}
            <div className="h-[280px] bg-slate-950 font-mono text-xs">
              <Suspense
                fallback={
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    Loading Monaco Engine...
                  </div>
                }
              >
                <CodeEditor
                  language="sql"
                  value={userQuery}
                  onChange={(val) => setUserQuery(val || "")}
                />
              </Suspense>
            </div>

            {/* Run Button Bar */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Hit Run Query to test against relational schema fixtures.
              </span>
              <Button
                variant="primary"
                size="sm"
                icon={Play}
                loading={evaluating}
                onClick={handleRunQuery}
              >
                Run SQL Query
              </Button>
            </div>
          </Card>

          {/* Results Console */}
          <Card className="p-4 border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                Evaluation Output & Expected Grid
              </h3>
              {evalResult && (
                <Badge variant={evalResult.passed ? "success" : "danger"} size="xs">
                  {evalResult.status || (evalResult.passed ? "ACCEPTED" : "FAILED")}
                </Badge>
              )}
            </div>

            {evalResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  evalResult.passed
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
              >
                {evalResult.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{evalResult.message || (evalResult.passed ? "Query output matches schema criteria!" : "Syntax error or incorrect columns returned.")}</span>
              </div>
            )}

            {/* Expected Output Grid */}
            {question?.expectedOutput && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                  Expected Output Table
                </span>
                <div className="overflow-x-auto rounded-lg border border-slate-200 text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                        {question.expectedOutput.columns.map((col, idx) => (
                          <th key={idx} className="p-2 border-r border-slate-200 last:border-r-0">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {question.expectedOutput.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50 font-mono text-[11px]">
                          {row.map((val, vIdx) => (
                            <td key={vIdx} className="p-2 border-r border-slate-100 last:border-r-0">
                              {String(val)}
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
        </div>
      </div>

      {/* Generate Custom Challenge Modal */}
      {showGenModal && (
        <Modal
          isOpen={showGenModal}
          onClose={() => setShowGenModal(false)}
          title="Generate Custom SQL Challenge (AI)"
          subtitle="Generate tailored schema problems with Gemini Flash multi-key engine"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Target Topic:</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-800"
              >
                <option value="JOINS">Multi-Table JOINS (Inner, Left, Right)</option>
                <option value="AGGREGATIONS">GROUP BY, HAVING & Aggregations</option>
                <option value="WINDOW_FUNCTIONS">Window Functions (DENSE_RANK, ROW_NUMBER)</option>
                <option value="SUBQUERIES_CTES">CTEs & Subqueries</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Difficulty:</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 text-slate-800"
              >
                <option value="Easy">Easy (Single Table / Basic Join)</option>
                <option value="Medium">Medium (Campus Recruiter Standard)</option>
                <option value="Hard">Hard (Tier-1 FinTech / High Complexity)</option>
              </select>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowGenModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" icon={Sparkles} onClick={handleGenerateFresh}>
                Generate Challenge
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
