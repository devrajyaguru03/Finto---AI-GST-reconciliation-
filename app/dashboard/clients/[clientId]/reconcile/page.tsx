"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useState, useMemo, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Shield, ArrowLeft, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function generateMonthOptions() {
  const months: { label: string; value: string; shortLabel: string; year: number; monthIndex: number }[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const shortLabel = d.toLocaleDateString("en-US", { month: "short" });
    months.push({
      label,
      value: label,
      shortLabel,
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
    });
  }

  return months;
}

function ReconcileContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const clientId = params.clientId as string;
  const currentMonth = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const initialMonth = searchParams.get("month") || currentMonth;

  const monthOptions = useMemo(() => generateMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  // Group months by year for the picker
  const groupedByYear = useMemo(() => {
    const groups: Record<number, typeof monthOptions> = {};
    monthOptions.forEach((m) => {
      if (!groups[m.year]) groups[m.year] = [];
      groups[m.year].push(m);
    });
    return groups;
  }, [monthOptions]);

  const years = useMemo(() => Object.keys(groupedByYear).map(Number).sort((a, b) => b - a), [groupedByYear]);
  const [activeYearIndex, setActiveYearIndex] = useState(0);
  const activeYear = years[activeYearIndex];

  const handleMonthSelect = (monthValue: string) => {
    setSelectedMonth(monthValue);
    // Update URL without full navigation
    const url = new URL(window.location.href);
    url.searchParams.set("month", monthValue);
    window.history.replaceState({}, "", url.toString());
  };

  const handleContinue = () => {
    router.push(`/dashboard/clients/${clientId}/reconcile/upload?month=${encodeURIComponent(selectedMonth)}`);
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
      <Card className="border-border overflow-hidden">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              GST Reconciliation
            </h1>
            <p className="text-muted-foreground">
              Select a return period and start reconciling
            </p>
          </div>

          {/* ── Premium Month Picker ── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground tracking-wide uppercase">
                Select Return Period
              </span>
            </div>

            {/* Year Navigator */}
            {years.length > 1 && (
              <div className="flex items-center justify-center gap-3 mb-4">
                <button
                  onClick={() => setActiveYearIndex((i) => Math.min(i + 1, years.length - 1))}
                  disabled={activeYearIndex === years.length - 1}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-bold text-foreground min-w-[60px] text-center tabular-nums">
                  {activeYear}
                </span>
                <button
                  onClick={() => setActiveYearIndex((i) => Math.max(i - 1, 0))}
                  disabled={activeYearIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Month Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {groupedByYear[activeYear]?.map((m) => {
                const isSelected = selectedMonth === m.value;
                const isCurrent = m.value === currentMonth;

                return (
                  <button
                    key={m.value}
                    onClick={() => handleMonthSelect(m.value)}
                    className={cn(
                      "relative group px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 border",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                      isSelected
                        ? "bg-gradient-to-br from-primary to-primary/80 text-white border-primary shadow-lg shadow-primary/25 scale-[1.02]"
                        : "bg-background hover:bg-muted/80 text-foreground border-border/60 hover:border-primary/40 hover:shadow-sm"
                    )}
                  >
                    <span className="block text-[13px] font-semibold">{m.shortLabel}</span>
                    {isCurrent && !isSelected && (
                      <span className="block text-[10px] text-primary font-medium mt-0.5">
                        Current
                      </span>
                    )}
                    {isSelected && (
                      <span className="block text-[10px] text-white/80 font-medium mt-0.5">
                        Selected
                      </span>
                    )}
                    {/* Glow effect for selected */}
                    {isSelected && (
                      <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md -z-10" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Period Display */}
            <div className="mt-4 flex items-center justify-center gap-2 bg-muted/40 rounded-lg py-2.5 px-4 border border-border/40">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Return Period:</span>
              <span className="text-sm font-bold text-foreground">{selectedMonth}</span>
            </div>
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
            Continue with {selectedMonth}
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
