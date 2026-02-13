"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  FileCheck,
  Zap,
  Shield,
  BarChart3,
  Clock,
  Users,
} from "lucide-react";

const features = [
  {
    icon: FileCheck,
    title: "Automated Matching",
    description:
      "Intelligent matching of GSTR-2B with Purchase Register using GSTIN, invoice number, date, and tax values.",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: Zap,
    title: "Instant Mismatch Detection",
    description:
      "Quickly identifies missing invoices, value mismatches, duplicate entries, and timing differences.",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Shield,
    title: "High Accuracy",
    description:
      "Rules-based engine with AI enhancement ensures 99%+ accuracy in reconciliation.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: BarChart3,
    title: "CA-Ready Reports",
    description:
      "Generate professional reports that can be sent directly to clients without touching Excel.",
    color: "from-purple-500 to-pink-600",
  },
  {
    icon: Clock,
    title: "Save 60-70% Time",
    description:
      "What took hours now takes minutes. Process hundreds of invoices in seconds.",
    color: "from-cyan-500 to-blue-600",
  },
  {
    icon: Users,
    title: "Multi-Client Management",
    description:
      "Handle 10-300 clients efficiently with organized workspaces and batch processing.",
    color: "from-rose-500 to-red-600",
  },
];

export function Features() {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = cardsRef.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) {
              setVisibleCards((prev) => new Set([...prev, index]));
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 mesh-gradient opacity-50" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-sm font-medium mb-6">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Powerful Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Everything You Need for{" "}
            <span className="gradient-text">GST Reconciliation</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            One focused solution that does reconciliation right. No bloat, no
            unnecessary features—just powerful tools that save you time.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={(el) => { cardsRef.current[index] = el; }}
              className={`group relative transition-all duration-700 ${visibleCards.has(index)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
                }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Gradient border on hover */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
                style={{ background: `linear-gradient(135deg, var(--primary), var(--accent))` }} />

              <div className="relative h-full glass rounded-2xl p-6 lg:p-8 border border-border/50 group-hover:border-transparent transition-all duration-500">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                {/* Arrow indicator */}
                <div className="mt-4 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-0 group-hover:translate-x-2">
                  <span className="text-sm font-medium">Learn more</span>
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
