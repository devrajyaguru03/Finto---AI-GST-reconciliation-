"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Starter",
    description: "Perfect for individual CAs getting started",
    price: { monthly: 999, yearly: 799 },
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    popular: false,
    features: [
      "Up to 10 clients",
      "500 invoices/month",
      "Basic matching engine",
      "Excel export",
      "Email support",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Professional",
    description: "Most popular for growing practices",
    price: { monthly: 2499, yearly: 1999 },
    icon: Sparkles,
    color: "from-primary to-purple-600",
    popular: true,
    features: [
      "Up to 50 clients",
      "5,000 invoices/month",
      "AI-powered matching",
      "Excel & PDF export",
      "Priority support",
      "Batch processing",
      "Custom reports",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    description: "For large firms with high volume",
    price: { monthly: 4999, yearly: 3999 },
    icon: Crown,
    color: "from-amber-500 to-orange-600",
    popular: false,
    features: [
      "Unlimited clients",
      "Unlimited invoices",
      "Advanced AI matching",
      "All export formats",
      "24/7 phone support",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <section id="pricing" className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 mesh-gradient opacity-30" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Simple Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Choose Your <span className="gradient-text">Plan</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Start free, upgrade when you&apos;re ready. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="mt-10 inline-flex items-center gap-4 p-1.5 rounded-full glass border border-border/50">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${!isYearly
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${isYearly
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Yearly
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative group transition-all duration-500 ${plan.popular ? "lg:-mt-4 lg:mb-4" : ""
                }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="px-4 py-1.5 rounded-full gradient-bg text-white text-sm font-medium shadow-lg shadow-primary/25">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Card Glow */}
              {plan.popular && (
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 opacity-100 blur-sm" />
              )}

              <div
                className={`relative h-full glass rounded-2xl p-8 border transition-all duration-500 hover-lift ${plan.popular
                    ? "border-transparent bg-card"
                    : "border-border/50 group-hover:border-primary/30"
                  }`}
              >
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <plan.icon className="h-6 w-6 text-white" />
                </div>

                {/* Plan Name */}
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      ₹{isYearly ? plan.price.yearly : plan.price.monthly}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {isYearly && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Billed yearly (₹{plan.price.yearly * 12})
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Link href="/login" className="block mb-8">
                  <Button
                    className={`w-full h-12 ${plan.popular
                        ? "gradient-bg btn-shine text-white border-0 shadow-lg shadow-primary/25"
                        : "bg-secondary hover:bg-secondary/80"
                      }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.popular
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                          }`}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
}
