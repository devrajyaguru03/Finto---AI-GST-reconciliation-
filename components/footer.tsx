import React from "react";
import Link from "next/link";
import { FintoLogoIcon } from "@/components/finto-logo";
import { Twitter, Linkedin, Youtube, Mail, MapPin, Phone } from "lucide-react";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Integrations", href: "#" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Refund Policy", href: "#" },
    ],
  },
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="relative py-8 overflow-hidden border-t border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <Link href="/" className="flex items-center gap-2 group">
            <FintoLogoIcon size={24} />
            <span className="text-lg font-bold gradient-text">Finto</span>
          </Link>

          <p className="text-sm text-muted-foreground max-w-md">
            This project is made for educational purposes only.
            <br />
            Designed and Developed by Dev Rajyaguru.
          </p>

          <p className="text-xs text-muted-foreground/60 mt-4">
            © {new Date().getFullYear()} Finto. Student Project.
          </p>
        </div>
      </div>
    </footer>
  );
}
