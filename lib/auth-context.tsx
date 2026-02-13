"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthUser {
    email: string;
}

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, email: string) => void;
    logout: () => void;
    getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load session from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem("finto_token");
        const savedEmail = localStorage.getItem("finto_email");
        if (savedToken && savedEmail) {
            setToken(savedToken);
            setUser({ email: savedEmail });
        }
        setIsLoading(false);
    }, []);

    const login = useCallback((newToken: string, email: string) => {
        localStorage.setItem("finto_token", newToken);
        localStorage.setItem("finto_email", email);
        setToken(newToken);
        setUser({ email });
    }, []);

    const logout = useCallback(() => {
        // Call backend logout
        if (token) {
            fetch(`${BACKEND_URL}/api/auth/logout`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            }).catch(() => { });
        }
        localStorage.removeItem("finto_token");
        localStorage.removeItem("finto_email");
        setToken(null);
        setUser(null);
    }, [token]);

    const getAuthHeaders = useCallback((): Record<string, string> => {
        if (!token) return {} as Record<string, string>;
        return { Authorization: `Bearer ${token}` };
    }, [token]);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token && !!user,
                isLoading,
                login,
                logout,
                getAuthHeaders,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
