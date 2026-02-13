"use client";

import React, { useEffect, useRef, useState } from "react";
import { Upload, Cpu, FileSpreadsheet, Download, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Upload,
    number: "01",
    title: "Upload Your Files",
    description:
      "Simply drag and drop your Purchase Register (Excel/CSV) and GSTR-2B file. We support exports from Tally, Zoho, Busy, and all major accounting software.",
    highlight: "Supports 15+ file formats",
  },
  {
    icon: Cpu,
    number: "02",
    title: "AI-Powered Matching",
    description:
      "Our intelligent engine matches invoices using GSTIN, invoice numbers, dates, and tax values. It handles variations in formats, typos, and timing differences automatically.",
    highlight: "99.2% accuracy rate",
  },
  {
    icon: FileSpreadsheet,
    number: "03",
    title: "Review Mismatches",
    description:
      "Easily review categorized mismatches: missing in GSTR-2B, missing in books, value differences, and duplicate entries. Each issue is clearly explained.",
    highlight: "Smart categorization",
  },
  {
    icon: Download,
    number: "04",
    title: "Export CA-Ready Reports",
    description:
      "Generate professional reconciliation reports in Excel or PDF format. Ready to share with clients or for your own records—no manual formatting needed.",
    highlight: "One-click export",
  },
];

export function HowItWorks() {
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = stepsRef.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) {
              setVisibleSteps((prev) => new Set([...prev, index]));
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    stepsRef.current.forEach((step) => {
      if (step) observer.observe(step);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-sm font-medium mb-6">
            <ArrowRight className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Simple Process</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            From upload to report in under 5 minutes. No training needed.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line - Desktop */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

          {/* Steps */}
          <div className="space-y-12 lg:space-y-0">
            {steps.map((step, index) => (
              <div
                key={index}
                ref={(el) => { stepsRef.current[index] = el; }}
                className={`relative transition-all duration-700 ${visibleSteps.has(index)
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                  }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div
                  className={`lg:grid lg:grid-cols-2 lg:gap-12 items-center ${index % 2 === 0 ? "" : "lg:flex-row-reverse"
                    }`}
                >
                  {/* Content */}
                  <div
                    className={`${index % 2 === 0 ? "lg:text-right lg:pr-16" : "lg:order-2 lg:pl-16"
                      }`}
                  >
                    <div
                      className={`inline-flex items-center gap-2 mb-4 ${index % 2 === 0 ? "lg:flex-row-reverse" : ""
                        }`}
                    >
                      <span className="text-5xl lg:text-6xl font-bold text-primary/20">
                        {step.number}
                      </span>
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                      {step.description}
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {step.highlight}
                    </div>
                  </div>

                  {/* Card */}
                  <div
                    className={`mt-8 lg:mt-0 ${index % 2 === 0 ? "lg:order-2 lg:pl-16" : "lg:pr-16"
                      }`}
                  >
                    <div className="relative group">
                      {/* Glow */}
                      <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative glass rounded-2xl p-8 border border-border/50 group-hover:border-primary/30 transition-all duration-500 hover-lift">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/25 mb-6 group-hover:scale-110 transition-transform duration-300">
                          <step.icon className="h-8 w-8 text-white" />
                        </div>

                        {/* Visual representation */}
                        <div className="space-y-3">
                          {[1, 2, 3].map((line) => (
                            <div
                              key={line}
                              className="h-3 rounded-full bg-muted/50"
                              style={{ width: `${100 - line * 15}%` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline Node - Desktop */}
                <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className={`w-4 h-4 rounded-full border-4 border-background transition-all duration-500 ${visibleSteps.has(index)
                      ? "bg-primary scale-100"
                      : "bg-muted scale-75"
                    }`}>
                    <div className={`absolute inset-0 rounded-full bg-primary animate-ping ${visibleSteps.has(index) ? "opacity-50" : "opacity-0"
                      }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
