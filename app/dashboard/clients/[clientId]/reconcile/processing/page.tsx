"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const processingSteps = [
  "Reading Purchase Register",
  "Reading GSTR-2B",
  "Standardizing invoice data",
  "Matching invoices",
  "Identifying exceptions",
  "Preparing summary",
];

function ProcessingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientId = params.clientId as string;
  const month = searchParams.get("month") || new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Get client name from sessionStorage
  const clientName = typeof window !== "undefined"
    ? sessionStorage.getItem(`client_name_${clientId}`) || "Client"
    : "Client";

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (currentStep >= processingSteps.length) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < processingSteps.length) {
          setCompletedSteps((completed) => [...completed, prev]);
          return prev + 1;
        }
        return prev;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === processingSteps.length && !isRedirecting) {
      setIsRedirecting(true);
      const timeout = setTimeout(() => {
        router.push(
          `/dashboard/clients/${clientId}/reconcile/summary?month=${encodeURIComponent(month)}`
        );
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [currentStep, clientId, month, router, isRedirecting]);

  const isComplete = completedSteps.length === processingSteps.length;

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border-border">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              {isComplete ? (
                <CheckCircle2 className="h-8 w-8 text-primary" />
              ) : (
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">
              {isComplete ? "Processing Complete" : "Processing Your Data"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {clientName} - {month}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-8">
            {processingSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(index);
              const isCurrent = currentStep === index && !isCompleted;

              return (
                <div
                  key={step}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    isCompleted && "bg-emerald-50",
                    isCurrent && "bg-primary/5"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-border flex-shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-sm",
                      isCompleted && "text-emerald-700 font-medium",
                      isCurrent && "text-primary font-medium",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground">
            This usually takes less than a minute.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <ProcessingContent />
    </Suspense>
  );
}
