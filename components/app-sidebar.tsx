"use client";

import * as React from "react";
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
  User,
  ChevronUp,
  Plus,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";



const settingsNavItems = [
  {
    title: "Support",
    url: "/dashboard/support",
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { isMobile } = useSidebar();
  const [clients, setClients] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchClients = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${API}/api/manage-clients/`);
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch (e) {
        console.error("Failed to fetch clients", e);
      }
    };
    fetchClients();
  }, []);

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
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 border-b border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-primary/5">
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FintoLogoIcon size={20} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-primary text-base">Finto</span>
                  <span className="truncate text-xs text-muted-foreground">AI Reconciliation</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* New Client Button */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/clients?new=true"}
                  tooltip="New Client"
                  className={cn(
                    "transition-all duration-200",
                    pathname === "/dashboard/clients?new=true" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Link href="/dashboard/clients?new=true">
                    <Plus className={cn("size-4")} />
                    <span>New Client</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Dynamic Client List */}
              {clients.map((client) => {
                const clientUrl = `/dashboard/clients/${client.id}/reconcile`;
                const isActive = pathname.startsWith(clientUrl);
                return (
                  <SidebarMenuItem key={client.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={client.name}
                      className={cn(
                        "transition-all duration-200",
                        isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Link href={clientUrl}>
                        <Building2 className={cn("size-4", isActive && "text-primary")} />
                        <span>{client.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNavItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        "transition-all duration-200",
                        isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon className={cn("size-4", isActive && "text-primary")} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{userEmail.split("@")[0]}</span>
                    <span className="truncate text-xs">{userEmail}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              >
                <DropdownMenuItem onClick={handleLogout} className="text- destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
