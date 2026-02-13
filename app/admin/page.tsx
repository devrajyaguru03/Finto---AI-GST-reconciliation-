"use client";

import { useEffect, useState, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface DashboardStats {
    total_users: number;
    active_sessions: number;
    otps_today: number;
    total_reconciliations: number;
    activity_today: number;
}

interface ActivityLog {
    id: string;
    action: string;
    email: string | null;
    details: Record<string, unknown>;
    ip_address: string | null;
    created_at: string;
}

interface OTPLog {
    id: string;
    email: string;
    otp_code: string;
    status: string;
    ip_address: string | null;
    expires_at: string;
    verified_at: string | null;
    created_at: string;
}

interface User {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    login_count: number;
    last_login_at: string | null;
    created_at: string;
}

interface ReconciliationRun {
    id: string;
    user_email: string;
    pr_filename: string;
    gstr2b_filename: string;
    total_records: number;
    exact_match: number;
    match_rate: number;
    itc_claimable: number;
    itc_at_risk: number;
    created_at: string;
}

type TabType = "activity" | "otps" | "users" | "reconciliations" | "sessions";

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [otps, setOTPs] = useState<OTPLog[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [reconciliations, setReconciliations] = useState<ReconciliationRun[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>("activity");
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);

    const getToken = () => localStorage.getItem("auth_token") || "";

    const fetchData = useCallback(async () => {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };

        try {
            const [statsRes, activityRes, otpRes, usersRes, reconRes] = await Promise.all([
                fetch(`${API}/api/admin/dashboard`, { headers }),
                fetch(`${API}/api/admin/activity?limit=50`, { headers }),
                fetch(`${API}/api/admin/otps?limit=50`, { headers }),
                fetch(`${API}/api/admin/users?limit=50`, { headers }),
                fetch(`${API}/api/admin/reconciliations?limit=50`, { headers }),
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (activityRes.ok) {
                const d = await activityRes.json();
                setActivities(d.data || []);
            }
            if (otpRes.ok) {
                const d = await otpRes.json();
                setOTPs(d.data || []);
            }
            if (usersRes.ok) {
                const d = await usersRes.json();
                setUsers(d.data || []);
            }
            if (reconRes.ok) {
                const d = await reconRes.json();
                setReconciliations(d.data || []);
            }
        } catch (e) {
            console.error("Admin fetch error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(fetchData, 10000); // 10s
        return () => clearInterval(interval);
    }, [autoRefresh, fetchData]);

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: true
        });
    };

    const formatTimeAgo = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const actionBadge = (action: string) => {
        const colors: Record<string, string> = {
            login: "bg-green-500/20 text-green-400 border-green-500/30",
            logout: "bg-gray-500/20 text-gray-400 border-gray-500/30",
            otp_sent: "bg-blue-500/20 text-blue-400 border-blue-500/30",
            otp_verify_failed: "bg-red-500/20 text-red-400 border-red-500/30",
            reconciliation: "bg-purple-500/20 text-purple-400 border-purple-500/30",
            email_generated: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        };
        const cls = colors[action] || "bg-gray-500/20 text-gray-400 border-gray-500/30";
        return (
            <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full border ${cls}`}>
                {action.replace(/_/g, " ")}
            </span>
        );
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            sent: "bg-blue-500/20 text-blue-400",
            verified: "bg-green-500/20 text-green-400",
            expired: "bg-gray-500/20 text-gray-400",
            failed: "bg-red-500/20 text-red-400",
        };
        return (
            <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${colors[status] || "bg-gray-500/20 text-gray-400"}`}>
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const tabs: { key: TabType; label: string; icon: string; count?: number }[] = [
        { key: "activity", label: "Activity Feed", icon: "📋", count: activities.length },
        { key: "otps", label: "OTP Logs", icon: "🔑", count: otps.length },
        { key: "users", label: "Users", icon: "👥", count: users.length },
        { key: "reconciliations", label: "Reconciliations", icon: "📊", count: reconciliations.length },
        { key: "sessions", label: "Sessions", icon: "🔗" },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-1">Monitor all system activity in real-time</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${autoRefresh
                                ? "bg-green-500/10 text-green-400 border-green-500/30"
                                : "bg-gray-800 text-gray-400 border-gray-700"
                            }`}
                    >
                        {autoRefresh ? "● Live" : "○ Paused"}
                    </button>
                    <button
                        onClick={() => { setLoading(true); fetchData(); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-all"
                    >
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { label: "Total Users", value: stats.total_users, icon: "👥", color: "from-blue-600 to-blue-400" },
                        { label: "Active Sessions", value: stats.active_sessions, icon: "🔗", color: "from-green-600 to-green-400" },
                        { label: "OTPs Today", value: stats.otps_today, icon: "🔑", color: "from-amber-600 to-amber-400" },
                        { label: "Reconciliations", value: stats.total_reconciliations, icon: "📊", color: "from-purple-600 to-purple-400" },
                        { label: "Activity Today", value: stats.activity_today, icon: "📋", color: "from-cyan-600 to-cyan-400" },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="relative overflow-hidden rounded-xl border border-white/5 bg-[#111827] p-5"
                        >
                            <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${s.color} opacity-5 rounded-bl-full`} />
                            <div className="text-2xl mb-1">{s.icon}</div>
                            <div className="text-2xl font-bold text-white">{s.value}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-[#111827] rounded-xl p-1 border border-white/5">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.key
                                ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                                : "text-gray-500 hover:text-gray-300 border border-transparent"
                            }`}
                    >
                        <span>{tab.icon}</span>
                        <span className="hidden md:inline">{tab.label}</span>
                        {tab.count !== undefined && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-white/5 rounded-full">{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="rounded-xl border border-white/5 bg-[#111827] overflow-hidden">
                {/* Activity Feed */}
                {activeTab === "activity" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Details</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {activities.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-12 text-center text-gray-600">
                                            No activity yet. Activity will appear here when users interact with the system.
                                        </td>
                                    </tr>
                                ) : (
                                    activities.map((a) => (
                                        <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                                                <div className="text-xs">{formatTimeAgo(a.created_at)}</div>
                                                <div className="text-[10px] text-gray-600">{formatTime(a.created_at)}</div>
                                            </td>
                                            <td className="px-4 py-3">{actionBadge(a.action)}</td>
                                            <td className="px-4 py-3 text-gray-300 font-mono text-xs">{a.email || "—"}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                                                {Object.keys(a.details || {}).length > 0
                                                    ? JSON.stringify(a.details)
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 font-mono text-xs">{a.ip_address || "—"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* OTP Logs */}
                {activeTab === "otps" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">OTP Code</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Verified At</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {otps.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-gray-600">
                                            No OTPs sent yet.
                                        </td>
                                    </tr>
                                ) : (
                                    otps.map((o) => (
                                        <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                                                {formatTimeAgo(o.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-300 font-mono text-xs">{o.email}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-lg font-bold tracking-[0.3em] text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg">
                                                    {o.otp_code}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{statusBadge(o.status)}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {o.verified_at ? formatTime(o.verified_at) : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 font-mono text-xs">{o.ip_address || "—"}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Users */}
                {activeTab === "users" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Logins</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Last Login</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-gray-600">
                                            No users registered yet.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-gray-300 font-mono text-xs">{u.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${u.role === "admin"
                                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                                    }`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`w-2 h-2 rounded-full inline-block ${u.is_active ? "bg-green-400" : "bg-gray-600"}`} />
                                                <span className="text-xs text-gray-400 ml-2">{u.is_active ? "Active" : "Inactive"}</span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-sm font-mono">{u.login_count}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {u.last_login_at ? formatTimeAgo(u.last_login_at) : "Never"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">{formatTime(u.created_at)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Reconciliations */}
                {activeTab === "reconciliations" && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Files</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Records</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Match Rate</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ITC Claimable</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">ITC At Risk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {reconciliations.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-600">
                                            No reconciliations run yet.
                                        </td>
                                    </tr>
                                ) : (
                                    reconciliations.map((r) => (
                                        <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                                {formatTimeAgo(r.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-gray-300 font-mono text-xs">{r.user_email}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                <div>{r.pr_filename}</div>
                                                <div>{r.gstr2b_filename}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 font-mono">{r.total_records}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                                                            style={{ width: `${r.match_rate}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-400">{r.match_rate}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-green-400 font-mono text-xs">
                                                ₹{Number(r.itc_claimable).toLocaleString("en-IN")}
                                            </td>
                                            <td className="px-4 py-3 text-red-400 font-mono text-xs">
                                                ₹{Number(r.itc_at_risk).toLocaleString("en-IN")}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Sessions - reuse activity table style */}
                {activeTab === "sessions" && (
                    <div className="p-6 text-center text-gray-500">
                        <p className="text-sm">Session monitoring available via Activity Feed.</p>
                        <p className="text-xs mt-1 text-gray-600">Login/logout events are tracked with timestamps, IPs, and user emails.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
