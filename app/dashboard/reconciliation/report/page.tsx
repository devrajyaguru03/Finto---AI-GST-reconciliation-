"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  Building2,
  ArrowRight,
  Download,
  Share2,
  Printer,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const formatINR = (amount: number) => {
  return `₹${Math.abs(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface ReconciliationData {
  stats: {
    total_records: number;
    exact_match: number;
    amount_mismatch: number;
    pr_only: number;
    gstr2b_only: number;
    match_rate: number;
    pending_review: number;
    discrepancies: number;
  };
  itc_summary: {
    itc_claimable: number;
    itc_at_risk: number;
    total_itc_available: number;
    total_pr_taxable: number;
    total_gstr2b_taxable: number;
  };
  results: Array<{
    status: string;
    pr_invoice: { taxable_value: number; total_tax: number } | null;
    gstr2b_invoice: { taxable_value: number; total_tax: number } | null;
  }>;
}

export default function ReconciliationReportPage() {
  const [data, setData] = useState<ReconciliationData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("reconciliation_results");
    if (stored) {
      try { setData(JSON.parse(stored)); } catch { setData(null); }
    }
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/20">
        <AppHeader title="Reconciliation Report" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="flex flex-col items-center text-center max-w-md space-y-4">
            <div className="p-4 rounded-full bg-primary/10 ring-1 ring-primary/20">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">No Report Available</h2>
            <p className="text-muted-foreground text-lg">Run a reconciliation first to generate the report.</p>
          </div>
          <Link href="/dashboard/reconciliation/import">
            <Button size="lg" className="rounded-full shadow-lg">
              <Upload className="h-4 w-4 mr-2" />
              Import & Reconcile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { stats, itc_summary } = data;

  // Compute sums by status
  const matchedTaxable = data.results
    .filter((r) => r.status === "exact_match")
    .reduce((s, r) => s + (r.gstr2b_invoice?.taxable_value || r.pr_invoice?.taxable_value || 0), 0);
  const discrepancyTaxable = data.results
    .filter((r) => ["amount_mismatch", "date_mismatch", "gstin_mismatch"].includes(r.status))
    .reduce((s, r) => s + (r.pr_invoice?.taxable_value || r.gstr2b_invoice?.taxable_value || 0), 0);
  const missingTaxable = data.results
    .filter((r) => ["pr_only", "gstr2b_only"].includes(r.status))
    .reduce((s, r) => s + (r.pr_invoice?.taxable_value || r.gstr2b_invoice?.taxable_value || 0), 0);

  const totalTaxable = matchedTaxable + discrepancyTaxable + missingTaxable;
  const matchedPct = totalTaxable > 0 ? Math.round((matchedTaxable / totalTaxable) * 100) : 0;
  const discPct = totalTaxable > 0 ? Math.round((discrepancyTaxable / totalTaxable) * 100) : 0;
  const missPct = totalTaxable > 0 ? 100 - matchedPct - discPct : 0;

  const summaryStats = [
    {
      title: "ITC TO BE CLAIMED",
      value: formatINR(itc_summary.itc_claimable),
      subtitle: "Fully matched & eligible credits",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-500",
      lightBg: "bg-green-100/50",
    },
    {
      title: "ITC AT RISK",
      value: formatINR(itc_summary.itc_at_risk),
      subtitle: "Mismatched amounts or missing invoices",
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-500",
      lightBg: "bg-amber-100/50",
    },
    {
      title: "TOTAL AVAILABLE ITC",
      value: formatINR(itc_summary.total_itc_available),
      subtitle: "Total according to GSTR-2B",
      icon: Building2,
      color: "text-primary",
      bgColor: "bg-primary",
      lightBg: "bg-primary/10",
    },
  ];

  const findingsData = [
    {
      category: "Matched Records",
      recordCount: stats.exact_match.toLocaleString(),
      taxableValue: formatINR(matchedTaxable),
      taxAmount: formatINR(itc_summary.itc_claimable),
      status: "Auto-Approved",
      statusColor: "text-green-600",
      badgeVariant: "default" as const, // using badge variant logic in loop below
    },
    {
      category: "Partial Matches / Discrepancies",
      recordCount: stats.discrepancies.toLocaleString(),
      taxableValue: formatINR(discrepancyTaxable),
      taxAmount: formatINR(itc_summary.itc_at_risk),
      status: "Review Needed",
      statusColor: "text-amber-600",
      badgeVariant: "warning" as const,
    },
    {
      category: "Missing Invoices",
      recordCount: (stats.pr_only + stats.gstr2b_only).toLocaleString(),
      taxableValue: formatINR(missingTaxable),
      taxAmount: "—",
      status: "Deferred",
      statusColor: "text-muted-foreground",
      badgeVariant: "secondary" as const,
    },
  ];

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <AppHeader title="Reconciliation Report" />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-100/50 text-green-700 border-green-200 px-3 py-1">
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Reconciliation Complete
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {dateStr}
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Final Reconciliation Report</h2>
            <p className="text-muted-foreground max-w-2xl text-lg">
              ITC reconciliation between your Purchase Register and GSTR-2B. Review the breakdown below before filing your returns.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
            <Button variant="outline" size="sm" className="hidden md:flex">
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            <Button size="sm" className="shadow-sm">
              <Download className="h-4 w-4 mr-2" /> Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {summaryStats.map((stat) => (
            <Card key={stat.title} className="overflow-hidden hover-lift border-t-4 border-t-transparent hover:border-t-primary/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-lg ${stat.lightBg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <Badge variant="secondary" className="font-mono text-xs">FY 24-25</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                  <p className={`text-3xl font-bold tracking-tight ${stat.color}`}>{stat.value}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-dashed">{stat.subtitle}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Composition Bar */}
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation Composition</CardTitle>
            <CardDescription>Breakdown of taxable value by matching status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-10 w-full rounded-full overflow-hidden mb-6 ring-4 ring-muted/20">
              {matchedPct > 0 && (
                <div className="bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center text-white text-sm font-bold relative group" style={{ width: `${matchedPct}%` }}>
                  {matchedPct}%
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Matched
                  </span>
                </div>
              )}
              {discPct > 0 && (
                <div className="bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center text-white text-sm font-bold relative group" style={{ width: `${discPct}%` }}>
                  {discPct}%
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Discrepancies
                  </span>
                </div>
              )}
              {missPct > 0 && (
                <div className="bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors flex items-center justify-center text-white text-sm font-bold relative group" style={{ width: `${missPct}%` }}>
                  {missPct}%
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Missing
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-200" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Claimed (Matched)</span>
                  <span className="text-xs text-muted-foreground">{matchedPct}% of total value</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-200" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">At Risk (Discrepancy)</span>
                  <span className="text-xs text-muted-foreground">{discPct}% of total value</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/50 ring-2 ring-muted/20" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Missing / Unreconciled</span>
                  <span className="text-xs text-muted-foreground">{missPct}% of total value</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary of Findings Table */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/10 pb-4 border-b">
            <CardTitle>Detailed Findings Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="text-left font-semibold text-muted-foreground py-3 px-6 pl-8">Category</th>
                    <th className="text-center font-semibold text-muted-foreground py-3 px-4">Record Count</th>
                    <th className="text-right font-semibold text-muted-foreground py-3 px-4">Taxable Value</th>
                    <th className="text-right font-semibold text-muted-foreground py-3 px-4">Tax Amount (ITC)</th>
                    <th className="text-right font-semibold text-muted-foreground py-3 px-6 pr-8">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {findingsData.map((item) => (
                    <tr key={item.category} className="hover:bg-muted/20 transition-colors">
                      <td className="py-4 px-6 pl-8 font-medium text-foreground">{item.category}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-md bg-muted font-medium text-xs">
                          {item.recordCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-muted-foreground">{item.taxableValue}</td>
                      <td className={`py-4 px-4 text-right font-mono font-medium ${item.statusColor}`}>{item.taxAmount}</td>
                      <td className="py-4 px-6 pr-8 text-right">
                        <Badge variant="outline" className={`${item.statusColor === 'text-green-600' ? 'border-green-200 text-green-700 bg-green-50' :
                            item.statusColor === 'text-amber-600' ? 'border-amber-200 text-amber-700 bg-amber-50' :
                              'text-muted-foreground'
                          }`}>
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/10 font-medium">
                    <td className="py-4 px-6 pl-8 text-foreground">Grand Totals</td>
                    <td className="py-4 px-4 text-center">{stats.total_records.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-mono">{formatINR(totalTaxable)}</td>
                    <td className="py-4 px-4 text-right font-mono text-primary text-lg">{formatINR(itc_summary.total_itc_available)}</td>
                    <td className="py-4 px-6 pr-8" />
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <Link href="/dashboard/reconciliation">
            <Button variant="ghost">← Back to Results</Button>
          </Link>
          <Link href="/dashboard/reconciliation/resolution">
            <Button size="lg" className="shadow-md shadow-primary/20">
              Resolve Discrepancies
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
