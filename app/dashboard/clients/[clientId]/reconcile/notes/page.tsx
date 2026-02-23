"use client";

import { useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, FileText, Sparkles, Edit3 } from "lucide-react";
import Link from "next/link";

const clientsData: Record<string, { name: string; gstin: string }> = {
  "1": { name: "ABC Traders", gstin: "24ABCDE1234F1Z5" },
  "2": { name: "Shree Metals Pvt Ltd", gstin: "27FGHIJ5678K2L6" },
  "3": { name: "Global Tech Solutions", gstin: "29MNOPQ9012R3S7" },
  "4": { name: "Sunrise Industries", gstin: "33TUVWX3456Y4Z8" },
  "5": { name: "Bharat Enterprises", gstin: "07ABCDE7890F5G9" },
};

const defaultNotes = `Rs. 45,000 ITC pending due to mismatches in 3 invoices.

2 vendors have not fully reported data in their GSTR-1 returns.

ITC recommended to be deferred or reviewed before claim.

Summary:
- Safe to claim: Rs. 4,10,000
- Needs review: Rs. 45,000
- Do not claim: Rs. 10,000
- Likely next month: Rs. 15,000`;

function NotesContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientId = params.clientId as string;
  const month = searchParams.get("month") || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const client = clientsData[clientId] || { name: "Unknown Client", gstin: "N/A" };

  const [notes, setNotes] = useState(defaultNotes);
  const [isEditing, setIsEditing] = useState(false);

  const handleContinue = () => {
    router.push(
      `/dashboard/clients/${clientId}/reconcile/review?month=${encodeURIComponent(month)}`
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href={`/dashboard/clients/${clientId}/reconcile/summary?month=${encodeURIComponent(month)}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Summary
      </Link>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            System Notes for Senior Review
          </h1>
        </div>
        <p className="text-muted-foreground">
          {client.name} - {month}
        </p>
      </div>

      {/* Auto-generated Badge */}
      <div className="flex items-center gap-2 text-sm text-primary">
        <Sparkles className="h-4 w-4" />
        <span>Auto-generated based on reconciliation results</span>
      </div>

      {/* Notes Card */}
      <Card className="border-border">
        <CardContent className="p-6">
          {isEditing ? (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[250px] text-sm leading-relaxed"
              placeholder="Enter notes for senior review..."
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-sans bg-transparent p-0 m-0">
                {notes}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Toggle */}
      <div className="flex justify-start">
        <Button
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Edit3 className="mr-2 h-4 w-4" />
          {isEditing ? "Done Editing" : "Edit Notes"}
        </Button>
      </div>

      {/* Info */}
      <Card className="border-border bg-muted/30">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            You didn{"'"}t have to write anything. System did the work.
          </p>
        </CardContent>
      </Card>

      {/* Continue */}
      <div className="flex justify-end">
        <Button onClick={handleContinue}>
          Continue to Final Review
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function NotesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <NotesContent />
    </Suspense>
  );
}
