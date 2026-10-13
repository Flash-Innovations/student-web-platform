import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Database,
  Search,
  Filter,
  ArrowLeft,
  Play,
  TableProperties,
  Layers,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Terminal,
  Code2
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { practiceService } from "../../services/practiceService";
import sqlQuestionsFallback from "../../data/sqlQuestions.json";

export function SqlQuestionListPage() {
  const navigate = useNavigate();

  // Instant SWR cache hydration - 0ms perceived lag
  const [questions, setQuestions] = useState(() => practiceService.getCachedSqlQuestions() || sqlQuestionsFallback);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("ALL");
  const [selectedTopic, setSelectedTopic] = useState("ALL");

  useEffect(() => {
    let isMounted = true;
    practiceService.getSqlQuestions().then((loaded) => {
      if (isMounted && Array.isArray(loaded) && loaded.length > 0) {
        setQuestions(loaded);
      }
    }).catch((err) => {
      console.warn("Could not load SQL questions from service:", err);
    });
    return () => { isMounted = false; };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await practiceService.getSqlQuestions({}, { forceRefresh: true });
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
    const easy = questions.filter((q) => (q.difficulty || "").toLowerCase() === "easy").length;
    const medium = questions.filter((q) => (q.difficulty || "").toLowerCase() === "medium").length;
    const hard = questions.filter((q) => (q.difficulty || "").toLowerCase() === "hard").length;
    return { total, easy, medium, hard };
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        !searchQuery.trim() ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.tables && q.tables.some((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesDiff =
        selectedDifficulty === "ALL" ||
        (q.difficulty || "").toUpperCase() === selectedDifficulty.toUpperCase();

      const matchesTopic =
        selectedTopic === "ALL" || q.topic === selectedTopic;

      return matchesSearch && matchesDiff && matchesTopic;
    });
  }, [questions, searchQuery, selectedDifficulty, selectedTopic]);

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
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Database className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              SQL Arena Question Bank
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
      <div className="bg-linear-to-r from-slate-900 via-purple-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Interactive Relational Query Challenges
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            SQL Practice Arena
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Select an interview challenge below to inspect live relational schemas, analyze table structures, and run production SQL queries with real-time result set diffs.
          </p>

          <div className="flex items-center gap-4 pt-2 flex-wrap text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Easy: <strong>{stats.easy}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Medium: <strong>{stats.medium}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Hard: <strong>{stats.hard}</strong></span>
            </div>
            <div className="text-slate-400">
              Total: <strong>{stats.total} Challenges</strong>
            </div>
          </div>
        </div>

        <Database className="absolute -right-6 -bottom-6 w-48 h-48 text-white/5 pointer-events-none" />
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="p-4 border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by challenge title, table name, or query scenario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Difficulty Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-500"
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
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {/* Question Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
          <span>Showing {filteredQuestions.length} SQL Challenges</span>
        </div>

        {filteredQuestions.length === 0 ? (
          <Card className="p-12 text-center border-slate-200 space-y-3">
            <Database className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">No SQL challenges match your filter</h3>
            <p className="text-xs text-slate-400">Try adjusting your search keywords or topic filters.</p>
            <Button
              variant="outline"
              size="xs"
              onClick={() => { setSearchQuery(""); setSelectedDifficulty("ALL"); setSelectedTopic("ALL"); }}
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuestions.map((q, idx) => {
              const diffLower = (q.difficulty || "").toLowerCase();
              const diffVariant = diffLower === "hard" ? "danger" : diffLower === "medium" ? "warning" : "success";

              return (
                <Card
                  key={q.id || idx}
                  className="p-5 border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                          {q.topic || "SQL"}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-700 transition-colors mt-1.5">
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

                    {/* Table schema tags */}
                    {q.tables && q.tables.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <TableProperties className="w-3 h-3" /> Tables:
                        </span>
                        {q.tables.map((t, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {q.requirements?.length || 0} Requirements
                    </span>

                    <Button
                      variant="primary"
                      size="xs"
                      icon={Play}
                      onClick={() => navigate(`/student/practice/sql/${q.id}`)}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-xs"
                    >
                      Solve Challenge
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
