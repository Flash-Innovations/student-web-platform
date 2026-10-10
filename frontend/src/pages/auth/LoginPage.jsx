import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Lock,
  Mail,
  GraduationCap,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  Info
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Button } from "../../components/common/Button";
import { Modal } from "../../components/common/Modal";

export function LoginPage() {
  const { studentLogin, isAuthenticated } = useAuth();
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();
  const navigate = useNavigate();

  // If already authenticated as student, navigate straight to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/student/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Student Sign In states
  const [studentId, setStudentId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentRemember, setStudentRemember] = useState(true);
  const [studentErrors, setStudentErrors] = useState({});

  // Forgot Password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // Student Sign In Submit
  const handleStudentSignInSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const trimmedId = studentId.trim();

    if (!trimmedId) {
      newErrors.identifier = "Please enter your institutional email or Roll No / USN.";
    } else if (trimmedId.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedId)) {
        newErrors.identifier = "Please enter a valid email address.";
      }
    }

    if (!studentPassword) {
      newErrors.password = "Please enter your password.";
    }

    if (Object.keys(newErrors).length > 0) {
      setStudentErrors(newErrors);
      showWarning("Email/ID and password are required.");
      return;
    }

    setStudentErrors({});
    setLoading(true);
    try {
      const result = await studentLogin(trimmedId, studentPassword);
      showSuccess(`Welcome back, ${result.user?.name || "Student"}!`);
      navigate("/student/dashboard");
    } catch (err) {
      const msg = err.message || "Invalid email or password.";
      setStudentErrors({ general: msg });
      setStudentPassword("");
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handler
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showWarning("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      showError("Please enter a valid email address.");
      return;
    }

    setResetSent(true);
    setTimeout(() => {
      showInfo("Password reset instructions sent to " + forgotEmail.trim());
      setForgotModalOpen(false);
      setResetSent(false);
      setForgotEmail("");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <img
            src="/branding/sips-logo-full.png"
            alt="SIPS - Skill Intelligence Placement System"
            className="h-16 w-auto max-w-[280px] sm:max-w-[320px] object-contain cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-600 max-w-sm mx-auto">
          AI-powered career intelligence & placement arena for students and candidates.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Main Student Auth Card */}
        <div className="bg-white py-7 px-6 sm:px-8 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Student Portal Sign In</h2>
              <p className="text-[11px] text-slate-500">Access your practice arena, contests, and campus drives</p>
            </div>
          </div>

          <form onSubmit={handleStudentSignInSubmit} className="space-y-4" noValidate>
            {studentErrors.general && (
              <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{studentErrors.general}</span>
              </div>
            )}

            <div className="flex items-start gap-2 p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100/80 text-xs text-indigo-900 leading-snug">
              <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Sign in with your registered college email or institutional <strong>Roll No / USN</strong>.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student Email or Roll No / USN *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    if (studentErrors.identifier || studentErrors.general) {
                      setStudentErrors((prev) => ({ ...prev, identifier: "", general: "" }));
                    }
                  }}
                  placeholder="e.g. 1RV21CS001 or student@rvce.edu"
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    studentErrors.identifier
                      ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                      : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                  } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                />
              </div>
              {studentErrors.identifier && (
                <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {studentErrors.identifier}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showStudentPassword ? "text" : "password"}
                  required
                  disabled={loading}
                  value={studentPassword}
                  onChange={(e) => {
                    setStudentPassword(e.target.value);
                    if (studentErrors.password || studentErrors.general) {
                      setStudentErrors((prev) => ({ ...prev, password: "", general: "" }));
                    }
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                    studentErrors.password
                      ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                      : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                  } ${loading ? "opacity-60 bg-slate-50 cursor-not-allowed" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowStudentPassword(!showStudentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                  aria-label={showStudentPassword ? "Hide password" : "Show password"}
                >
                  {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {studentErrors.password && (
                <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {studentErrors.password}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={studentRemember}
                  disabled={loading}
                  onChange={(e) => setStudentRemember(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                Remember session
              </label>
              <button
                type="button"
                disabled={loading}
                onClick={() => setForgotModalOpen(true)}
                className="font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={loading}
              className="w-full py-2.5 mt-1 bg-indigo-600 hover:bg-indigo-700 text-white"
              icon={ArrowRight}
              iconPosition="right"
            >
              {loading ? "Signing In..." : "Student Sign In"}
            </Button>
          </form>

          {/* Institutional Note */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2.5 bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
            <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-500 leading-snug">
              <strong>College & Placement Officers:</strong> Institutional admin and TPO accounts are accessed via the dedicated{" "}
              <span className="font-semibold text-slate-700">College Web Platform</span>.
            </div>
          </div>
        </div>

        {/* Product Overview Link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate("/landing")}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 cursor-pointer transition-colors"
          >
            Looking for platform info? View Platform Overview →
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <Modal
          isOpen={forgotModalOpen}
          onClose={() => setForgotModalOpen(false)}
          title="Reset Student Password"
        >
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              Enter your registered student email address. We'll send you instructions to reset your account password.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student Email Address
              </label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="student@rvce.edu"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setForgotModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={resetSent}>
                Send Instructions
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
