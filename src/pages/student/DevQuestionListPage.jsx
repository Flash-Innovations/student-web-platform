import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Terminal,
  Search,
  Filter,
  ArrowLeft,
  Play,
  Layers,
  Sparkles,
  RefreshCw,
  Cpu,
  Code2,
  CheckCircle2
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { practiceService } from "../../services/practiceService";
import devQuestionsFallback from "../../data/devQuestions.json";

export function DevQuestionListPage() {
  const navigate = useNavigate();

  // Instant SWR cache hydration - 0ms perceived lag
  const [questions, setQuestions] = useState(() => practiceService.getCachedDevQuestions() || devQuestionsFallback);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStack, setSelectedStack] = useState("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedTopic, setSelectedTopic] = useState("ALL");

  useEffect(() => {
    let isMounted = true;
    practiceService.getDevQuestions().then((loaded) => {
      if (isMounted && Array.isArray(loaded) && loaded.length > 0) {
        setQuestions(loaded);
      }
    }).catch((err) => {
      console.warn("Could not load Dev questions from service:", err);
    });
    return () => { isMounted = false; };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await practiceService.getDevQuestions({}, { forceRefresh: true });
      if (Array.isArray(refreshed) && refreshed.length > 0) {
        setQuestions(refreshed);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const topicsList = useMemo(() => {
    const set = new Set(questions.map((q) => q.topic).filter(Boolean));
    return ["ALL", ...Array.from(set)];
  }, [questions]);

  const stats = useMemo(() => {
    const total = questions.length;
    const nodeCount = questions.filter((q) => !q.stack || q.stack.toLowerCase().includes("js") || q.stack.toLowerCase().includes("node")).length;
    const springCount = questions.filter((q) => (q.stack || "").toLowerCase().includes("spring") || (q.stack || "").toLowerCase().includes("java")).length;
    const fastApiCount = questions.filter((q) => (q.stack || "").toLowerCase().includes("fastapi") || (q.stack || "").toLowerCase().includes("python")).length;
    const easy = questions.filter((q) => (q.difficulty || "").toLowerCase() === "easy").length;
    const medium = questions.filter((q) => (q.difficulty || "").toLowerCase() === "medium").length;
    const hard = questions.filter((q) => (q.difficulty || "").toLowerCase() === "hard").length;
    return { total, nodeCount, springCount, fastApiCount, easy, medium, hard };
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const stack = (q.stack || "").toLowerCase();
      const matchesStack =
        selectedStack === "ALL" ||
        (selectedStack === "NODE" && (stack.includes("javascript") || stack.includes("node") || !q.stack)) ||
        (selectedStack === "SPRINGBOOT" && (stack.includes("spring") || stack.includes("java"))) ||
        (selectedStack === "FASTAPI" && (stack.includes("fastapi") || stack.includes("python")));

      const matchesSearch =
        !searchQuery.trim() ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.requirements && q.requirements.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesDiff =
        selectedDifficulty === "ALL" ||
        (q.difficulty || "").toUpperCase() === selectedDifficulty.toUpperCase();

      const matchesTopic =
        selectedTopic === "ALL" || q.topic === selectedTopic;

      return matchesStack && matchesSearch && matchesDiff && matchesTopic;
    });
  }, [questions, searchQuery, selectedStack, selectedDifficulty, selectedTopic]);

  const getStackBadge = (stackStr) => {
    const s = (stackStr || "").toLowerCase();
    if (s.includes("spring") || s.includes("java")) {
      return {
        label: "Spring Boot (Java 17+)",
        className: "bg-purple-50 text-purple-700 border-purple-200"
      };
    }
    if (s.includes("fastapi") || s.includes("python")) {
      return {
        label: "FastAPI (Python 3.11+)",
        className: "bg-sky-50 text-sky-700 border-sky-200"
      };
    }
    return {
      label: "Node.js (ES6+)",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200"
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Actions */}
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
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Terminal className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Developer Engineering Tasks Bank
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="xs"
          icon={RefreshCw}
          loading={isRefreshing}
          onClick={handleRefresh}
        >
          Refresh Bank
        </Button>
      </div>

      {/* Hero Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xs">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Full-Stack & Backend Systems Engineering
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dev Practices Arena
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Solve real-world engineering challenges across <strong>Node.js</strong>, <strong>Spring Boot (Java)</strong>, and <strong>FastAPI (Python)</strong>. Implement rate limiters, token filters, async worker pools, and caching tiers with automated unit assertions.
          </p>

          <div className="flex items-center gap-4 pt-2 flex-wrap text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Node.js: <strong>{stats.nodeCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span>Spring Boot: <strong>{stats.springCount}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span>FastAPI: <strong>{stats.fastApiCount}</strong></span>
            </div>
            <div className="text-slate-400 border-l border-slate-700 pl-4">
              Total: <strong>{stats.total} Production Tasks</strong>
            </div>
          </div>
        </div>

        <Terminal className="absolute -right-6 -bottom-6 w-48 h-48 text-white/5 pointer-events-none" />
      </div>

      {/* Stack Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setSelectedStack("ALL")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            selectedStack === "ALL"
              ? "bg-slate-900 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-950 hover:bg-slate-100"
          }`}
        >
          All Stacks ({stats.total})
        </button>
        <button
          onClick={() => setSelectedStack("NODE")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedStack === "NODE"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-slate-600 hover:text-emerald-700 hover:bg-emerald-50"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Node.js ({stats.nodeCount})
        </button>
        <button
          onClick={() => setSelectedStack("SPRINGBOOT")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedStack === "SPRINGBOOT"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-600 hover:text-purple-700 hover:bg-purple-50"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Spring Boot / Java ({stats.springCount})
        </button>
        <button
          onClick={() => setSelectedStack("FASTAPI")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            selectedStack === "FASTAPI"
              ? "bg-sky-600 text-white shadow-xs"
              : "text-slate-600 hover:text-sky-700 hover:bg-sky-50"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          FastAPI / Python ({stats.fastApiCount})
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-4 border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by task title, engineering scenario, or requirement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Difficulty Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
        </div>

        {/* Topic Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3 h-3" /> Topics:
          </span>
          {topicsList.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedTopic === t
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {/* Task Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span>Showing {filteredQuestions.length} Engineering Tasks</span>
        </div>

        {filteredQuestions.length === 0 ? (
          <Card className="p-12 text-center border-slate-200 space-y-3">
            <Terminal className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No engineering tasks match your filter</h3>
            <p className="text-xs text-slate-400">Try adjusting your search keywords, stack tabs, or difficulty filters.</p>
            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                setSearchQuery("");
                setSelectedStack("ALL");
                setSelectedDifficulty("ALL");
                setSelectedTopic("ALL");
              }}
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuestions.map((q, idx) => {
              const diffLower = (q.difficulty || "").toLowerCase();
              const diffVariant = diffLower === "hard" ? "danger" : diffLower === "medium" ? "warning" : "success";
              const stackBadge = getStackBadge(q.stack);

              return (
                <Card
                  key={q.id || idx}
                  className="p-5 border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${stackBadge.className}`}>
                            {stackBadge.label}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {q.topic || "ENGINEERING"}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mt-2">
                          {q.title}
                        </h3>
                      </div>
                      <Badge variant={diffVariant} size="xs">
                        {q.difficulty}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {q.scenario}
                    </p>

                    {/* Requirements Preview */}
                    {q.requirements && q.requirements.length > 0 && (
                      <div className="pt-1">
                        <div className="text-[11px] text-slate-500 line-clamp-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{q.requirements[0]}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                      <span>{q.requirements?.length || 0} Requirements</span>
                      <span>•</span>
                      <span>{q.testCases?.length || 0} Unit Tests</span>
                    </div>

                    <Button
                      variant="primary"
                      size="xs"
                      icon={Play}
                      onClick={() => navigate(`/student/practice/dev/${q.id}`)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                    >
                      Start Task
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
