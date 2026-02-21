"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Activity, ShieldAlert, CheckCircle2, AlertTriangle, FileText, CheckCircle, CalendarPlus } from "lucide-react";
import ReactMarkdown from "react-markdown";

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

export default function ClientDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.clientId as string;

    const [data, setData] = useState<RiskAnalysis | null>(null);
    const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const token = localStorage.getItem("auth_token") || "";
                const headers = {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                };

                // Fetch both risk analysis and client info in parallel
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

                // Conditional Routing based on History
                if (riskData.stats.total_runs === 0) {
                    const month = clientInfo?.pending_month || "July 2024";
                    router.replace(`/dashboard/clients/${clientId}/reconcile?month=${encodeURIComponent(month)}`);
                } else {
                    setData(riskData);
                    setLoading(false);
                }
            } catch (err: any) {
                setError(err.message || "An unexpected error occurred");
                setLoading(false);
            }
        };

        fetchAll();
    }, [clientId, router]);

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

    const pendingMonth = clientInfo?.pending_month || "Next Month";
    const reconcileUrl = `/dashboard/clients/${clientId}/reconcile?month=${encodeURIComponent(pendingMonth)}`;

    return (
        <div className="flex flex-col min-h-screen bg-muted/20">
            <AppHeader title={`${data?.client_name || "Client"} Overview`} />

            <main className="flex-1 p-4 md:p-6 lg:p-8 pt-6 space-y-6 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            {data?.client_name || "Client Dashboard"}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Reconciliation analytics and AI-powered risk assessment
                        </p>
                    </div>
                    {/* ✅ Reconcile Next Month Button */}
                    <Button
                        size="lg"
                        onClick={() => router.push(reconcileUrl)}
                        className="flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                    >
                        <CalendarPlus className="h-5 w-5" />
                        Reconcile for {pendingMonth}
                    </Button>
                </div>

                {/* Top Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Auto-Match Rate</CardTitle>
                            <Activity className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data?.stats.avg_match_rate?.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Average across all runs
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Reconciliation Runs</CardTitle>
                            <FileText className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data?.stats.total_runs}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Total lifetime operations
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Mismatches</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data?.stats.total_discrepancies}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Across all reconciliations
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Discrepancies</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {data?.stats.avg_discrepancies?.toFixed(1)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Discrepancies per run
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* AI Analysis Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-2 shadow-md border-border/60">
                        <CardHeader className="bg-primary/5 border-b pb-4">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-primary" />
                                <CardTitle>AI Risk Analysis & Recommendations</CardTitle>
                            </div>
                            <CardDescription>
                                Groq 70B analysis based on historical filing patterns and discrepancy magnitude
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {data?.analysis ? (
                                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-primary">
                                    <ReactMarkdown>{data.analysis}</ReactMarkdown>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    No analysis available.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="shadow-sm border-border/50">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    Performance Insights
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Highest Discrepancy Event</p>
                                    <p className="text-2xl font-bold flex items-baseline gap-2">
                                        {data?.stats.max_mismatch} <span className="text-xs font-normal text-muted-foreground">invoices</span>
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Most Common Issue</p>
                                    <div className="bg-muted px-3 py-2 rounded-md text-sm mt-1 border">
                                        {data?.stats.most_common_issue}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-primary/5 border-primary/20 shadow-sm cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => router.push(`/dashboard/clients/${clientId}/reconcile`)}>
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-2">
                                    <FileText className="h-6 w-6" />
                                </div>
                                <h3 className="font-semibold text-primary">Start New Reconciliation</h3>
                                <p className="text-sm text-foreground/80">
                                    Upload PR and GSTR-2B files for the latest period
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
