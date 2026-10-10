import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  X,
  Check,
  ChevronDown,
  Layers,
  Sparkles,
  AlertCircle,
  Tag
} from "lucide-react";
import {
  SKILL_CATALOGUE,
  SKILL_CATEGORIES,
  findCatalogueSkill,
  getCanonicalSkillName
} from "../../data/skillCatalogue";
import { Badge } from "./Badge";
import { cn } from "../../utils/cn";

export function SkillSelector({
  selectedSkills = [],
  onChange,
  maxSkills = 50,
  disabled = false,
  placeholder = "Search skills by name, framework, alias (e.g. React, Python, AWS)...",
  label,
  helperText,
  className = ""
}) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter skills based on query and selected category
  const filteredSkills = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cleanQ = q.replace(/[^a-z0-9]/g, "");

    let list = SKILL_CATALOGUE;
    if (selectedCategory && selectedCategory !== "All Categories") {
      list = list.filter((s) => s.category === selectedCategory);
    }

    if (!q) {
      // If no query, return the first 60 skills for the selected category
      return list.slice(0, 60);
    }

    // Rank matching skills
    const matches = [];
    for (const skill of list) {
      const nameLower = skill.name.toLowerCase();
      const idLower = skill.id.toLowerCase();
      const cleanName = nameLower.replace(/[^a-z0-9]/g, "");

      let score = 0;
      if (nameLower === q || idLower === q) {
        score = 100;
      } else if (nameLower.startsWith(q) || idLower.startsWith(q)) {
        score = 80;
      } else if (skill.aliases && skill.aliases.some((a) => a === q)) {
        score = 75;
      } else if (skill.aliases && skill.aliases.some((a) => a.startsWith(q))) {
        score = 60;
      } else if (nameLower.includes(q)) {
        score = 50;
      } else if (cleanQ && cleanName.includes(cleanQ)) {
        score = 40;
      } else if (skill.aliases && skill.aliases.some((a) => a.includes(q))) {
        score = 30;
      } else if (skill.category.toLowerCase().includes(q)) {
        score = 20;
      }

      if (score > 0) {
        matches.push({ skill, score });
      }
    }

    matches.sort((a, b) => b.score - a.score || a.skill.name.localeCompare(b.skill.name));
    return matches.slice(0, 80).map((m) => m.skill);
  }, [query, selectedCategory]);

  // Reset highlight index when filtered list changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredSkills]);

  // Normalization map of currently selected skills to detect duplicates
  const selectedKeySet = useMemo(() => {
    const set = new Set();
    (selectedSkills || []).forEach((s) => {
      const canonical = findCatalogueSkill(s);
      if (canonical) {
        set.add(canonical.id);
      } else {
        set.add(String(s).trim().toLowerCase());
      }
    });
    return set;
  }, [selectedSkills]);

  const handleSelectSkill = (skill) => {
    if (disabled) return;
    if (selectedKeySet.has(skill.id)) {
      // Already selected; remove it
      handleRemoveSkill(skill.name);
      return;
    }

    if (selectedSkills.length >= maxSkills) {
      return;
    }

    const nextSkills = [...selectedSkills, skill.name];
    onChange?.(nextSkills);
    setQuery("");
    inputRef.current?.focus();
  };

  const handleRemoveSkill = (skillToRemove) => {
    if (disabled) return;
    const targetMatch = findCatalogueSkill(skillToRemove);
    const targetId = targetMatch ? targetMatch.id : skillToRemove.trim().toLowerCase();

    const nextSkills = selectedSkills.filter((s) => {
      const curMatch = findCatalogueSkill(s);
      const curId = curMatch ? curMatch.id : s.trim().toLowerCase();
      return curId !== targetId;
    });

    onChange?.(nextSkills);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) => (prev + 1 < filteredSkills.length ? prev + 1 : prev));
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      // CRITICAL: Pressing enter selects from the filtered list only. It does NOT add arbitrary text.
      if (isOpen && filteredSkills.length > 0 && highlightedIndex < filteredSkills.length) {
        handleSelectSkill(filteredSkills[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)} ref={containerRef}>
      {/* Optional Label and Limit Header */}
      {(label || helperText) && (
        <div className="flex items-center justify-between">
          <div>
            {label && <label className="block text-xs sm:text-sm font-semibold text-slate-800">{label}</label>}
            {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
          </div>
          <span className="text-xs font-medium text-slate-500">
            {selectedSkills.length} / {maxSkills} selected
          </span>
        </div>
      )}

      {/* Selected Skills Chips Display */}
      {selectedSkills && selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 min-h-[46px]">
          {selectedSkills.map((skillName, index) => {
            const catalogueMatch = findCatalogueSkill(skillName);
            const displayName = catalogueMatch ? catalogueMatch.name : skillName;
            const categoryName = catalogueMatch ? catalogueMatch.category : "Custom / Legacy";

            return (
              <span
                key={`${displayName}-${index}`}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs",
                  catalogueMatch
                    ? "bg-white text-slate-800 border border-slate-200/90 hover:border-slate-300"
                    : "bg-amber-50 text-amber-900 border border-amber-200"
                )}
              >
                <Tag className="w-3 h-3 text-indigo-500 shrink-0" />
                <span className="font-semibold">{displayName}</span>
                <span className="text-[10px] text-slate-400 max-w-[120px] truncate" title={categoryName}>
                  • {categoryName.split("&")[0].trim()}
                </span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skillName)}
                    className="ml-1 text-slate-400 hover:text-rose-600 focus:outline-hidden transition-colors cursor-pointer"
                    title={`Remove ${displayName}`}
                    aria-label={`Remove ${displayName}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Input & Category Controls */}
      {!disabled && (
        <div className="space-y-2 relative">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Category Dropdown Filter */}
            <div className="sm:w-64 shrink-0 relative">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setIsOpen(true);
                }}
                className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer truncate appearance-none"
                aria-label="Filter catalogue by category"
              >
                <option value="All Categories">All Categories (30 Domains)</option>
                {SKILL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <Layers className="w-3.5 h-3.5 text-indigo-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Search Input Box */}
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (!isOpen) setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                aria-label="Search predefined skill catalogue"
                aria-expanded={isOpen}
                aria-autocomplete="list"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  aria-label="Clear search input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Catalogue Options Dropdown */}
          {isOpen && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              {/* Dropdown status header */}
              <div className="p-2.5 bg-slate-50/90 flex items-center justify-between text-xs text-slate-500 sticky top-0 z-10 border-b border-slate-200/70 backdrop-blur-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Predefined Skill Catalogue ({filteredSkills.length} options)
                </span>
                <span className="text-[11px] text-slate-400">Click or press Enter to add</span>
              </div>

              {filteredSkills.length > 0 ? (
                <div className="py-1">
                  {filteredSkills.map((skill, index) => {
                    const isSelected = selectedKeySet.has(skill.id);
                    const isHighlighted = highlightedIndex === index;

                    return (
                      <div
                        key={skill.id}
                        onClick={() => handleSelectSkill(skill)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={cn(
                          "px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors text-xs sm:text-sm",
                          isHighlighted && "bg-indigo-50/70 text-indigo-900",
                          isSelected && "bg-slate-50 text-slate-500 hover:bg-slate-100"
                        )}
                      >
                        <div className="flex flex-col gap-0.5 min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className={cn("font-semibold", isSelected ? "text-slate-600" : "text-slate-900")}>
                              {skill.name}
                            </span>
                            {skill.type === "language" && (
                              <Badge variant="blue" size="sm">
                                Language
                              </Badge>
                            )}
                            {skill.type === "non-technical" && (
                              <Badge variant="purple" size="sm">
                                Professional
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 truncate">
                            {skill.category}
                            {skill.aliases && skill.aliases.length > 1 && (
                              <span className="text-slate-300 ml-1.5">
                                • aka: {skill.aliases.slice(0, 3).join(", ")}
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Check className="w-3 h-3" /> Selected
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium group-hover:text-indigo-600">
                              + Add
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-800">
                    No matching skills in catalogue
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    "{query}" does not match any predefined technical or non-technical skills.
                    Only skills from the approved central catalogue can be added.
                  </p>
                  {selectedCategory !== "All Categories" && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("All Categories")}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline mt-2 inline-block cursor-pointer"
                    >
                      Search across All 30 Categories
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
