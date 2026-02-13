"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  AlertCircle,
  Copy,
  CheckCircle,
  Mail,
  Loader2,
} from "lucide-react";

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
      }
    } catch (err) {
      // fallback: generate a basic template locally
      setEmail({
        to_vendor: vendor.name,
        subject: `GST Reconciliation: ${vendor.discrepancies.length} Invoice Discrepancy(ies) — Action Required`,
        body: `Dear ${vendor.name} Team,\n\nDuring our GST reconciliation, we identified discrepancies in ${vendor.discrepancies.length} invoice(s).\n\nPlease review and respond at your earliest convenience.\n\nBest regards,\nAccounts Team`,
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
      <div className="flex flex-col min-h-screen">
        <AppHeader title="Resolution Center" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Discrepancies to Resolve</h2>
            <p className="text-muted-foreground mb-6">Run a reconciliation first to see vendor discrepancies.</p>
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

  if (vendors.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader title="Resolution Center" />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">All Records Matched!</h2>
            <p className="text-muted-foreground mb-6">No discrepancies found. All invoices matched perfectly.</p>
            <Link href="/dashboard/reconciliation">
              <Button variant="outline">← Back to Results</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Resolution Center" />

      <div className="flex-1 p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Vendor Resolution Center</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Generate ready-to-send emails for vendors with invoice discrepancies. Copy & paste into your email client.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vendor List */}
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Priority Vendors</CardTitle>
              <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                {vendors.length} Action Required
              </span>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
              {vendors.map((vendor) => (
                <button
                  key={vendor.gstin || vendor.name}
                  onClick={() => setSelectedVendor(vendor)}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${selectedVendor?.gstin === vendor.gstin && selectedVendor?.name === vendor.name
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                        {vendor.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{vendor.gstin || "No GSTIN"}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      {formatINR(vendor.totalDiff)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{vendor.invoiceCount} Invoice{vendor.invoiceCount > 1 ? "s" : ""}</span>
                    <span className="text-red-500">{vendor.discrepancies[0]?.discrepancy_type.replace("_", " ")}</span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Email Composer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Discrepancy Summary */}
            {selectedVendor && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{selectedVendor.name} — Discrepancies</CardTitle>
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                      {selectedVendor.invoiceCount} issue{selectedVendor.invoiceCount > 1 ? "s" : ""}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase">Invoice #</th>
                          <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase">Type</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase">PR Amount</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase">GSTR-2B</th>
                          <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground uppercase">Diff</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVendor.discrepancies.map((d, i) => (
                          <tr key={i} className="border-b border-border last:border-0">
                            <td className="py-2 px-3 font-medium">{d.invoice_no}</td>
                            <td className="py-2 px-3">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                {d.discrepancy_type.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">{d.pr_amount > 0 ? formatINR(d.pr_amount) : "—"}</td>
                            <td className="py-2 px-3 text-right">{d.gstr2b_amount > 0 ? formatINR(d.gstr2b_amount) : "—"}</td>
                            <td className="py-2 px-3 text-right text-red-600 font-medium">
                              {d.difference !== 0 ? formatINR(d.difference) : "—"}
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
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Generated Email
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Copy and paste this into your email client to send to the vendor.
                  </p>
                </div>
                <Button
                  onClick={handleCopy}
                  disabled={!email || isGenerating}
                  variant={copied ? "default" : "outline"}
                  className={copied ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy to Clipboard
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {isGenerating ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
                    <span className="text-muted-foreground">Generating email template...</span>
                  </div>
                ) : email ? (
                  <>
                    {/* Subject Line */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Subject
                      </label>
                      <div className="mt-1 p-3 bg-muted/30 rounded-lg text-sm font-medium text-foreground border border-border">
                        {email.subject}
                      </div>
                    </div>

                    {/* Email Body */}
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Body
                      </label>
                      <Textarea
                        value={email.body}
                        onChange={(e) => setEmail({ ...email, body: e.target.value })}
                        rows={16}
                        className="mt-1 font-mono text-sm resize-y"
                      />
                    </div>

                    {/* Copy Hint */}
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <AlertCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Click &quot;Copy to Clipboard&quot; to copy the full email (subject + body). Then paste it into your email client (Gmail, Outlook, etc.).
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    Select a vendor to generate an email template.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
