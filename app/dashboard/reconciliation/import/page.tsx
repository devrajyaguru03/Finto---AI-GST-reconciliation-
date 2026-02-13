"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  FileSpreadsheet,
  FileJson,
  X,
  CheckCircle,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function DataImportPage() {
  const router = useRouter();
  const [prFile, setPrFile] = useState<File | null>(null);
  const [gstrFile, setGstrFile] = useState<File | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const prInputRef = useRef<HTMLInputElement>(null);
  const gstrInputRef = useRef<HTMLInputElement>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDrop = useCallback(
    (type: "pr" | "gstr") => (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        if (type === "pr") setPrFile(file);
        else setGstrFile(file);
      }
    },
    []
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleReconcile = async () => {
    if (!prFile || !gstrFile) {
      setError("Please upload both files before reconciling.");
      return;
    }

    setError("");
    setIsReconciling(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("pr_file", prFile);
      formData.append("gstr2b_file", gstrFile);

      setProgress(30);

      const res = await fetch(`${BACKEND_URL}/api/reconcile`, {
        method: "POST",
        body: formData,
      });

      setProgress(80);

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Reconciliation failed. Check your file formats.");
        setIsReconciling(false);
        setProgress(0);
        return;
      }

      setProgress(100);

      // Store results in sessionStorage for other pages to use
      sessionStorage.setItem("reconciliation_results", JSON.stringify(data));

      // Redirect to results page
      setTimeout(() => router.push("/dashboard/reconciliation"), 300);
    } catch (err) {
      setError("Cannot connect to backend. Make sure it's running on port 8000.");
      setIsReconciling(false);
      setProgress(0);
    }
  };

  const FileIcon = ({ file }: { file: File }) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "json") return <FileJson className="h-5 w-5 text-amber-600" />;
    return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Reconciliation" />

      <div className="flex-1 p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm mb-4">
          <Link href="/dashboard/reconciliation" className="text-muted-foreground hover:text-foreground">
            Reconciliation
          </Link>
          <span className="text-muted-foreground">{">"}</span>
          <span className="text-primary font-medium">Import Data</span>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Upload & Reconcile</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your Purchase Register and GSTR-2B files. We&apos;ll parse and reconcile them automatically.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm border border-destructive/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Upload Zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Purchase Register Upload */}
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer ${prFile ? "border-green-400 bg-green-500/5" : "hover:border-primary/50"
              }`}
            onDrop={handleDrop("pr")}
            onDragOver={handleDragOver}
            onClick={() => prInputRef.current?.click()}
          >
            <CardContent className="p-8 text-center">
              <input
                ref={prInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setPrFile(e.target.files[0]);
                }}
              />
              {prFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileIcon file={prFile} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{prFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(prFile.size)}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrFile(null);
                    }}
                    className="ml-2 p-1 hover:bg-muted rounded"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Upload Purchase Register
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag & drop your Tally export or Excel file here
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground">.xlsx</span>
                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground">.csv</span>
                  </div>
                  <Button variant="link" className="text-primary">Browse files</Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* GSTR-2B Upload */}
          <Card
            className={`border-2 border-dashed transition-colors cursor-pointer ${gstrFile ? "border-green-400 bg-green-500/5" : "hover:border-primary/50"
              }`}
            onDrop={handleDrop("gstr")}
            onDragOver={handleDragOver}
            onClick={() => gstrInputRef.current?.click()}
          >
            <CardContent className="p-8 text-center">
              <input
                ref={gstrInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) setGstrFile(e.target.files[0]);
                }}
              />
              {gstrFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileIcon file={gstrFile} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{gstrFile.name}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(gstrFile.size)}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-500 ml-2" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGstrFile(null);
                    }}
                    className="ml-2 p-1 hover:bg-muted rounded"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Upload GSTR-2B
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag & drop Excel or CSV file from portal
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground">.xlsx</span>
                    <span className="px-2 py-1 bg-muted rounded text-xs font-medium text-muted-foreground">.csv</span>
                  </div>
                  <Button variant="link" className="text-primary">Browse files</Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar (during reconciliation) */}
        {isReconciling && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {progress < 30
                    ? "Uploading files..."
                    : progress < 80
                      ? "Parsing & reconciling invoices..."
                      : "Finalizing results..."}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Summary */}
        {(prFile || gstrFile) && !isReconciling && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Ready for Reconciliation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">{prFile?.name || "Not uploaded"}</p>
                    <p className="text-xs text-muted-foreground">Purchase Register</p>
                  </div>
                  {prFile && <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />}
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">{gstrFile?.name || "Not uploaded"}</p>
                    <p className="text-xs text-muted-foreground">GSTR-2B</p>
                  </div>
                  {gstrFile && <CheckCircle className="h-4 w-4 text-green-500 ml-auto" />}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
          <Link href="/dashboard/reconciliation">
            <Button variant="ghost" className="text-muted-foreground">
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleReconcile}
            disabled={!prFile || !gstrFile || isReconciling}
            className="gradient-bg text-white btn-shine"
          >
            {isReconciling ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            {isReconciling ? "Reconciling..." : "Proceed to Reconciliation"}
          </Button>
        </div>
      </div>
    </div>
  );
}
