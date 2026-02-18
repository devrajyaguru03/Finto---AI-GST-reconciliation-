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
  CloudUpload,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
      setTimeout(() => router.push("/dashboard/reconciliation"), 500);
    } catch (err) {
      setError("Cannot connect to backend. Make sure it's running on port 8000.");
      setIsReconciling(false);
      setProgress(0);
    }
  };

  const FileIcon = ({ file }: { file: File }) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "json") return <FileJson className="h-6 w-6 text-amber-500" />;
    return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <AppHeader title="Import Data" />

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6 text-muted-foreground">
          <Link href="/dashboard/reconciliation" className="hover:text-foreground transition-colors">
            Reconciliation
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Import</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8 text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Upload Files</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Upload your Purchase Register and GSTR-2B files to start the automated reconciliation process.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm border border-destructive/20 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Upload Zones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Purchase Register Upload */}
          <Card
            className={`border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden group hover:border-primary/50 hover:shadow-lg ${prFile ? "border-green-500/50 bg-green-500/5" : "bg-card"
              }`}
            onDrop={handleDrop("pr")}
            onDragOver={handleDragOver}
            onClick={() => prInputRef.current?.click()}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
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
                <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                  <div className="p-4 bg-green-100/50 rounded-full ring-4 ring-green-100/30">
                    <FileIcon file={prFile} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground text-lg">{prFile.name}</p>
                    <p className="text-sm text-muted-foreground">{formatSize(prFile.size)} • Ready</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" /> Uploaded
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrFile(null);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 group-hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <CloudUpload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      Purchase Register
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-[200px]">
                      Drag & drop or click to upload Tally export / Excel
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="font-mono text-xs">.xlsx</Badge>
                    <Badge variant="secondary" className="font-mono text-xs">.csv</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* GSTR-2B Upload */}
          <Card
            className={`border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden group hover:border-primary/50 hover:shadow-lg ${gstrFile ? "border-green-500/50 bg-green-500/5" : "bg-card"
              }`}
            onDrop={handleDrop("gstr")}
            onDragOver={handleDragOver}
            onClick={() => gstrInputRef.current?.click()}
          >
            <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
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
                <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
                  <div className="p-4 bg-green-100/50 rounded-full ring-4 ring-green-100/30">
                    <FileIcon file={gstrFile} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground text-lg">{gstrFile.name}</p>
                    <p className="text-sm text-muted-foreground">{formatSize(gstrFile.size)} • Ready</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" /> Uploaded
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGstrFile(null);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 group-hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      GSTR-2B File
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-[200px]">
                      Drag & drop or click to upload Excel / JSON from portal
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary" className="font-mono text-xs">.json</Badge>
                    <Badge variant="secondary" className="font-mono text-xs">.xlsx</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar (during reconciliation) */}
        {isReconciling && (
          <Card className="mb-8 border-primary/20 shadow-lg shadow-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 rounded-full bg-primary/10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
                <div className="space-y-1">
                  <span className="text-lg font-semibold text-foreground block">
                    {progress < 30
                      ? "Uploading files..."
                      : progress < 80
                        ? "Analysing & reconciling invoices..."
                        : "Finalizing reconciliation report..."}
                  </span>
                  <span className="text-xs text-muted-foreground">Please wait while we process your data</span>
                </div>
                <span className="ml-auto font-mono text-xl font-bold text-primary">{progress}%</span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-border mt-auto">
          <Link href="/dashboard/reconciliation">
            <Button variant="ghost" size="lg" className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleReconcile}
            disabled={!prFile || !gstrFile || isReconciling}
            size="lg"
            className="rounded-full px-8 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02]"
          >
            {isReconciling ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                Proceed to Reconciliation
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
