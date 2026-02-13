"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FintoLogoIcon } from "@/components/finto-logo";
import {
  ArrowLeftRight,
  Building2,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";

const mainNavItems = [
  {
    title: "Reconciliation",
    href: "/dashboard/reconciliation",
    icon: ArrowLeftRight,
    isHero: true,
  },
  {
    title: "GSTIN List",
    href: "/dashboard/clients",
    icon: Building2,
  },
];

const settingsNavItems = [
  {
    title: "Preferences",
    href: "/dashboard/preferences",
    icon: Settings,
  },
  {
    title: "Support",
    href: "/dashboard/support",
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const userEmail = user?.email || "user@finto.io";
  const initials = userEmail
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-card border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 px-6 flex items-center border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <FintoLogoIcon size={28} />
          <span className="text-xl font-bold text-primary">Finto</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="mb-2">
          <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Main
          </span>
        </div>
        <ul className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isHero = "isHero" in item && item.isHero;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 rounded-lg text-sm font-medium transition-colors",
                    isHero ? "py-3" : "py-2.5",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    isHero && !isActive && "bg-primary/5 text-primary"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isHero && "h-5 w-5")} />
                  <span className={cn(isHero && "font-semibold")}>{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 mb-2">
          <span className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Settings
          </span>
        </div>
        <ul className="space-y-1">
          {settingsNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{userEmail.split("@")[0]}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

