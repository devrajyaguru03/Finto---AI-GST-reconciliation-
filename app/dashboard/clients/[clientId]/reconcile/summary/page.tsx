"use client";

import { useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ChevronRight,
  Shield,
} from "lucide-react";

const clientsData: Record<string, { name: string; gstin: string }> = {
  "1": { name: "ABC Traders", gstin: "24ABCDE1234F1Z5" },
  "2": { name: "Shree Metals Pvt Ltd", gstin: "27FGHIJ5678K2L6" },
  "3": { name: "Global Tech Solutions", gstin: "29MNOPQ9012R3S7" },
  "4": { name: "Sunrise Industries", gstin: "33TUVWX3456Y4Z8" },
  "5": { name: "Bharat Enterprises", gstin: "07ABCDE7890F5G9" },
};

const summaryData = {
  totalPurchaseITC: 480000,
  safeToClaim: 410000,
  needsReview: 45000,
  doNotClaim: 10000,
  likelyNextMonth: 15000,
};

function SummaryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientId = params.clientId as string;
  const month = searchParams.get("month") || "July 2024";
  const client = clientsData[clientId] || { name: "Unknown Client", gstin: "N/A" };

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleCategoryClick = (category: string) => {
    if (category === "needsReview") {
      router.push(
        `/dashboard/clients/${clientId}/reconcile/exceptions?month=${encodeURIComponent(month)}`
      );
    }
  };

  const handleContinue = () => {
    router.push(
      `/dashboard/clients/${clientId}/reconcile/notes?month=${encodeURIComponent(month)}`
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          GST Reconciliation Summary - {month}
        </h1>
        <p className="text-muted-foreground mt-1">
          Client: <span className="font-medium text-foreground">{client.name}</span>
        </p>
      </div>

      {/* Total ITC Card */}
      <Card className="border-border bg-muted/30">
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Purchase ITC</p>
          <p className="text-4xl font-bold text-foreground">
            {formatCurrency(summaryData.totalPurchaseITC)}
          </p>
        </CardContent>
      </Card>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Safe to Claim */}
        <Card
          className="border-emerald-200 bg-emerald-50/50 cursor-default"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-700 mb-1">
              {formatCurrency(summaryData.safeToClaim)}
            </p>
            <p className="text-sm text-emerald-600 font-medium">Safe to Claim</p>
          </CardContent>
        </Card>

        {/* Needs Review */}
        <Card
          className="border-amber-200 bg-amber-50/50 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCategoryClick("needsReview")}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              <ChevronRight className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-amber-700 mb-1">
              {formatCurrency(summaryData.needsReview)}
            </p>
            <p className="text-sm text-amber-600 font-medium">Needs Review</p>
          </CardContent>
        </Card>

        {/* Do Not Claim */}
        <Card
          className="border-red-200 bg-red-50/50 cursor-default"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-700 mb-1">
              {formatCurrency(summaryData.doNotClaim)}
            </p>
            <p className="text-sm text-red-600 font-medium">Do Not Claim</p>
          </CardContent>
        </Card>

        {/* Likely Next Month */}
        <Card
          className="border-slate-200 bg-slate-50/50 cursor-default"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <Clock className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-2xl font-bold text-slate-700 mb-1">
              {formatCurrency(summaryData.likelyNextMonth)}
            </p>
            <p className="text-sm text-slate-600 font-medium">Likely Next Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Reassurance */}
      <Card className="border-border bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-medium">Most ITC is already safe.</span>{" "}
            Review only the highlighted exceptions.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => handleCategoryClick("needsReview")}
        >
          Review Exceptions
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
        <Button onClick={handleContinue}>
          Continue to Notes
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <SummaryContent />
    </Suspense>
  );
}
