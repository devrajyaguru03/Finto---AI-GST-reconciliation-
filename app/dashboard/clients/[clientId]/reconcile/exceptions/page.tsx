"use client";

import { useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Clock,
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

const exceptions = [
  {
    id: "1",
    invoiceNo: "INV-245",
    vendor: "Shree Metals",
    issue: "Amount mismatch",
    difference: 1200,
    explanation:
      "The vendor has reported a lower taxable value in GSTR-1. This can affect ITC if claimed without correction.",
    suggestedAction: "Review before claiming",
    riskLevel: "medium",
    status: "pending",
  },
  {
    id: "2",
    invoiceNo: "INV-312",
    vendor: "Global Supplies",
    issue: "Invoice not found in 2B",
    difference: 8500,
    explanation:
      "This invoice exists in your Purchase Register but is not reflected in GSTR-2B. The vendor may not have filed their return.",
    suggestedAction: "Defer to next month",
    riskLevel: "high",
    status: "pending",
  },
  {
    id: "3",
    invoiceNo: "INV-289",
    vendor: "Tech Solutions Ltd",
    issue: "GSTIN mismatch",
    difference: 3200,
    explanation:
      "The GSTIN in your records differs slightly from what's reported in GSTR-2B. This could be a data entry error.",
    suggestedAction: "Review before claiming",
    riskLevel: "low",
    status: "pending",
  },
];

function ExceptionsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientId = params.clientId as string;
  const month = searchParams.get("month") || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const client = clientsData[clientId] || { name: "Unknown Client", gstin: "N/A" };

  const [expandedId, setExpandedId] = useState<string | null>(exceptions[0]?.id || null);
  const [exceptionStatuses, setExceptionStatuses] = useState<Record<string, string>>({});

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "high":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            High Risk
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            Medium Risk
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Low Risk
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleAction = (exceptionId: string, action: string) => {
    setExceptionStatuses((prev) => ({
      ...prev,
      [exceptionId]: action,
    }));
  };

  const allReviewed = exceptions.every((e) => exceptionStatuses[e.id]);

  const handleContinue = () => {
    router.push(
      `/dashboard/clients/${clientId}/reconcile/notes?month=${encodeURIComponent(month)}`
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h1 className="text-2xl font-bold text-foreground">Needs Review</h1>
        </div>
        <p className="text-muted-foreground">
          {client.name} - {month} | {exceptions.length} exceptions found
        </p>
      </div>

      {/* Exception List */}
      <div className="space-y-4">
        {exceptions.map((exception) => {
          const isExpanded = expandedId === exception.id;
          const status = exceptionStatuses[exception.id];

          return (
            <Card
              key={exception.id}
              className={cn(
                "border-border transition-all",
                status && "opacity-70"
              )}
            >
              <CardContent className="p-0">
                {/* Header Row */}
                <button
                  type="button"
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : exception.id)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        {exception.invoiceNo}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {exception.vendor}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {exception.issue}
                      </p>
                      <p className="font-semibold text-amber-600">
                        {formatCurrency(exception.difference)}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border pt-4">
                    {/* Explanation */}
                    <div className="bg-amber-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-amber-800 leading-relaxed">
                        {exception.explanation}
                      </p>
                    </div>

                    {/* Suggested Action */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                          Suggested Action
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          {exception.suggestedAction}
                        </p>
                      </div>
                      {getRiskBadge(exception.riskLevel)}
                    </div>

                    {/* Actions */}
                    {status ? (
                      <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
                        {status === "senior" ? (
                          <UserCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium text-foreground">
                          {status === "senior"
                            ? "Marked for Senior Review"
                            : "Deferred to Next Month"}
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => handleAction(exception.id, "senior")}
                        >
                          <UserCheck className="mr-2 h-4 w-4" />
                          Mark for Senior Review
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 bg-transparent"
                          onClick={() => handleAction(exception.id, "defer")}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Defer to Next Month
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Note */}
      <Card className="border-border bg-muted/30">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            You don{"'"}t need to decide law. Just flag items for review.
          </p>
        </CardContent>
      </Card>

      {/* Continue */}
      <div className="flex justify-end">
        <Button onClick={handleContinue}>
          Continue to Notes
        </Button>
      </div>
    </div>
  );
}

export default function ExceptionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <ExceptionsContent />
    </Suspense>
  );
}
