"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, FileText, Users } from "lucide-react";
import Link from "next/link";

const clientsData: Record<string, { name: string; gstin: string }> = {
  "1": { name: "ABC Traders", gstin: "24ABCDE1234F1Z5" },
  "2": { name: "Shree Metals Pvt Ltd", gstin: "27FGHIJ5678K2L6" },
  "3": { name: "Global Tech Solutions", gstin: "29MNOPQ9012R3S7" },
  "4": { name: "Sunrise Industries", gstin: "33TUVWX3456Y4Z8" },
  "5": { name: "Bharat Enterprises", gstin: "07ABCDE7890F5G9" },
};

function CompleteContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const clientId = params.clientId as string;
  const month = searchParams.get("month") || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const sent = searchParams.get("sent") === "true";
  const client = clientsData[clientId] || { name: "Unknown Client", gstin: "N/A" };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border-border">
        <CardContent className="p-8 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {month} Reconciliation Completed
          </h1>
          <p className="text-muted-foreground mb-6">
            {client.name}
          </p>

          {sent && (
            <div className="bg-primary/5 rounded-lg p-4 mb-6">
              <p className="text-sm text-primary">
                Report sent to Senior CA for review
              </p>
            </div>
          )}

          {/* Next Actions */}
          <div className="space-y-3 mb-8">
            <Link href="/dashboard/clients" className="block">
              <Button className="w-full" size="lg">
                <Users className="mr-2 h-4 w-4" />
                Start Next Client
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link
              href={`/dashboard/clients/${clientId}/reconcile/summary?month=${encodeURIComponent(month)}`}
              className="block"
            >
              <Button variant="outline" className="w-full bg-transparent" size="lg">
                <FileText className="mr-2 h-4 w-4" />
                View Report
              </Button>
            </Link>
          </div>

          {/* Closing Message */}
          <p className="text-sm text-muted-foreground">
            Good job. See you next month.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <CompleteContent />
    </Suspense>
  );
}
