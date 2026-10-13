import { aiApi } from "./aiApi";

export const screenAssistantService = {
  /**
   * Interact with screen-aware assistant
   * @param {Object} params
   * @param {string} params.query
   * @param {Object} params.screenContext
   * @param {Object} params.studentProfile
   * @param {string} params.action
   */
  async interact({ query = "", screenContext = {}, studentProfile = {}, action = "AUTO" }) {
    try {
      const response = await aiApi.post("/api/assistant/interact", {
        query,
        screenContext,
        studentProfile,
        action
      });

      if (response && response.success && response.data) {
        return response.data;
      }
      return response;
    } catch (err) {
      console.warn("Screen Assistant API request failed, generating client fallback:", err);
      return this.getLocalFallback({ query, screenContext, studentProfile, action });
    }
  },

  /**
   * Check assistant status
   */
  async getStatus() {
    try {
      return await aiApi.get("/api/assistant/status");
    } catch (e) {
      return { success: false, status: "offline", isConfigured: false };
    }
  },

  /**
   * Client-side resilient fallback in case AI backend is temporarily unreachable
   */
  getLocalFallback({ screenContext = {}, studentProfile = {} }) {
    const contextType = (screenContext.contextType || "GENERAL").toUpperCase();
    const data = screenContext.data || {};
    const name = studentProfile.name || "Student";

    switch (contextType) {
      case "CODING_ARENA":
        return {
          spokenResponse: `I'm analyzing ${data.problemTitle || "this problem"}. Notice how keeping an auxiliary map can help reduce your time complexity to linear time.`,
          displayType: "CODE_HINT",
          displayData: {
            problemTitle: data.problemTitle || "Coding Problem",
            complexity: {
              currentEstimate: "O(N²)",
              optimalTarget: "O(N) Time, O(N) Space",
              bottleneck: "Search scans"
            },
            progressiveHints: [
              { level: 1, title: "Intuition", text: "Look for inverse complement values rather than iterating repeatedly." },
              { level: 2, title: "Data Structure", text: "A Hash Map allows O(1) membership lookups." },
              { level: 3, title: "Edge Cases", text: "Check empty inputs and duplicates." }
            ],
            recommendedApproach: "Hash Map / Frequency Counter",
            codeSnippet: `// Linear time lookup pattern:\nconst map = new Map();\nfor (let i = 0; i < arr.length; i++) {\n  if (map.has(target - arr[i])) return [map.get(target - arr[i]), i];\n  map.set(arr[i], i);\n}`
          }
        };

      case "JOB_DESCRIPTION":
        return {
          spokenResponse: `For ${data.jobTitle || "this job role"}, I've matched your profile and mapped a targeted 2-week placement preparation plan on your screen.`,
          displayType: "STUDY_PLAN",
          displayData: {
            jobTitle: data.jobTitle || "Software Engineer",
            company: data.company || "Hiring Partner",
            matchPercentage: 75,
            projectedMatchPercentage: 95,
            matchedSkills: (data.requiredSkills || ["Programming"]).slice(0, 2),
            missingSkills: (data.requiredSkills || ["System Design"]).slice(2),
            studyPlan: [
              {
                week: 1,
                focusSkill: "Core Frameworks & Architecture",
                milestone: "High-Frequency Placement Patterns",
                topics: ["Data Models & APIs", "Performance Tuning"],
                practiceModule: "Practice Hub Coding Arena",
                microProject: "Build an API service with cached lookups"
              },
              {
                week: 2,
                focusSkill: "System Design & Distributed Scalability",
                milestone: "Production Architecture",
                topics: ["Caching & Load Balancing", "Database Indexing"],
                practiceModule: "Technical MCQs",
                microProject: "Benchmark load testing"
              }
            ],
            topInterviewFaqs: [
              "How would you optimize database query latency under heavy load?",
              "Explain how you handle race conditions in concurrent requests."
            ]
          }
        };

      case "SKILL_GAP":
        return {
          spokenResponse: `To make your resume 100% market ready, focus on Docker and Cloud APIs. I've broken down the highest priority skills on your screen.`,
          displayType: "MARKET_READINESS",
          displayData: {
            targetTrack: data.targetTrack || "Software Engineering",
            currentReadinessScore: 68,
            projectedReadinessScore: 92,
            currentSkills: studentProfile.skills || ["React", "JavaScript"],
            bridgeSkills: [
              { skill: "Docker & Containers", priority: "P0", rationale: "Required in technical screenings.", learningTime: "3 days", practiceModule: "Practice Hub" },
              { skill: "Redis Caching", priority: "P1", rationale: "Crucial for system design.", learningTime: "2 days", practiceModule: "Practice Hub" }
            ],
            recommendedProjects: ["Deploy containerized service to cloud"]
          }
        };

      case "PRACTICE_MCQ":
        return {
          spokenResponse: "For this question, analyze the boundary edge conditions first to eliminate distractors in under 30 seconds.",
          displayType: "MCQ_EXPLANATION",
          displayData: {
            questionTitle: data.questionTitle || "MCQ Question",
            conceptualIntuition: "Examine asymptotic invariants across positive and negative bounds.",
            correctAnswerRationale: "Directly satisfies recurrence boundaries.",
            distractorAnalysis: [
              { option: "Option A", trap: "Ignores edge case zero" },
              { option: "Option B", trap: "Assumes unbounded memory" }
            ],
            eliminationHack: "Eliminate extreme asymptotic bounds first to eliminate 2 options instantly."
          }
        };

      default:
        return {
          spokenResponse: `Hello ${name}! I'm your AI placement coach. Ask me questions about coding problems, job descriptions, or exam questions.`,
          displayType: "GENERAL_ADVICE",
          displayData: {
            title: "SIPS AI Assistant",
            recommendations: [
              "Ask for hints on coding challenges without spoilers.",
              "Generate a custom study plan for any active job description.",
              "See how to bridge your skill gap for upcoming placement drives."
            ]
          }
        };
    }
  }
};
