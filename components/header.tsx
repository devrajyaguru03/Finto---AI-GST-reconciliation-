"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FintoLogoIcon } from "@/components/finto-logo";
import { Menu, X, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
        ? "glass border-b border-border/50 shadow-lg shadow-primary/5"
        : "bg-transparent"
        }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 lg:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <FintoLogoIcon size={36} />
            </div>
            <span className="text-xl font-bold gradient-text">Finto</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {["Features", "How It Works"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors underline-animated py-1"
              >
                {item}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Log In
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <div className="relative w-6 h-6">
              <span
                className={`absolute left-0 w-6 h-0.5 bg-foreground transition-all duration-300 ${mobileMenuOpen ? "top-3 rotate-45" : "top-1"
                  }`}
              />
              <span
                className={`absolute left-0 top-3 w-6 h-0.5 bg-foreground transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
              />
              <span
                className={`absolute left-0 w-6 h-0.5 bg-foreground transition-all duration-300 ${mobileMenuOpen ? "top-3 -rotate-45" : "top-5"
                  }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${mobileMenuOpen ? "max-h-80" : "max-h-0"
          }`}
      >
        <div className="glass-strong border-t border-border/50 px-4 py-6 space-y-4">
          {["Features", "How It Works"].map((item, index) => (
            <Link
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className={`block text-base font-medium text-muted-foreground hover:text-foreground py-2 fade-in-up stagger-${index + 1}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item}
            </Link>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <Link href="/login">
              <Button variant="outline" className="w-full justify-center">
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
