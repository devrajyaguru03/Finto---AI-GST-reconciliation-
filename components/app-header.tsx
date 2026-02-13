"use client";

import { Search, Bell, Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search transactions..."
            className="w-64 pl-9 h-9 bg-muted/50"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </Button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="icon">
          <Moon className="h-5 w-5 text-muted-foreground" />
        </Button>

        {/* User Avatar (mobile) */}
        <Avatar className="h-8 w-8 md:hidden">
          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=alex" />
          <AvatarFallback>AM</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
