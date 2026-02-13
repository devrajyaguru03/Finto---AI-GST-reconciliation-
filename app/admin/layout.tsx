"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const token = localStorage.getItem("auth_token");
                if (!token) {
                    router.push("/login");
                    return;
                }

                const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"}/api/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    router.push("/login");
                    return;
                }

                const data = await res.json();
                if (data.role !== "admin") {
                    router.push("/dashboard");
                    return;
                }

                setIsAdmin(true);
            } catch {
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-[#0a0e1a]">
            {/* Admin Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0e1a]/80 border-b border-white/5">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                            F
                        </div>
                        <span className="text-white font-semibold text-lg">Finto Admin</span>
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-red-500/20 text-red-400 rounded-full border border-red-500/30 uppercase tracking-wider">
                            Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
                            ← Back to App
                        </a>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-[1600px] mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
}
