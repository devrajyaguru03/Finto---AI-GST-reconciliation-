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
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const clientsData: Record<string, { name: string; gstin: string }> = {
  "1": { name: "ABC Traders", gstin: "24ABCDE1234F1Z5" },
  "2": { name: "Shree Metals Pvt Ltd", gstin: "27FGHIJ5678K2L6" },
  "3": { name: "Global Tech Solutions", gstin: "29MNOPQ9012R3S7" },
  "4": { name: "Sunrise Industries", gstin: "33TUVWX3456Y4Z8" },
  "5": { name: "Bharat Enterprises", gstin: "07ABCDE7890F5G9" },
};

interface UploadedFile {
  name: string;
  size: string;
  type: "excel" | "json";
}

function UploadContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientId = params.clientId as string;
  const month = searchParams.get("month") || "July 2024";
  const client = clientsData[clientId] || { name: "Unknown Client", gstin: "N/A" };

  const [purchaseRegister, setPurchaseRegister] = useState<UploadedFile | null>(null);
  const [gstr2b, setGstr2b] = useState<UploadedFile | null>(null);
  const [dragOverPurchase, setDragOverPurchase] = useState(false);
  const [dragOverGstr, setDragOverGstr] = useState(false);

  const handleDrop = (
    e: React.DragEvent,
    setFile: (file: UploadedFile | null) => void,
    type: "excel" | "json"
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type,
      });
    }
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: UploadedFile | null) => void,
    type: "excel" | "json"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type,
      });
    }
  };

  const canProceed = purchaseRegister && gstr2b;

  const handleStartReconciliation = () => {
    router.push(`/dashboard/clients/${clientId}/reconcile/processing?month=${encodeURIComponent(month)}`);
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
          {client.name} - {month} Reconciliation
        </p>
      </div>

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

            {purchaseRegister ? (
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                        {purchaseRegister.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {purchaseRegister.size}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPurchaseRegister(null)}
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
                  handleDrop(e, setPurchaseRegister, "excel");
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
                  onChange={(e) => handleFileSelect(e, setPurchaseRegister, "excel")}
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

            {gstr2b ? (
              <div className="border border-border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                        {gstr2b.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{gstr2b.size}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setGstr2b(null)}
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
                  handleDrop(e, setGstr2b, "json");
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
                  accept=".xlsx,.xls,.json"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, setGstr2b, "json")}
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-3 text-center">
              Accepted formats: Excel, JSON
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
          Start Reconciliation
          <ArrowRight className="ml-2 h-4 w-4" />
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
