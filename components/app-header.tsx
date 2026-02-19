"use client";

import { Search, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatWidget } from "@/components/chat-widget";
import { useState } from "react";

interface AppHeaderProps {
  title: string;
}

export function AppHeader({ title }: AppHeaderProps) {
  const { setTheme } = useTheme();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/60 px-4 backdrop-blur-xl transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <div className="h-4 w-px bg-border/50 mx-2" />
        <h1 className="text-lg font-semibold text-foreground tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search - Hidden on mobile for now to save space, or can be a toggle */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-64 pl-9 h-9 bg-muted/50 border-input/50 focus-visible:ring-1 focus-visible:ring-primary/20"
          />
        </div>

        {/* Chat with Agent */}
        <Button
          variant="default"
          className="gap-2 shadow-lg shadow-primary/20"
          onClick={() => setChatOpen(!chatOpen)}
        >
          <MessageSquare className="h-4 w-4" />
          Chat with Agent
        </Button>
      </div>
      <ChatWidget isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </header>
  );
}
