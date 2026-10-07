import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Target,
  GraduationCap,
  Mic,
  CheckSquare,
  Briefcase,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Code2,
  Trophy
} from "lucide-react";
import Avatar from "../common/Avatar";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../utils/cn";

export function Sidebar({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const studentLinks = [
    { to: "/student/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/student/practice", label: "Practice Hub", icon: Code2 },
    { to: "/student/contests", label: "Contests", icon: Trophy, badge: "Live" },
    { to: "/student/assessments", label: "Assessments", icon: BookOpen },
    { to: "/student/skills", label: "Skill Gap Analysis", icon: Target },
    { to: "/student/readiness", label: "Placement Readiness", icon: GraduationCap },
    { to: "/student/interview", label: "AI Mock Interview", icon: Mic, badge: "AI" },
    { to: "/student/tasks", label: "Daily Behavioral", icon: CheckSquare, badge: "Streak" },
    { to: "/student/jobs", label: "Job Opportunities", icon: Briefcase, badge: "Drives" },
    { to: "/student/profile", label: "My Profile", icon: User }
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 ease-in-out select-none",
          isCollapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-100">
          <div
            onClick={() => navigate("/student/dashboard")}
            className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
          >
            {isCollapsed ? (
              <img
                src="/branding/sips-mark.png"
                alt="SIPS"
                className="w-9 h-9 object-contain shrink-0 mx-auto"
              />
            ) : (
              <img
                src="/branding/sips-logo-compact.png"
                alt="SIPS - Skill Intelligence"
                className="h-8 w-auto max-w-[170px] object-contain shrink-0"
              />
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Student Career Hub
            </div>
          )}

          {studentLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        "w-5 h-5 shrink-0 transition-colors",
                        isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                    {!isCollapsed && (
                      <span className="truncate flex-1">{link.label}</span>
                    )}
                    {!isCollapsed && link.badge && (
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                          isActive
                            ? "bg-indigo-200/60 text-indigo-800"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {link.badge}
                      </span>
                    )}

                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                        {link.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Student User Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div
            className={cn(
              "flex items-center gap-3 p-2 rounded-xl transition-all",
              !isCollapsed && "hover:bg-white"
            )}
          >
            <Avatar
              src={user?.profileImageUrl || user?.avatar}
              name={user?.name || "Student"}
              isCollege={false}
              size="sm"
              className="border border-slate-200 shrink-0"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || "Student Candidate"}
                </p>
                <p className="text-[11px] text-slate-400 capitalize truncate">
                  {user?.rollNo ? `${user.rollNo} • Student` : "Candidate"}
                </p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
