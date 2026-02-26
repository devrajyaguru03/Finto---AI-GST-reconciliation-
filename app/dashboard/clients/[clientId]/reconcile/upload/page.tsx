"use client";

import React from "react"

import { useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  FileSpreadsheet,
  FileJson,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface UploadedFileInfo {
  name: string;
  size: string;
  type: "excel" | "json";
}

function UploadContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientId = params.clientId as string;
  const month = searchParams.get("month") || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Get client name from sessionStorage (stored by sidebar/client list)
  const clientName = typeof window !== "undefined"
    ? sessionStorage.getItem(`client_name_${clientId}`) || "Client"
    : "Client";

  const [purchaseRegisterInfo, setPurchaseRegisterInfo] = useState<UploadedFileInfo | null>(null);
  const [gstr2bInfo, setGstr2bInfo] = useState<UploadedFileInfo | null>(null);
  const [purchaseRegisterFile, setPurchaseRegisterFile] = useState<File | null>(null);
  const [gstr2bFile, setGstr2bFile] = useState<File | null>(null);
  const [dragOverPurchase, setDragOverPurchase] = useState(false);
  const [dragOverGstr, setDragOverGstr] = useState(false);
  const [isReconciling, setIsReconciling] = useState(false);
  const [error, setError] = useState("");

  const handleDrop = (
    e: React.DragEvent,
    setInfo: (f: UploadedFileInfo | null) => void,
    setFile: (f: File | null) => void,
    type: "excel" | "json"
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFile(file);
      setInfo({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type,
      });
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setInfo: (f: UploadedFileInfo | null) => void,
    setFile: (f: File | null) => void,
    type: "excel" | "json"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      setInfo({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type,
      });
    }
  };

  const canProceed = purchaseRegisterFile && gstr2bFile && !isReconciling;

  const handleStartReconciliation = async () => {
    if (!purchaseRegisterFile || !gstr2bFile) return;

    setError("");
    setIsReconciling(true);

    // Navigate to processing page immediately (shows animation)
    // Store files info so processing page can show progress
    sessionStorage.setItem(`reconcile_status_${clientId}`, "processing");
    sessionStorage.setItem(`reconcile_month_${clientId}`, month);
    sessionStorage.setItem(`client_name_${clientId}`, clientName);

    try {
      const formData = new FormData();
      formData.append("pr_file", purchaseRegisterFile);
      formData.append("gstr2b_file", gstr2bFile);
      formData.append("client_id", clientId);

      const token = localStorage.getItem("auth_token") || "";

      const res = await fetch(`${BACKEND_URL}/api/reconcile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Reconciliation failed. Check your file formats.");
        setIsReconciling(false);
        sessionStorage.removeItem(`reconcile_status_${clientId}`);
        return;
      }

      // Store results in sessionStorage keyed by clientId
      sessionStorage.setItem(`reconcile_results_${clientId}`, JSON.stringify(data));
      sessionStorage.setItem(`reconcile_status_${clientId}`, "done");

      // Navigate to processing page (it will show animation then redirect to summary)
      router.push(`/dashboard/clients/${clientId}/reconcile/processing?month=${encodeURIComponent(month)}`);
    } catch (err) {
      setError("Cannot connect to backend. Make sure it's running on port 8000.");
      setIsReconciling(false);
      sessionStorage.removeItem(`reconcile_status_${clientId}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href={`/dashboard/clients/${clientId}/reconcile?month=${encodeURIComponent(month)}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Required Files</h1>
        <p className="text-muted-foreground mt-1">
          {clientName} - {month} Reconciliation
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm border border-destructive/20 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Upload Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Purchase Register Upload */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Purchase Register</h3>
                <p className="text-xs text-muted-foreground">
                  Export from Tally / Excel
                </p>
              </div>
            </div>

            {purchaseRegisterInfo ? (
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                        {purchaseRegisterInfo.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {purchaseRegisterInfo.size}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setPurchaseRegisterInfo(null);
                      setPurchaseRegisterFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  dragOverPurchase
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverPurchase(true);
                }}
                onDragLeave={() => setDragOverPurchase(false)}
                onDrop={(e) => {
                  setDragOverPurchase(false);
                  handleDrop(e, setPurchaseRegisterInfo, setPurchaseRegisterFile, "excel");
                }}
                onClick={() => document.getElementById("purchase-input")?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag & drop file here
                </p>
                <p className="text-xs text-muted-foreground mb-3">or</p>
                <Button variant="link" className="text-primary p-0 h-auto">
                  Browse File
                </Button>
                <input
                  id="purchase-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, setPurchaseRegisterInfo, setPurchaseRegisterFile, "excel")}
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3 text-center">
              Accepted formats: Excel (.xlsx, .xls), CSV
            </p>
          </CardContent>
        </Card>

        {/* GSTR-2B Upload */}
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <FileJson className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">GSTR-2B</h3>
                <p className="text-xs text-muted-foreground">
                  Downloaded from GST portal
                </p>
              </div>
            </div>

            {gstr2bInfo ? (
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                        {gstr2bInfo.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{gstr2bInfo.size}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setGstr2bInfo(null);
                      setGstr2bFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  dragOverGstr
                    ? "border-emerald-500 bg-emerald-500/5"
                    : "border-border hover:border-emerald-500/50"
                )}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverGstr(true);
                }}
                onDragLeave={() => setDragOverGstr(false)}
                onDrop={(e) => {
                  setDragOverGstr(false);
                  handleDrop(e, setGstr2bInfo, setGstr2bFile, "json");
                }}
                onClick={() => document.getElementById("gstr-input")?.click()}
              >
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag & drop file here
                </p>
                <p className="text-xs text-muted-foreground mb-3">or</p>
                <Button variant="link" className="text-emerald-600 p-0 h-auto">
                  Browse File
                </Button>
                <input
                  id="gstr-input"
                  type="file"
                  accept=".xlsx,.xls,.csv,.json"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, setGstr2bInfo, setGstr2bFile, "json")}
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3 text-center">
              Accepted formats: Excel, CSV, JSON
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="flex justify-end">
        <Button
          onClick={handleStartReconciliation}
          disabled={!canProceed}
          size="lg"
          className="min-w-[200px]"
        >
          {isReconciling ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Reconciling...
            </>
          ) : (
            <>
              Start Reconciliation
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <UploadContent />
    </Suspense>
  );
}
