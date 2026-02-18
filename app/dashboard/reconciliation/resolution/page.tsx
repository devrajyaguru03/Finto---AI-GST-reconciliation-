"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  AlertCircle,
  Copy,
  CheckCircle,
  Mail,
  Loader2,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const formatINR = (amount: number) => {
  return `₹${Math.abs(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface VendorGroup {
  name: string;
  gstin: string;
  totalDiff: number;
  invoiceCount: number;
  discrepancies: Array<{
    invoice_no: string;
    invoice_date: string | null;
    pr_amount: number;
    gstr2b_amount: number;
    difference: number;
    discrepancy_type: string;
  }>;
}

interface EmailTemplate {
  to_vendor: string;
  subject: string;
  body: string;
  discrepancy_type: string;
  invoice_count: number;
}

export default function ResolutionCenterPage() {
  const [vendors, setVendors] = useState<VendorGroup[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorGroup | null>(null);
  const [email, setEmail] = useState<EmailTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasData, setHasData] = useState(true);

  // Load reconciliation results and group by vendor
  useEffect(() => {
    const stored = sessionStorage.getItem("reconciliation_results");
    if (!stored) {
      setHasData(false);
      return;
    }

    try {
      const data = JSON.parse(stored);
      const vendorMap: Record<string, VendorGroup> = {};

      for (const result of data.results) {
        if (result.status === "exact_match") continue; // skip matched

        const pr = result.pr_invoice;
        const gstr = result.gstr2b_invoice;
        const inv = pr || gstr;
        if (!inv) continue;

        const key = inv.vendor_gstin || inv.vendor_name || "Unknown";
        if (!vendorMap[key]) {
          vendorMap[key] = {
            name: inv.vendor_name || "Unknown Vendor",
            gstin: inv.vendor_gstin || "",
            totalDiff: 0,
            invoiceCount: 0,
            discrepancies: [],
          };
        }

        const diff = Math.abs(result.total_diff || 0);
        vendorMap[key].totalDiff += diff || (pr?.taxable_value || gstr?.taxable_value || 0);
        vendorMap[key].invoiceCount += 1;
        vendorMap[key].discrepancies.push({
          invoice_no: inv.invoice_no || "—",
          invoice_date: inv.invoice_date,
          pr_amount: pr?.taxable_value || 0,
          gstr2b_amount: gstr?.taxable_value || 0,
          difference: result.total_diff || 0,
          discrepancy_type: result.status,
        });
      }

      const sorted = Object.values(vendorMap).sort((a, b) => b.totalDiff - a.totalDiff);
      setVendors(sorted);
      if (sorted.length > 0) {
        setSelectedVendor(sorted[0]);
      }
    } catch {
      setHasData(false);
    }
  }, []);

  // Generate email when vendor is selected
  useEffect(() => {
    if (!selectedVendor) return;
    generateEmail(selectedVendor);
  }, [selectedVendor]);

  const generateEmail = async (vendor: VendorGroup) => {
    setIsGenerating(true);
    setEmail(null);

    try {
      // Mock API call simulation first, or real backend call
      const res = await fetch(`${BACKEND_URL}/api/email/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          discrepancies: vendor.discrepancies.map((d) => ({
            vendor_name: vendor.name,
            vendor_gstin: vendor.gstin,
            invoice_no: d.invoice_no,
            invoice_date: d.invoice_date,
            pr_amount: d.pr_amount,
            gstr2b_amount: d.gstr2b_amount,
            difference: d.difference,
            discrepancy_type: d.discrepancy_type,
          })),
          sender_name: "Accounts Team",
          sender_company: "Our Company",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.emails && data.emails.length > 0) {
          setEmail(data.emails[0]);
        }
      } else {
        throw new Error("Failed to generate");
      }
    } catch (err) {
      // fallback: generate a basic template locally
      // This is robust and ensures functionality even if backend ML service is down
      setEmail({
        to_vendor: vendor.name,
        subject: `GST Reconciliation Discrepancies - ${vendor.name} (${vendor.invoiceCount} invoices)`,
        body: `Dear ${vendor.name} Team,\n\nWe are currently reconciling our GST records and have noted some discrepancies in the following invoices filed in GSTR-2B versus our records:\n\n` +
          vendor.discrepancies.map(d => `- Inv #${d.invoice_no}: Difference of ${formatINR(d.difference)} (${d.discrepancy_type.replace(/_/g, ' ')})`).join('\n') +
          `\n\nPlease verify these records and provide clarification or issue credit notes/amendments as necessary.\n\nBest regards,\nAccounts Team`,
        discrepancy_type: vendor.discrepancies[0]?.discrepancy_type || "amount_mismatch",
        invoice_count: vendor.discrepancies.length,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!email) return;
    const fullText = `Subject: ${email.subject}\n\n${email.body}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = fullText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!hasData) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/20">
        <AppHeader title="Resolution Center" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="flex flex-col items-center text-center max-w-md space-y-4">
            <div className="p-4 rounded-full bg-primary/10 ring-1 ring-primary/20">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">No Discrepancies</h2>
            <p className="text-muted-foreground text-lg">
              Run a reconciliation first to see vendor discrepancies here.
            </p>
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

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/20">
        <AppHeader title="Resolution Center" />
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          <div className="flex flex-col items-center text-center max-w-md space-y-4">
            <div className="p-4 rounded-full bg-green-100 ring-1 ring-green-200">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">All Reconciled!</h2>
            <p className="text-muted-foreground text-lg">
              Great job! No discrepancies found. All invoices matched perfectly.
            </p>
          </div>
          <Link href="/dashboard/reconciliation">
            <Button variant="outline" size="lg">← Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <AppHeader title="Resolution Center" />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Vendor Resolution Center</h2>
            <p className="text-muted-foreground mt-1">
              Select a vendor to generate ready-to-send emails for resolving discrepancies.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)] min-h-[600px]">
          {/* Vendor List */}
          <Card className="lg:col-span-4 flex flex-col overflow-hidden h-full border-r-0 lg:border-r">
            <CardHeader className="bg-muted/10 pb-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Priority Vendors</CardTitle>
                <Badge variant="destructive" className="rounded-full px-2.5">
                  {vendors.length} Action Needed
                </Badge>
              </div>
              <div className="relative mt-2">
                {/* Search placeholder for future */}
                <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter vendors..."
                  className="w-full text-sm bg-background border rounded-md py-2 pl-9 pr-4 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1 bg-muted/5">
              <div className="divide-y divide-border/50">
                {vendors.map((vendor) => (
                  <button
                    key={vendor.gstin || vendor.name}
                    onClick={() => setSelectedVendor(vendor)}
                    className={`w-full p-4 text-left transition-all hover:bg-muted/50 focus:outline-none ${selectedVendor?.gstin === vendor.gstin && selectedVendor?.name === vendor.name
                      ? "bg-primary/5 border-l-4 border-l-primary"
                      : "border-l-4 border-l-transparent"
                      }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <p className={`text-sm font-semibold truncate pr-2 ${selectedVendor?.gstin === vendor.gstin ? "text-primary" : "text-foreground"}`}>
                        {vendor.name}
                      </p>
                      <span className="text-xs font-bold text-destructive whitespace-nowrap">
                        {formatINR(vendor.totalDiff)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1.5">
                      <span className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">{vendor.gstin || "No GSTIN"}</span>
                      <span>{vendor.invoiceCount} inv</span>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Details & Email - Right Side */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full overflow-y-auto">
            {/* Discrepancy Summary */}
            {selectedVendor && (
              <Card className="flex-shrink-0">
                <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/10 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {selectedVendor.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base">{selectedVendor.name}</CardTitle>
                      <CardDescription className="text-xs font-mono mt-0.5">{selectedVendor.gstin}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                    {selectedVendor.invoiceCount} Issue{selectedVendor.invoiceCount > 1 ? "s" : ""} Found
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[250px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30 sticky top-0 z-10">
                        <tr>
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase">Invoice #</th>
                          <th className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase">Issue</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase">PR</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase">GSTR-2B</th>
                          <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase">Diff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {selectedVendor.discrepancies.map((d, i) => (
                          <tr key={i} className="hover:bg-muted/10">
                            <td className="py-2.5 px-4 font-medium">{d.invoice_no}</td>
                            <td className="py-2.5 px-4">
                              <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-100 px-1.5 py-0 h-5">
                                {d.discrepancy_type.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="py-2.5 px-4 text-right text-muted-foreground">{d.pr_amount > 0 ? formatINR(d.pr_amount) : "-"}</td>
                            <td className="py-2.5 px-4 text-right text-muted-foreground">{d.gstr2b_amount > 0 ? formatINR(d.gstr2b_amount) : "-"}</td>
                            <td className="py-2.5 px-4 text-right font-medium text-destructive">
                              {d.difference !== 0 ? formatINR(d.difference) : "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated Email */}
            <Card className="flex-1 flex flex-col shadow-lg border-primary/20">
              <CardHeader className="py-4 border-b flex flex-row items-center justify-between bg-primary/5">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base text-primary">Email Draft</CardTitle>
                  </div>
                </div>
                <Button
                  onClick={handleCopy}
                  disabled={!email || isGenerating}
                  size="sm"
                  variant={copied ? "default" : "outline"}
                  className={copied ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : "bg-background"}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-3.5 w-3.5 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 mr-2" />
                      Copy Draft
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-4 flex flex-col gap-4">
                {isGenerating ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                    <p>Generating personalized email using AI...</p>
                  </div>
                ) : email ? (
                  <div className="flex-1 flex flex-col gap-4 animate-in fade-in duration-300">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</label>
                      <div className="p-3 bg-background border rounded-md text-sm font-medium shadow-sm">
                        {email.subject}
                      </div>
                    </div>
                    <div className="space-y-1 flex-1 flex flex-col">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Message Body</label>
                      <Textarea
                        value={email.body}
                        onChange={(e) => setEmail({ ...email, body: e.target.value })}
                        className="flex-1 font-mono text-sm resize-none bg-background leading-relaxed p-4 shadow-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed border-muted rounded-lg m-4">
                    <Mail className="h-12 w-12 mb-2 opacity-50" />
                    <p>Select a vendor to generate an email draft</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
