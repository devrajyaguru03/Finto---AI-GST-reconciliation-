"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "exact_match") return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20">Matched</Badge>;
  if (status === "pr_only" || status === "gstr2b_only") return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">{status === "pr_only" ? "Not in GSTR-2B" : "Not in PR"}</Badge>;
  return <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20 shadow-none">Mismatch</Badge>;
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
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="flex flex-col items-center text-center space-y-4 max-w-lg">
            <div className="p-4 rounded-full bg-primary/10 ring-1 ring-primary/20 shadow-lg shadow-primary/5">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">No Reconciliation Data Found</h2>
            <p className="text-muted-foreground text-lg">
              Upload your Purchase Register and GSTR-2B files to generate a comprehensive reconciliation report.
            </p>
          </div>
          <Link href="/dashboard/reconciliation/import">
            <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1">
              <Upload className="h-4 w-4 mr-2" />
              Start New Reconciliation
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { stats, itc_summary, parsing } = data;

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <AppHeader title="Reconciliation" />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Statement Reconciliation
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{parsing.pr_file}</span>
              <span className="text-muted-foreground/50">•</span>
              <span className="font-medium text-foreground">{parsing.gstr2b_file}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/reconciliation/report">
              <Button variant="outline" className="shadow-sm">
                <Download className="h-4 w-4 mr-2" />
                Report
              </Button>
            </Link>
            <Link href="/dashboard/reconciliation/resolution">
              <Button className="shadow-md shadow-primary/20">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Resolution Center
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-lift">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-muted-foreground">Total Records</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-bold">{stats.total_records.toLocaleString()}</p>
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-muted-foreground">Exact Matches</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-bold">{stats.exact_match.toLocaleString()}</p>
                <div className="p-2 rounded-full bg-green-500/10 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-1000"
                  style={{ width: `${stats.match_rate}%` }}
                />
              </div>
              <p className="text-xs text-green-600 mt-1.5 font-medium">{stats.match_rate}% match rate</p>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-bold">{stats.pending_review.toLocaleString()}</p>
                <div className="p-2 rounded-full bg-amber-500/10 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-amber-600 mt-3 font-medium">Requires attention</p>
            </CardContent>
          </Card>
          <Card className="hover-lift">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-muted-foreground">Discrepancies</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-3xl font-bold">{stats.discrepancies.toLocaleString()}</p>
                <div className="p-2 rounded-full bg-red-500/10 text-red-600">
                  <XCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="text-xs text-red-600 mt-3 font-medium">Action needed</p>
            </CardContent>
          </Card>
        </div>

        {/* ITC Summary Bar */}
        <Card className="overflow-hidden border-l-4 border-l-primary shadow-sm bg-gradient-to-br from-card to-muted/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold">ITC Summary</h3>
              <Badge variant="secondary">FY 2024-25</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Claimable</p>
                <p className="text-2xl font-bold text-green-600 tracking-tight">{formatINR(itc_summary.itc_claimable)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">At Risk</p>
                <p className="text-2xl font-bold text-amber-600 tracking-tight">{formatINR(itc_summary.itc_at_risk)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Available</p>
                <p className="text-2xl font-bold text-primary tracking-tight">{formatINR(itc_summary.total_itc_available)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices, vendor, GSTIN..."
              className="pl-9 bg-background/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-background/50">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{filter === "all" ? "All Records" : filter.replace("_", " ")}</span>
                </div>
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

        {/* Results Table */}
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 transition-colors hover:bg-muted/50">
                    <th className="text-left font-semibold text-muted-foreground py-3 px-4 pl-6 w-[120px]">
                      Status
                    </th>
                    <th className="text-left font-semibold text-muted-foreground py-3 px-4">
                      Invoice No
                    </th>
                    <th className="text-left font-semibold text-muted-foreground py-3 px-4">
                      Vendor Details
                    </th>
                    <th className="text-right font-semibold text-muted-foreground py-3 px-4">
                      PR Amount
                    </th>
                    <th className="text-right font-semibold text-muted-foreground py-3 px-4">
                      GSTR-2B Amount
                    </th>
                    <th className="text-right font-semibold text-muted-foreground py-3 px-4 pr-6">
                      Difference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredResults.map((item) => {
                    const pr = item.pr_invoice;
                    const gstr = item.gstr2b_invoice;
                    const inv = pr || gstr;
                    return (
                      <tr key={item.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4 pl-6 align-top">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="py-4 px-4 align-top">
                          <p className="font-medium text-foreground">{inv?.invoice_no || "—"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{inv?.invoice_date || ""}</p>
                        </td>
                        <td className="py-4 px-4 align-top">
                          <p className="font-medium text-foreground max-w-[200px] truncate" title={inv?.vendor_name}>
                            {inv?.vendor_name || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono bg-muted/50 inline-block px-1 rounded">
                            {inv?.vendor_gstin || ""}
                          </p>
                        </td>
                        <td className="py-4 px-4 text-right align-top">
                          <p className="font-medium text-foreground">{pr ? formatINR(pr.taxable_value) : "—"}</p>
                          {pr && <p className="text-xs text-muted-foreground mt-0.5">Tax: {formatINR(pr.total_tax)}</p>}
                        </td>
                        <td className="py-4 px-4 text-right align-top">
                          <p className="font-medium text-foreground">{gstr ? formatINR(gstr.taxable_value) : "—"}</p>
                          {gstr && <p className="text-xs text-muted-foreground mt-0.5">Tax: {formatINR(gstr.total_tax)}</p>}
                        </td>
                        <td className="py-4 px-4 pr-6 text-right align-top">
                          <span className={`font-semibold ${item.total_diff !== 0 ? "text-red-600" : "text-green-600"}`}>
                            {item.total_diff !== 0 ? formatINR(item.total_diff) : "Match"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredResults.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Search className="h-8 w-8 text-muted-foreground/50" />
                          <p className="text-muted-foreground font-medium">No records found matching your filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/10">
              <p className="text-xs text-muted-foreground font-medium">
                Showing {filteredResults.length} of {data.results.length} records
              </p>
              <div className="flex items-center gap-2">
                <Link href="/dashboard/reconciliation/import">
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    Re-upload
                  </Button>
                </Link>
                <Link href="/dashboard/reconciliation/resolution">
                  <Button size="sm" className="h-8 text-xs">
                    Resolve Discrepancies
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
