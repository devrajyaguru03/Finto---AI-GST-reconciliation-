"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Upload,
  XCircle,
} from "lucide-react";

interface ReconciliationResult {
  id: string;
  status: string;
  confidence_score: number;
  match_rule: string;
  taxable_diff: number;
  total_diff: number;
  pr_invoice: {
    invoice_no: string;
    invoice_date: string;
    vendor_gstin: string;
    vendor_name: string;
    taxable_value: number;
    total_tax: number;
    invoice_value: number;
  } | null;
  gstr2b_invoice: {
    invoice_no: string;
    invoice_date: string;
    vendor_gstin: string;
    vendor_name: string;
    taxable_value: number;
    total_tax: number;
    invoice_value: number;
  } | null;
}

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
  results: ReconciliationResult[];
  itc_summary: {
    itc_claimable: number;
    itc_at_risk: number;
    total_itc_available: number;
  };
  parsing: {
    pr_file: string;
    gstr2b_file: string;
    pr_invoices_parsed: number;
    gstr2b_invoices_parsed: number;
  };
}

const formatINR = (amount: number) => {
  return `₹${Math.abs(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    exact_match: "Matched",
    amount_mismatch: "Amount Mismatch",
    date_mismatch: "Date Mismatch",
    gstin_mismatch: "GSTIN Mismatch",
    pr_only: "Missing in GSTR-2B",
    gstr2b_only: "Missing in PR",
  };
  return map[status] || status;
};

const statusColor = (status: string) => {
  if (status === "exact_match") return "text-green-600 bg-green-100";
  if (status === "pr_only" || status === "gstr2b_only") return "text-amber-600 bg-amber-100";
  return "text-red-600 bg-red-100";
};

export default function ReconciliationPage() {
  const router = useRouter();
  const [data, setData] = useState<ReconciliationData | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("reconciliation_results");
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch {
        setData(null);
      }
    }
  }, []);

  const filteredResults = useMemo(() => {
    if (!data) return [];
    let results = data.results;
    if (filter !== "all") {
      if (filter === "matched") results = results.filter((r) => r.status === "exact_match");
      else if (filter === "discrepancy") results = results.filter((r) => r.status !== "exact_match");
      else results = results.filter((r) => r.status === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter((r) => {
        const inv = r.pr_invoice || r.gstr2b_invoice;
        if (!inv) return false;
        return (
          inv.invoice_no?.toLowerCase().includes(q) ||
          inv.vendor_name?.toLowerCase().includes(q) ||
          inv.vendor_gstin?.toLowerCase().includes(q)
        );
      });
    }
    return results;
  }, [data, filter, search]);

  // No results yet — show upload prompt
  if (!data) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader title="Reconciliation" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Reconciliation Data</h2>
            <p className="text-muted-foreground mb-6">
              Upload your Purchase Register and GSTR-2B files to start reconciliation.
            </p>
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

  const { stats, itc_summary, parsing } = data;

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Reconciliation" />

      <div className="flex-1 p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Statement Reconciliation
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {parsing.pr_file} vs {parsing.gstr2b_file} — {parsing.pr_invoices_parsed} PR invoices, {parsing.gstr2b_invoices_parsed} GSTR-2B invoices
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/reconciliation/report">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                View Report
              </Button>
            </Link>
            <Link href="/dashboard/reconciliation/resolution">
              <Button>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Resolution Center
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Records</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-bold text-foreground">{stats.total_records.toLocaleString()}</p>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Exact Matches</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-bold text-foreground">{stats.exact_match.toLocaleString()}</p>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${stats.match_rate}%` }}
                />
              </div>
              <p className="text-xs text-green-600 mt-1">{stats.match_rate}% match rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-bold text-foreground">{stats.pending_review.toLocaleString()}</p>
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-xs text-amber-600 mt-1">Requires attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Discrepancies</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-bold text-foreground">{stats.discrepancies.toLocaleString()}</p>
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-xs text-red-600 mt-1">Action needed</p>
            </CardContent>
          </Card>
        </div>

        {/* ITC Summary Bar */}
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">ITC Summary</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Claimable</p>
                <p className="text-lg font-bold text-green-600">{formatINR(itc_summary.itc_claimable)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">At Risk</p>
                <p className="text-lg font-bold text-amber-600">{formatINR(itc_summary.itc_at_risk)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Total Available</p>
                <p className="text-lg font-bold text-primary">{formatINR(itc_summary.total_itc_available)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search invoices, vendor, GSTIN..."
                    className="w-72 pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Filter:</span>
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Records</SelectItem>
                      <SelectItem value="matched">Matched</SelectItem>
                      <SelectItem value="discrepancy">All Discrepancies</SelectItem>
                      <SelectItem value="amount_mismatch">Amount Mismatch</SelectItem>
                      <SelectItem value="pr_only">Missing in GSTR-2B</SelectItem>
                      <SelectItem value="gstr2b_only">Missing in PR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {filteredResults.length} of {data.results.length} records
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Results Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Status
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Invoice #
                    </th>
                    <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Vendor / GSTIN
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                      PR Amount
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                      GSTR-2B Amount
                    </th>
                    <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Difference
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((item) => {
                    const pr = item.pr_invoice;
                    const gstr = item.gstr2b_invoice;
                    const inv = pr || gstr;
                    return (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(item.status)}`}>
                            {statusLabel(item.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-foreground">
                          {inv?.invoice_no || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-foreground">{inv?.vendor_name || "—"}</p>
                          <p className="text-xs text-muted-foreground font-mono">{inv?.vendor_gstin || ""}</p>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-right text-foreground">
                          {pr ? formatINR(pr.taxable_value) : "—"}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-right text-foreground">
                          {gstr ? formatINR(gstr.taxable_value) : "—"}
                        </td>
                        <td className={`py-3 px-4 text-sm font-medium text-right ${item.total_diff !== 0 ? "text-red-600" : "text-green-600"}`}>
                          {item.total_diff !== 0 ? formatINR(item.total_diff) : "✓"}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No records match your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {filteredResults.length} of {data.results.length} results
              </p>
              <div className="flex items-center gap-3">
                <Link href="/dashboard/reconciliation/import">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Re-upload
                  </Button>
                </Link>
                <Link href="/dashboard/reconciliation/resolution">
                  <Button size="sm">
                    Resolve Discrepancies
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
