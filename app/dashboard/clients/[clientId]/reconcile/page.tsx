"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

const clientsData: Record<string, { name: string; gstin: string }> = {
  "1": { name: "ABC Traders", gstin: "24ABCDE1234F1Z5" },
  "2": { name: "Shree Metals Pvt Ltd", gstin: "27FGHIJ5678K2L6" },
  "3": { name: "Global Tech Solutions", gstin: "29MNOPQ9012R3S7" },
  "4": { name: "Sunrise Industries", gstin: "33TUVWX3456Y4Z8" },
  "5": { name: "Bharat Enterprises", gstin: "07ABCDE7890F5G9" },
};

function ReconcileContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientId = params.clientId as string;
  const month = searchParams.get("month") || "July 2024";
  const client = clientsData[clientId] || { name: "Unknown Client", gstin: "N/A" };

  const handleContinue = () => {
    router.push(`/dashboard/clients/${clientId}/reconcile/upload?month=${encodeURIComponent(month)}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back Link */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Clients
      </Link>

      {/* Main Card */}
      <Card className="border-border">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              GST Reconciliation - {month}
            </h1>
            <p className="text-muted-foreground">
              Client: <span className="font-medium text-foreground">{client.name}</span>
            </p>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              GSTIN: {client.gstin}
            </p>
          </div>

          {/* Description */}
          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <p className="text-foreground leading-relaxed text-center">
              We will compare your <span className="font-semibold">Purchase Register</span> with{" "}
              <span className="font-semibold">GSTR-2B</span> and prepare a clean reconciliation summary.
            </p>
          </div>

          {/* What happens next */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-foreground text-sm uppercase tracking-wide">
              What happens next
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">1</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload your Purchase Register and GSTR-2B files
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">2</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  System automatically matches and identifies exceptions
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-primary">3</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Review summary and flag items for senior review if needed
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Button onClick={handleContinue} className="w-full" size="lg">
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {/* Security Note */}
          <div className="flex items-center justify-center gap-2 mt-6 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>Secure access. Your data stays private.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReconcilePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <ReconcileContent />
    </Suspense>
  );
}
