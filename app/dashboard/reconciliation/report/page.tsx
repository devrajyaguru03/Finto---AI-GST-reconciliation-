"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload,
  CheckCircle,
  AlertTriangle,
  Building2,
  ArrowRight,
} from "lucide-react";

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
      <div className="flex flex-col min-h-screen">
        <AppHeader title="Reconciliation" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Report Available</h2>
            <p className="text-muted-foreground mb-6">Run a reconciliation first to generate the report.</p>
            <Link href="/dashboard/reconciliation/import">
              <Button className="gradient-bg text-white">
                <Upload className="h-4 w-4 mr-2" />
                Import & Reconcile
              </Button>
            </Link>
          </div>
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
    },
    {
      title: "ITC AT RISK",
      value: formatINR(itc_summary.itc_at_risk),
      subtitle: "Mismatched amounts or missing invoices",
      icon: AlertTriangle,
      color: "text-amber-600",
      bgColor: "bg-amber-500",
    },
    {
      title: "TOTAL AVAILABLE ITC",
      value: formatINR(itc_summary.total_itc_available),
      subtitle: "Total according to GSTR-2B",
      icon: Building2,
      color: "text-primary",
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
    },
    {
      category: "Partial Matches / Discrepancies",
      recordCount: stats.discrepancies.toLocaleString(),
      taxableValue: formatINR(discrepancyTaxable),
      taxAmount: formatINR(itc_summary.itc_at_risk),
      status: "Review Needed",
      statusColor: "text-amber-600",
    },
    {
      category: "Missing Invoices",
      recordCount: (stats.pr_only + stats.gstr2b_only).toLocaleString(),
      taxableValue: formatINR(missingTaxable),
      taxAmount: "—",
      status: "Deferred",
      statusColor: "text-muted-foreground",
    },
  ];

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Reconciliation" />

      <div className="flex-1 p-6">
        {/* Status Badge */}
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Reconciled
          </span>
        </div>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Final Reconciliation Report</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              ITC reconciliation between your Purchase Register and GSTR-2B. Review the breakdown before filing.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Generated On</p>
            <p className="text-sm font-medium text-foreground">{dateStr} at {timeStr}</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {summaryStats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.subtitle}</p>
                {stat.bgColor && (
                  <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${stat.bgColor} rounded-full w-full`} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Composition Bar */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Reconciliation Composition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-12 rounded-lg overflow-hidden mb-4">
              {matchedPct > 0 && (
                <div className="bg-green-500 flex items-center justify-center text-white text-sm font-medium" style={{ width: `${matchedPct}%` }}>
                  {matchedPct}%
                </div>
              )}
              {discPct > 0 && (
                <div className="bg-amber-500 flex items-center justify-center text-white text-sm font-medium" style={{ width: `${discPct}%` }}>
                  {discPct}%
                </div>
              )}
              {missPct > 0 && (
                <div className="bg-gray-400 flex items-center justify-center text-white text-sm font-medium" style={{ width: `${missPct}%` }}>
                  {missPct}%
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Claimed (Matched)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-muted-foreground">At Risk (Discrepancy)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm text-muted-foreground">Missing</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary of Findings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Summary of Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Category</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Record Count</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Taxable Value</th>
                    <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Tax Amount (ITC)</th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {findingsData.map((item) => (
                    <tr key={item.category} className="border-b border-border last:border-0">
                      <td className="py-4 px-4 text-sm font-medium text-foreground">{item.category}</td>
                      <td className="py-4 px-4 text-sm text-muted-foreground text-center">{item.recordCount}</td>
                      <td className="py-4 px-4 text-sm text-muted-foreground text-center">{item.taxableValue}</td>
                      <td className={`py-4 px-4 text-sm font-medium text-center ${item.statusColor}`}>{item.taxAmount}</td>
                      <td className={`py-4 px-4 text-sm font-medium text-right ${item.statusColor}`}>{item.status}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/30 font-semibold">
                    <td className="py-4 px-4 text-sm text-foreground">Totals</td>
                    <td className="py-4 px-4 text-sm text-foreground text-center">{stats.total_records.toLocaleString()}</td>
                    <td className="py-4 px-4 text-sm text-foreground text-center">{formatINR(totalTaxable)}</td>
                    <td className="py-4 px-4 text-sm text-primary text-center">{formatINR(itc_summary.total_itc_available)}</td>
                    <td className="py-4 px-4" />
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Link href="/dashboard/reconciliation">
            <Button variant="outline">← Back to Results</Button>
          </Link>
          <Link href="/dashboard/reconciliation/resolution">
            <Button className="gradient-bg text-white">
              Resolve Discrepancies
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
