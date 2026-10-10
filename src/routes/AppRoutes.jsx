import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { DashboardLayout } from "../components/layout/DashboardLayout";

// Helper for dynamic named imports with React.lazy
const lazyNamed = (importFn, name) =>
  lazy(() => importFn().then((module) => ({ default: module[name] })));

// Eagerly loaded public entry pages for instant first paint
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";

// Lazy-loaded Public Pages
const PublicStudentProfilePage = lazyNamed(() => import("../pages/public/PublicStudentProfilePage"), "PublicStudentProfilePage");
const PrivacyPolicyPage = lazyNamed(() => import("../pages/legal/PrivacyPolicyPage"), "PrivacyPolicyPage");
const TermsOfServicePage = lazyNamed(() => import("../pages/legal/TermsOfServicePage"), "TermsOfServicePage");
const DataSecurityPage = lazyNamed(() => import("../pages/legal/DataSecurityPage"), "DataSecurityPage");

// Lazy-loaded Student Core & Career Hub
const StudentDashboard = lazyNamed(() => import("../pages/student/StudentDashboard"), "StudentDashboard");
const StudentProfilePage = lazyNamed(() => import("../pages/student/StudentProfilePage"), "StudentProfilePage");
const StudentJobsPage = lazyNamed(() => import("../pages/student/StudentJobsPage"), "StudentJobsPage");
const ResumeAnalysisPage = lazyNamed(() => import("../pages/student/ResumeAnalysisPage"), "ResumeAnalysisPage");
const SkillGapPage = lazyNamed(() => import("../pages/student/SkillGapPage"), "SkillGapPage");
const PlacementReadinessPage = lazyNamed(() => import("../pages/student/PlacementReadinessPage"), "PlacementReadinessPage");
const MockInterviewPage = lazyNamed(() => import("../pages/student/MockInterviewPage"), "MockInterviewPage");
const BehavioralTasksPage = lazyNamed(() => import("../pages/student/BehavioralTasksPage"), "BehavioralTasksPage");
const StarTrackerPage = lazyNamed(() => import("../pages/student/StarTrackerPage"), "StarTrackerPage");
const PeerMatchingPage = lazyNamed(() => import("../pages/student/PeerMatchingPage"), "PeerMatchingPage");
const RecommendationsPage = lazyNamed(() => import("../pages/student/RecommendationsPage"), "RecommendationsPage");

// Lazy-loaded Practice Arena
const PracticeHubPage = lazyNamed(() => import("../pages/student/PracticeHubPage"), "PracticeHubPage");
const PracticeHistoryPage = lazyNamed(() => import("../pages/student/PracticeHistoryPage"), "PracticeHistoryPage");
const PracticeSessionPage = lazyNamed(() => import("../pages/student/PracticeSessionPage"), "PracticeSessionPage");
const PracticeResultPage = lazyNamed(() => import("../pages/student/PracticeResultPage"), "PracticeResultPage");
const CodingQuestionListPage = lazyNamed(() => import("../pages/student/CodingQuestionListPage"), "CodingQuestionListPage");
const CodingArenaPage = lazyNamed(() => import("../pages/student/CodingArenaPage"), "CodingArenaPage");

// Lazy-loaded Timed Contests
const ContestListPage = lazyNamed(() => import("../pages/student/ContestListPage"), "ContestListPage");
const ContestDetailsPage = lazyNamed(() => import("../pages/student/ContestDetailsPage"), "ContestDetailsPage");
const ContestWorkspacePage = lazyNamed(() => import("../pages/student/ContestWorkspacePage"), "ContestWorkspacePage");
const ContestResultPage = lazyNamed(() => import("../pages/student/ContestResultPage"), "ContestResultPage");
const ContestLeaderboardPage = lazyNamed(() => import("../pages/student/ContestLeaderboardPage"), "ContestLeaderboardPage");

