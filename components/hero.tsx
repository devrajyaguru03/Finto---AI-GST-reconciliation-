"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  Play,
  Zap,
} from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 mesh-gradient">
        {/* Floating Blobs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl blob" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/10 rounded-full blur-3xl blob-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Animated Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-sm font-medium mb-8 fade-in-up shimmer">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="text-muted-foreground">
              Trusted by{" "}
              <span className="text-foreground font-semibold">500+</span>{" "}
              Chartered Accountants
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground leading-[1.1] tracking-tight fade-in-up stagger-1">
            Cut GST Reconciliation
            <br />
            Time by{" "}
            <span className="gradient-text-animated inline-block">60-70%</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed fade-in-up stagger-2">
            Automated GSTR-2B matching with your Purchase Register. Identify
            mismatches, categorize issues, and generate CA-ready reports in
            minutes.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 fade-in-up stagger-3">
            <Button
              size="lg"
              className="gradient-bg btn-shine text-white border-0 text-base px-8 py-6 h-14 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="group text-base px-8 py-6 h-14 rounded-xl bg-background/50 backdrop-blur hover:bg-background/80 transition-all duration-300"
            >
              <Play className="mr-2 h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              Watch Demo
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground fade-in-up stagger-4">
            {[
              "No credit card required",
              "Setup in 2 minutes",
              "Works with Tally, Zoho & more",
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product Preview */}
        <div className="mt-20 lg:mt-28 relative fade-in-up stagger-5">
          {/* Glow Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 rounded-3xl blur-2xl opacity-50" />

          <div className="relative glass rounded-2xl border border-border/50 shadow-2xl overflow-hidden">
            {/* Window bar */}
            <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400/80 hover:bg-red-400 transition-colors cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-yellow-400/80 hover:bg-yellow-400 transition-colors cursor-pointer" />
                <div className="w-3 h-3 rounded-full bg-green-400/80 hover:bg-green-400 transition-colors cursor-pointer" />
              </div>
              <div className="flex-1 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-background/50 text-xs text-muted-foreground">
                  <div className="w-3 h-3 rounded-sm bg-primary/20" />
                  Finto Dashboard
                </div>
              </div>
              <div className="w-20" />
            </div>

            {/* Dashboard content */}
            <div className="p-6 lg:p-8 bg-gradient-to-b from-background/50 to-background">
              {/* Stats row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  label="Invoices Processed"
                  value="2,847"
                  change="+12%"
                  positive
                />
                <StatCard
                  label="Matched"
                  value="2,634"
                  change="92.5%"
                  positive
                  highlight
                />
                <StatCard
                  label="Mismatches Found"
                  value="213"
                  change="7.5%"
                />
                <StatCard
                  label="Time Saved"
                  value="18 hrs"
                  change="This month"
                  positive
                  icon={<Zap className="h-4 w-4" />}
                />
              </div>

              {/* Workflow preview */}
              <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
                <WorkflowStep
                  icon={<Upload className="h-6 w-6" />}
                  step="1"
                  title="Upload Files"
                  description="Drop your Purchase Register and GSTR-2B"
                  active
                />
                <WorkflowStep
                  icon={<FileSpreadsheet className="h-6 w-6" />}
                  step="2"
                  title="Auto-Match"
                  description="AI matches invoices by GSTIN, number & values"
                />
                <WorkflowStep
                  icon={<CheckCircle2 className="h-6 w-6" />}
                  step="3"
                  title="Get Report"
                  description="Download CA-ready reconciliation report"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  change,
  positive,
  highlight,
  icon,
}: {
  label: string;
  value: string;
  change: string;
  positive?: boolean;
  highlight?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`relative rounded-xl p-4 transition-all duration-300 hover-lift ${highlight
          ? "bg-primary/10 border border-primary/20"
          : "bg-muted/30 border border-transparent hover:border-border/50"
        }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon && (
          <div className="text-primary">{icon}</div>
        )}
      </div>
      <p className="text-2xl lg:text-3xl font-bold text-foreground mt-2">
        {value}
      </p>
      <p
        className={`text-xs mt-1 flex items-center gap-1 ${positive ? "text-green-500" : "text-muted-foreground"
          }`}
      >
        {positive && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        )}
        {change}
      </p>
    </div>
  );
}

function WorkflowStep({
  icon,
  step,
  title,
  description,
  active,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div
      className={`group relative rounded-xl p-5 border transition-all duration-300 hover-lift ${active
          ? "border-primary/50 bg-primary/5 glow-sm"
          : "border-border/50 bg-muted/20 hover:border-primary/30 hover:bg-primary/5"
        }`}
    >
      {/* Connector Line (hidden on mobile and last item) */}
      <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-border to-transparent last:hidden" />

      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${active
              ? "gradient-bg text-white shadow-lg shadow-primary/25"
              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            }`}
        >
          {icon}
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${active
              ? "bg-primary/20 text-primary"
              : "bg-muted text-muted-foreground"
            }`}
        >
          Step {step}
        </span>
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
