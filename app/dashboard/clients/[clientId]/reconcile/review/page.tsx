"use client";

import { useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  FileCheck,
  MessageSquare,
  Download,
  Send,
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

const checklistItems = [
  { id: "1", label: "Purchase Register processed", completed: true },
  { id: "2", label: "GSTR-2B matched", completed: true },
  { id: "3", label: "Exceptions reviewed", completed: true },
  { id: "4", label: "Notes prepared", completed: true },
];

function ReviewContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientId = params.clientId as string;
  const month = searchParams.get("month") || "July 2024";
  const client = clientsData[clientId] || { name: "Unknown Client", gstin: "N/A" };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      router.push(
        `/dashboard/clients/${clientId}/reconcile/complete?month=${encodeURIComponent(month)}`
      );
    }, 1500);
  };

  const handleSendToSenior = () => {
    router.push(
      `/dashboard/clients/${clientId}/reconcile/complete?month=${encodeURIComponent(month)}&sent=true`
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href={`/dashboard/clients/${clientId}/reconcile/notes?month=${encodeURIComponent(month)}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Notes
      </Link>

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-4">
          <FileCheck className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Reconciliation Ready</h1>
        <p className="text-muted-foreground mt-1">
          {client.name} - {month}
        </p>
      </div>

      {/* Checklist */}
      <Card className="border-border">
        <CardContent className="p-6">
          <h3 className="font-semibold text-foreground mb-4">Completion Checklist</h3>
          <div className="space-y-3">
            {checklistItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <CheckCircle2
                  className={cn(
                    "h-5 w-5",
                    item.completed ? "text-emerald-600" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-sm",
                    item.completed ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Button
          variant="outline"
          size="lg"
          className="h-auto py-4 flex-col gap-2 bg-transparent"
          onClick={handleGenerateReport}
          disabled={isGenerating}
        >
          <Download className="h-5 w-5" />
          <span>{isGenerating ? "Generating..." : "Generate Reconciliation Report"}</span>
        </Button>
        <Button
          size="lg"
          className="h-auto py-4 flex-col gap-2"
          onClick={handleSendToSenior}
        >
          <Send className="h-5 w-5" />
          <span>Send to Senior CA</span>
        </Button>
      </div>

      {/* Confidence message */}
      <Card className="border-border bg-emerald-50/50">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-emerald-700">
            Your work is done properly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <ReviewContent />
    </Suspense>
  );
}