// Lazy-loaded Campus Assessments
const StudentAssessmentListPage = lazyNamed(() => import("../pages/student/StudentAssessmentListPage"), "StudentAssessmentListPage");
const StudentAssessmentDetailsPage = lazyNamed(() => import("../pages/student/StudentAssessmentDetailsPage"), "StudentAssessmentDetailsPage");
const StudentAssessmentWorkspacePage = lazyNamed(() => import("../pages/student/StudentAssessmentWorkspacePage"), "StudentAssessmentWorkspacePage");
const StudentAssessmentResultPage = lazyNamed(() => import("../pages/student/StudentAssessmentResultPage"), "StudentAssessmentResultPage");

import { PageSkeleton } from "../components/common/LoadingSkeleton";

function RouteLoadingFallback() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageSkeleton />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Public Entry - Direct Student Login */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<LoginPage />} />
        <Route path="/onboard" element={<LoginPage />} />

        {/* Marketing & Legal Pages */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/security" element={<DataSecurityPage />} />

        {/* Direct shortcuts & aliases */}
        <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/students" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/students/dashboard" element={<Navigate to="/student/dashboard" replace />} />

        {/* Public Shareable Student Career Profile */}
        <Route path="/u/:username" element={<PublicStudentProfilePage />} />

        {/* Dedicated Student Portal Routes */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
            <Route path="/student/jobs" element={<StudentJobsPage />} />
            <Route path="/student/resume" element={<ResumeAnalysisPage />} />
            <Route path="/student/skills" element={<SkillGapPage />} />
            <Route path="/student/skill-analysis" element={<SkillGapPage />} />
            <Route path="/student/readiness" element={<PlacementReadinessPage />} />
            <Route path="/student/placement-readiness" element={<PlacementReadinessPage />} />
            <Route path="/student/interview" element={<MockInterviewPage />} />
            <Route path="/student/mock-interview" element={<MockInterviewPage />} />
            <Route path="/student/tasks" element={<BehavioralTasksPage />} />
            <Route path="/student/behavioral-tasks" element={<BehavioralTasksPage />} />
            <Route path="/student/star" element={<StarTrackerPage />} />
            <Route path="/student/star-tracker" element={<StarTrackerPage />} />
            <Route path="/student/peers" element={<PeerMatchingPage />} />
            <Route path="/student/peer-matching" element={<PeerMatchingPage />} />
            <Route path="/student/recommendations" element={<RecommendationsPage />} />

            {/* Practice Arena */}
            <Route path="/student/practice" element={<PracticeHubPage />} />
            <Route path="/student/practice/history" element={<PracticeHistoryPage />} />
            <Route path="/student/practice/coding" element={<CodingQuestionListPage />} />
            <Route path="/student/practice/coding/:attemptId" element={<CodingArenaPage />} />
            <Route path="/student/practice/attempt/:attemptId" element={<PracticeSessionPage />} />
            <Route path="/student/practice/attempt/:attemptId/result" element={<PracticeResultPage />} />

            {/* Timed Placement Contests */}
            <Route path="/student/contests" element={<ContestListPage />} />
            <Route path="/student/contests/:contestId" element={<ContestDetailsPage />} />
            <Route path="/student/contests/:contestId/leaderboard" element={<ContestLeaderboardPage />} />
            <Route path="/student/contests/:contestId/attempt/:attemptId" element={<ContestWorkspacePage />} />
            <Route path="/student/contests/:contestId/attempt/:attemptId/result" element={<ContestResultPage />} />
            <Route path="/student/contests/:contestId/result/:attemptId" element={<ContestResultPage />} />

            {/* Campus Assessments */}
            <Route path="/student/assessments" element={<StudentAssessmentListPage />} />
            <Route path="/student/assessments/:assessmentId" element={<StudentAssessmentDetailsPage />} />
            <Route path="/student/assessments/:assessmentId/attempt/:attemptId" element={<StudentAssessmentWorkspacePage />} />
            <Route path="/student/assessments/:assessmentId/result/:attemptId" element={<StudentAssessmentResultPage />} />
            <Route path="/student/assessments/:assessmentId/attempt/:attemptId/result" element={<StudentAssessmentResultPage />} />
          </Route>
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
