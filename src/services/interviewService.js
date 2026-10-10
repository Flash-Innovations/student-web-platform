import { aiApi } from "./aiApi";
import { interviewRoles } from "../data/mockInterviews";

export const interviewService = {
  /**
   * Returns supported target interview roles
   */
  async getRoles() {
    return interviewRoles;
  },

  /**
   * Check if Gemini API is configured on server
   */
  async checkConfigStatus() {
    try {
      const res = await aiApi.get('/api/interviews/config-status');
      return res;
    } catch (err) {
      return {
        success: false,
        isConfigured: false,
        message: err.message || 'Could not verify server AI configuration.'
      };
    }
  },

  /**
   * Initialize a new personalized mock interview session
   */
  async createSession({
    interviewType = 'Technical Interview',
    roleTitle,
    candidateName,
    course,
    branch,
    selectedSkills = [],
    totalQuestions = 5
  }) {
    const res = await aiApi.post('/api/interviews/session', {
      interviewType,
      roleTitle: roleTitle || interviewType,
      candidateName,
      course,
      branch,
      selectedSkills: interviewType === 'HR Interview' ? [] : selectedSkills,
      totalQuestions
    });
    return res;
  },

  /**
   * Fetch historical interview records for the student
   */
  async getInterviewHistory() {
    try {
      const res = await aiApi.get('/api/interviews/history');
      return res?.interviews || [];
    } catch (err) {
      console.warn('Failed to fetch interview history:', err.message);
      return [];
    }
  },

  /**
   * Fetch specific interview record by ID
   */
  async getInterviewById(id) {
    const res = await aiApi.get(`/api/interviews/${id}`);
    return res?.interview || null;
  },

  /**
   * Explicitly finish an active session and get persisted evaluation
   */
  async finishSession(sessionId) {
    const res = await aiApi.post(`/api/interviews/session/${sessionId}/finish`);
    return res?.interview || null;
  }
};
