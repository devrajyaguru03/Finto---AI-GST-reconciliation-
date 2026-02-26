"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Activity, ShieldAlert, CheckCircle2, AlertTriangle, FileText, CheckCircle, TrendingUp, Calendar, ArrowRight, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface RiskAnalysis {
    client_id: string;
    client_name?: string;
    analysis: string;
    stats: {
        total_runs: number;
        avg_match_rate?: number;
        total_discrepancies?: number;
        avg_discrepancies?: number;
        max_mismatch?: number;
        most_common_issue?: string;
    };
}

interface ClientInfo {
    id: string;
    name: string;
    pending_month?: string;
}

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

/** Generate last 6 months dynamically from the real-time current date */
function generateRecentMonths() {
    const months: { label: string; shortLabel: string; year: number; isCurrent: boolean }[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            shortLabel: d.toLocaleDateString("en-US", { month: "short" }),
            year: d.getFullYear(),
            isCurrent: i === 0,
        });
    }
    return months;
}

export default function ClientDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.clientId as string;

    const [data, setData] = useState<RiskAnalysis | null>(null);
    const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const recentMonths = useMemo(() => generateRecentMonths(), []);
    const currentMonth = recentMonths[0].label; // e.g. "February 2026"

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const token = localStorage.getItem("auth_token") || "";
                const headers = {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                };

                const [riskRes, clientsRes] = await Promise.all([
                    fetch(`${API}/api/ai/client-risk/${clientId}`, { headers }),
                    fetch(`${API}/api/manage-clients/`, { headers }),
                ]);

                if (!riskRes.ok) throw new Error("Failed to fetch client data");

                const riskData: RiskAnalysis = await riskRes.json();

                if (clientsRes.ok) {
                    const allClients: ClientInfo[] = await clientsRes.json();
                    const found = allClients.find((c) => c.id === clientId);
                    if (found) setClientInfo(found);
                }

                setData(riskData);
                setLoading(false);
            } catch (err: any) {
                setError(err.message || "An unexpected error occurred");
                setLoading(false);
            }
        };

        fetchAll();
    }, [clientId, router]);

    const handleReconcileMonth = (monthLabel: string) => {
        router.push(`/dashboard/clients/${clientId}/reconcile/upload?month=${encodeURIComponent(monthLabel)}`);
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-muted/20">
                <AppHeader title="Client Dashboard" />
                <main className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col min-h-screen bg-muted/20">
                <AppHeader title="Client Overview" />
                <main className="flex-1 p-4 md:p-6 lg:p-8 flex items-center justify-center">
                    <Card className="w-full max-w-md border-destructive/20 shadow-lg shadow-destructive/5">
                        <CardHeader>
                            <CardTitle className="text-xl text-destructive flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Error Loading Dashboard
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{error}</p>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    const pendingMonth = currentMonth;
    const reconcileUrl = `/dashboard/clients/${clientId}/reconcile/upload?month=${encodeURIComponent(pendingMonth)}`;
    const isNewClient = data?.stats.total_runs === 0;

    return (
        <div className="flex flex-col min-h-screen mesh-gradient relative overflow-hidden">
            <AppHeader title={`${clientInfo?.name || data?.client_name || "Client"} Overview`} />

            <main className="flex-1 p-4 md:p-6 lg:p-8 pt-6 space-y-8 max-w-7xl mx-auto w-full relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center text-primary font-bold text-2xl backdrop-blur-sm border border-primary/20 shadow-inner">
                            {(clientInfo?.name || data?.client_name || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                                {clientInfo?.name || data?.client_name || "Client Dashboard"}
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {isNewClient
                                    ? "Your fresh reconciliation workspace is ready."
                                    : "Reconciliation analytics and AI-powered risk assessment."}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl px-5 py-3 shadow-sm">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Current Period</span>
                            <span className="text-lg font-bold text-foreground tracking-tight">{pendingMonth}</span>
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════════════════
                    MONTH TIMELINE — Current + Previous Months
                   ════════════════════════════════════════════════ */}
                <Card className="shadow-xl border-border/40 bg-card/70 backdrop-blur-xl overflow-hidden animate-in slide-in-from-bottom-3 fade-in duration-600">
                    <CardHeader className="pb-4 border-b border-border/30 bg-gradient-to-r from-primary/[0.03] to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                                    <Calendar className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Monthly Reconciliation</CardTitle>
                                    <CardDescription className="text-xs mt-0.5">Select a period to start or review reconciliation</CardDescription>
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/40">
                                <Clock className="h-3 w-3" />
                                <span>Real-time</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {recentMonths.map((m, idx) => (
                                <button
                                    key={m.label}
                                    onClick={() => handleReconcileMonth(m.label)}
                                    className={cn(
                                        "relative group flex flex-col items-center justify-center rounded-2xl p-4 border transition-all duration-300 cursor-pointer overflow-hidden",
                                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                        m.isCurrent
                                            ? "bg-gradient-to-br from-primary to-primary/80 text-white border-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.03]"
                                            : "bg-card/60 hover:bg-muted/80 text-foreground border-border/50 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5"
                                    )}
                                >
                                    {/* Glow for current month */}
                                    {m.isCurrent && (
                                        <div className="absolute inset-0 bg-primary/20 blur-xl -z-10 rounded-2xl" />
                                    )}

                                    <span className={cn(
                                        "text-2xl font-bold tracking-tight",
                                        m.isCurrent ? "text-white" : "text-foreground"
                                    )}>
                                        {m.shortLabel}
                                    </span>
                                    <span className={cn(
                                        "text-[11px] font-medium mt-1",
                                        m.isCurrent ? "text-white/70" : "text-muted-foreground"
                                    )}>
                                        {m.year}
                                    </span>

                                    {m.isCurrent && (
                                        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-white/90">
                                            <span className="relative flex h-1.5 w-1.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                            </span>
                                            Current
                                        </span>
                                    )}

                                    {!m.isCurrent && (
                                        <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <ArrowRight className="h-3 w-3" />
                                            Reconcile
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {isNewClient ? (
                    // --- PREMIUM EMPTY STATE FOR NEW CLIENTS ---
                    <div className="relative group overflow-hidden rounded-3xl border border-primary/10 bg-card/40 backdrop-blur-xl p-8 md:p-16 text-center shadow-2xl flex flex-col items-center justify-center animate-in zoom-in-95 fade-in duration-700 mx-auto max-w-4xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 opacity-50" />
                        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/20 blur-[120px] rounded-full group-hover:bg-primary/30 transition-colors duration-1000" />
                        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full group-hover:bg-blue-500/30 transition-colors duration-1000" />

                        <div className="relative z-10 h-28 w-28 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center mb-8 shadow-inner ring-1 ring-white/20 dark:ring-white/10 group-hover:scale-105 transition-transform duration-500">
                            <FileText className="h-12 w-12 text-primary" />
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/80">
                            Ready for Your First Reconciliation
                        </h2>

                        <p className="text-muted-foreground max-w-lg mx-auto mb-10 relative z-10 text-lg md:text-xl leading-relaxed">
                            Start verifying your Purchase Register against GSTR-2B. Our AI-driven engine identifies missing invoices, mismatches, and saves you hours of manual work.
                        </p>

                        <Button
                            size="lg"
                            onClick={() => router.push(reconcileUrl)}
                            className="relative z-10 flex items-center gap-3 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300 btn-shine rounded-full px-10 h-14 text-lg font-semibold"
                        >
                            <Activity className="h-6 w-6" />
                            Start {pendingMonth} Scan
                        </Button>
                    </div>
                ) : (
                    // --- PREMIUM DASHBOARD FOR EXISTING CLIENTS ---
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
                        {/* Top Stats Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Card className="shadow-lg border-border/40 bg-card/60 backdrop-blur-md hover:shadow-xl transition-shadow duration-300 group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Auto-Match Rate</CardTitle>
                                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <Activity className="h-4 w-4 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tight">
                                        {data?.stats.avg_match_rate?.toFixed(1)}%
                                    </div>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                        <TrendingUp className="h-3 w-3 text-green-500" />
                                        <span>Average match efficiency</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg border-border/40 bg-card/60 backdrop-blur-md hover:shadow-xl transition-shadow duration-300 group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Runs</CardTitle>
                                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tight">
                                        {data?.stats.total_runs}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Historical reconciliations
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg border-border/40 bg-card/60 backdrop-blur-md hover:shadow-xl transition-shadow duration-300 group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Mismatches</CardTitle>
                                    <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tight">
                                        {data?.stats.total_discrepancies}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Lifetime detected issues
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="shadow-lg border-border/40 bg-card/60 backdrop-blur-md hover:shadow-xl transition-shadow duration-300 group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Avg Discrepancies</CardTitle>
                                    <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold tracking-tight">
                                        {data?.stats.avg_discrepancies?.toFixed(1)}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Discrepancies per scan
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* AI Analysis Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 shadow-xl border-border/50 bg-card/80 backdrop-blur-xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700 pointer-events-none" />
                                <CardHeader className="border-b border-border/40 pb-5 bg-primary/[0.02]">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-primary/10 rounded-xl shadow-inner border border-primary/20">
                                            <ShieldAlert className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl">AI Risk Analysis & Recommendations</CardTitle>
                                            <CardDescription className="mt-1 flex items-center gap-1.5 font-medium">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                </span>
                                                Powered by Groq 70B & historical insights
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 relative z-10">
                                    {data?.analysis ? (
                                        <div className="prose prose-base dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-primary prose-p:leading-relaxed text-foreground/90">
                                            <ReactMarkdown>{data.analysis}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
                                            <ShieldAlert className="h-10 w-10 opacity-20 mb-3" />
                                            <p>No deep analysis available yet.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card className="shadow-lg border-border/40 bg-card/60 backdrop-blur-md">
                                    <CardHeader className="bg-muted/30 pb-4">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            Performance Insights
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 space-y-5">
                                        <div className="space-y-1.5">
                                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Highest Mismatch Event</p>
                                            <p className="text-2xl font-bold flex items-baseline gap-2">
                                                {data?.stats.max_mismatch} <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border/50">invoices</span>
                                            </p>
                                        </div>
                                        <div className="w-full h-px bg-border/50" />
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Most Common Issue Type</p>
                                            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 px-4 py-3 rounded-xl text-sm font-medium text-foreground border border-amber-500/20 shadow-inner flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                {data?.stats.most_common_issue}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card
                                    className="relative overflow-hidden group cursor-pointer border-primary/30 shadow-lg shadow-primary/5 hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300"
                                    onClick={() => router.push(reconcileUrl)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                                    <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4 relative z-10">
                                        <div className="h-16 w-16 rounded-2xl bg-white dark:bg-black/50 shadow-xl flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform duration-300 border border-primary/20">
                                            <FileText className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground tracking-tight">Run New Reconciliation</h3>
                                            <p className="text-sm text-muted-foreground mt-1 px-4">
                                                Upload latest PR & GSTR-2B datasets
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
