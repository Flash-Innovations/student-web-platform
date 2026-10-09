import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("sips_token");
    const savedUser = localStorage.getItem("sips_auth_user");
    if (token && savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Failed to parse saved auth user:", e);
      }
    }
    return null;
  });

  const [role, setRole] = useState(() => user?.role || null);

  useEffect(() => {
    if (user && localStorage.getItem("sips_token")) {
      localStorage.setItem("sips_auth_user", JSON.stringify(user));
      setRole(user.role || "student");

      // Wake up Practice Platform backend service when an authenticated student session is active
      try {
        const practiceUrl = import.meta.env.VITE_PRACTICE_API_URL || "http://localhost:5050";
        fetch(`${practiceUrl.replace(/\/+$/, "")}/health`, { method: "GET" }).catch(() => {});
      } catch (e) {}
    } else {
      localStorage.removeItem("sips_auth_user");
      setRole(null);
    }
  }, [user]);

  /**
   * Universal helper to process authenticated student login response and set state
   */
  const applyLoginResponse = (data, identifier = "") => {
    if (!data || !data.token) {
      throw new Error(data?.message || "Authentication failed");
    }

    localStorage.setItem("sips_token", data.token);

    const userData = {
      id: data.userId || data.studentId || data._id,
      name: data.studentName || data.name || "Student Candidate",
      email: identifier.includes("@") ? identifier : (data.email || ""),
      rollNo: !identifier.includes("@") ? identifier : (data.rollNo || data.usn || ""),
      branch: data.branch || "",
      course: data.course || "",
      department: data.department || data.branch || "",
      role: "student",
      backendRole: data.role || "STUDENT",
      collegeSlug: data.collegeSlug,
      collegeName: data.collegeName,
      batch: data.batch || data.passingYear || "",
      avatar: data.profileImageUrl || data.avatar || null,
      profileImageUrl: data.profileImageUrl || data.avatar || null,
      status: "Active"
    };

    localStorage.setItem("sips_auth_user", JSON.stringify(userData));
    setUser(userData);
    setRole("student");

    return { user: userData, role: "student" };
  };

  /**
   * Student Login via backend API
   */
  const studentLogin = async (identifier, password) => {
    const data = await authService.studentLogin(identifier, password);
    return applyLoginResponse(data, identifier);
  };

  /**
   * General fallback login
   */
  const login = async (identifier, password) => {
    const data = await authService.login(identifier, password);
    return applyLoginResponse(data, identifier);
  };

  /**
   * Change password for logged-in user
   */
  const changePassword = async (currentPassword, newPassword) => {
    const res = await authService.changePassword(currentPassword, newPassword);
    updateUser({ needsPasswordReset: false });
    return res;
  };

  /**
   * Update student user details in memory and storage (e.g. after profile/avatar update)
   */
  const updateUser = (fields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...fields };
      localStorage.setItem("sips_auth_user", JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem("sips_token");
    localStorage.removeItem("sips_auth_user");
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: "student",
        isAuthenticated: !!user && !!localStorage.getItem("sips_token"),
        login,
        studentLogin,
        changePassword,
        updateUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
