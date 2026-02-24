"use client";

import { useState, useMemo, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronRight,
  Shield,
  FileText,
} from "lucide-react";

interface ReconcileResult {
  success: boolean;
  stats: {
    total_records: number;
    exact_match: number;
    amount_mismatch: number;
    date_mismatch: number;
    gstin_mismatch: number;
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
  results: Array<Record<string, unknown>>;
}

function SummaryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientId = params.clientId as string;
  const month = searchParams.get("month") || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Read client name from sessionStorage
  const clientName = typeof window !== "undefined"
    ? sessionStorage.getItem(`client_name_${clientId}`) || "Client"
    : "Client";

  // Read real reconciliation results from sessionStorage
  const reconcileData: ReconcileResult | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(`reconcile_results_${clientId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ReconcileResult;
    } catch {
      return null;
    }
  }, [clientId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCategoryClick = (category: string) => {
    if (category === "needsReview") {
      router.push(
        `/dashboard/clients/${clientId}/reconcile/exceptions?month=${encodeURIComponent(month)}`
      );
    }
  };

  const handleContinue = () => {
    router.push(
      `/dashboard/clients/${clientId}/reconcile/notes?month=${encodeURIComponent(month)}`
    );
  };

  // Fallback if no results (shouldn't happen if flow is correct)
  if (!reconcileData) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">No Reconciliation Data</h2>
        <p className="text-muted-foreground mb-6">
          Please upload your files and run reconciliation first.
        </p>
        <Button
          onClick={() =>
            router.push(`/dashboard/clients/${clientId}/reconcile/upload?month=${encodeURIComponent(month)}`)
          }
        >
          Go to Upload
        </Button>
      </div>
    );
  }

  const { stats, itc_summary } = reconcileData;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          GST Reconciliation Summary - {month}
        </h1>
        <p className="text-muted-foreground mt-1">
          Client: <span className="font-medium text-foreground">{clientName}</span>
        </p>
      </div>

      {/* Total ITC Card */}
      <Card className="border-border bg-muted/30">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total ITC Available</p>
          <p className="text-4xl font-bold text-foreground">
            {formatCurrency(itc_summary.total_itc_available)}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.total_records} invoices &middot; {stats.match_rate}% match rate
          </p>
        </CardContent>
      </Card>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Safe to Claim (exact matches) */}
        <Card className="border-emerald-200 bg-emerald-50/50 cursor-default">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700 mb-1">
              {formatCurrency(itc_summary.itc_claimable)}
            </p>
            <p className="text-sm text-emerald-600 font-medium">Safe to Claim</p>
            <p className="text-xs text-emerald-500 mt-1">{stats.exact_match} matched</p>
          </CardContent>
        </Card>

        {/* Needs Review (mismatches) */}
        <Card
          className="border-amber-200 bg-amber-50/50 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCategoryClick("needsReview")}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <ChevronRight className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-700 mb-1">
              {formatCurrency(itc_summary.itc_at_risk)}
            </p>
            <p className="text-sm text-amber-600 font-medium">Needs Review</p>
            <p className="text-xs text-amber-500 mt-1">{stats.pending_review} items</p>
          </CardContent>
        </Card>

        {/* Missing in GSTR-2B (PR only) */}
        <Card className="border-red-200 bg-red-50/50 cursor-default">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-700 mb-1">
              {stats.pr_only}
            </p>
            <p className="text-sm text-red-600 font-medium">Missing in GSTR-2B</p>
            <p className="text-xs text-red-500 mt-1">Not claimable yet</p>
          </CardContent>
        </Card>

        {/* GSTR-2B Only */}
        <Card className="border-slate-200 bg-slate-50/50 cursor-default">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Clock className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-700 mb-1">
              {stats.gstr2b_only}
            </p>
            <p className="text-sm text-slate-600 font-medium">Only in GSTR-2B</p>
            <p className="text-xs text-slate-500 mt-1">Not in your books</p>
          </CardContent>
        </Card>
      </div>

      {/* Reassurance */}
      <Card className="border-border bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-medium">
              {stats.match_rate}% of invoices matched.
            </span>{" "}
            Review only the highlighted exceptions.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => handleCategoryClick("needsReview")}
        >
          Review Exceptions
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
        <Button onClick={handleContinue}>
          Continue to Notes
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <SummaryContent />
    </Suspense>
  );
}
