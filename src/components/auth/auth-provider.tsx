"use client";

import * as React from "react";
import { UserProfile, UserRole } from "@/lib/auth-session";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  loginModalOpen: boolean;
  roleModalOpen: boolean;
  editModalOpen: boolean;
  openLogin: () => void;
  closeLogin: () => void;
  openRoleSelection: () => void;
  closeRoleSelection: () => void;
  openEditProfile: () => void;
  closeEditProfile: () => void;
  refreshUser: () => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  updateUserRole: (role: UserRole) => Promise<boolean>;
  updateUserProfileData: (data: Partial<UserProfile>) => Promise<boolean>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: UserProfile | null;
}) {
  const [user, setUser] = React.useState<UserProfile | null>(initialUser);
  const [isLoading, setIsLoading] = React.useState(!initialUser);
  const [loginModalOpen, setLoginModalOpen] = React.useState(false);
  const [roleModalOpen, setRoleModalOpen] = React.useState(false);
  const [editModalOpen, setEditModalOpen] = React.useState(false);

  const refreshUser = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        return data.user || null;
      }
    } catch (e) {
      console.error("[Failed to fetch current user]", e);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  React.useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Check if first-time user needs role selection onboarding
  React.useEffect(() => {
    if (user && !user.is_onboarded && user.role !== "admin") {
      setRoleModalOpen(true);
    }
  }, [user]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      window.location.reload();
    } catch (e) {
      console.error("[Logout error]", e);
    }
  };

  const updateUserRole = async (role: UserRole): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.profile);
        setRoleModalOpen(false);
        return true;
      }
    } catch (e) {
      console.error("[Update role error]", e);
    }
    return false;
  };

  const updateUserProfileData = async (data: Partial<UserProfile>): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const resData = await res.json();
        setUser(resData.profile);
        setEditModalOpen(false);
        return true;
      }
    } catch (e) {
      console.error("[Update profile error]", e);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginModalOpen,
        roleModalOpen,
        editModalOpen,
        openLogin: () => setLoginModalOpen(true),
        closeLogin: () => setLoginModalOpen(false),
        openRoleSelection: () => setRoleModalOpen(true),
        closeRoleSelection: () => setRoleModalOpen(false),
        openEditProfile: () => setEditModalOpen(true),
        closeEditProfile: () => setEditModalOpen(false),
        refreshUser,
        logout,
        updateUserRole,
        updateUserProfileData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
