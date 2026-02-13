"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";

const testimonials = [
  {
    name: "Rajesh Sharma",
    role: "Chartered Accountant",
    company: "Sharma & Associates",
    location: "Mumbai",
    image: "/testimonials/rajesh.jpg",
    rating: 5,
    quote:
      "Finto has transformed how we handle GST reconciliation. What used to take my team 2 days now takes just 3 hours. The accuracy is remarkable.",
  },
  {
    name: "Priya Patel",
    role: "Senior CA",
    company: "Patel Tax Consultants",
    location: "Ahmedabad",
    image: "/testimonials/priya.jpg",
    rating: 5,
    quote:
      "Managing 150+ clients during filing season was a nightmare. Finto's batch processing and clear reports have made it manageable. Highly recommend!",
  },
  {
    name: "Arun Kumar",
    role: "Partner",
    company: "Kumar & Co.",
    location: "Bangalore",
    image: "/testimonials/arun.jpg",
    rating: 5,
    quote:
      "The mismatch categorization is brilliant. My team immediately knows what action to take for each discrepancy. It's saved us countless hours of analysis.",
  },
  {
    name: "Sneha Reddy",
    role: "Tax Consultant",
    company: "Reddy Financial Services",
    location: "Hyderabad",
    image: "/testimonials/sneha.jpg",
    rating: 5,
    quote:
      "Finally, a tool that understands CA workflows! The CA-ready reports mean I don't have to format anything before sending to clients.",
  },
];

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goTo = (index: number) => {
    setActiveIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrev = () => goTo((activeIndex - 1 + testimonials.length) % testimonials.length);
  const goToNext = () => goTo((activeIndex + 1) % testimonials.length);

  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 text-sm font-medium mb-6">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <span className="text-muted-foreground">Trusted by CAs</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Loved by <span className="gradient-text">Professionals</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground">
            See what chartered accountants across India say about Finto.
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto">
          {/* Main Card */}
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 rounded-3xl blur-2xl opacity-50" />

            <div className="relative glass rounded-3xl p-8 lg:p-12 border border-border/50">
              {/* Quote Icon */}
              <div className="absolute -top-6 left-8 lg:left-12">
                <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/25">
                  <Quote className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="pt-4">
                {/* Rating */}
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 transition-all duration-300 ${i < testimonials[activeIndex].rating
                          ? "text-amber-500 fill-amber-500"
                          : "text-muted"
                        }`}
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-xl lg:text-2xl text-foreground leading-relaxed mb-8 min-h-[120px]">
                  &ldquo;{testimonials[activeIndex].quote}&rdquo;
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xl font-bold text-primary">
                    {testimonials[activeIndex].name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonials[activeIndex].name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonials[activeIndex].role} at {testimonials[activeIndex].company}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {testimonials[activeIndex].location}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between pointer-events-none px-4 lg:-mx-6">
                <button
                  onClick={goToPrev}
                  className="w-10 h-10 rounded-full glass border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-300 pointer-events-auto hover:scale-110"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goToNext}
                  className="w-10 h-10 rounded-full glass border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all duration-300 pointer-events-auto hover:scale-110"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={`transition-all duration-300 rounded-full ${index === activeIndex
                    ? "w-8 h-2 bg-primary"
                    : "w-2 h-2 bg-muted hover:bg-muted-foreground"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
