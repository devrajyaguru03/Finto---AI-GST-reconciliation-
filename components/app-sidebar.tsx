"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FintoLogoIcon } from "@/components/finto-logo";
import {
  Building2,
  HelpCircle,
  LogOut,
  ChevronUp,
  Plus,

  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,

  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

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

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = React.useState<any | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  // Edit dialog state
  const [editTarget, setEditTarget] = React.useState<any | null>(null);
  const [editForm, setEditForm] = React.useState({ name: "", email: "", gstin: "" });
  const [saving, setSaving] = React.useState(false);

  const fetchClients = React.useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/manage-clients/`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
        // Store client names in sessionStorage for reconciliation pages
        data.forEach((c: any) => {
          if (c.id && c.name) {
            sessionStorage.setItem(`client_name_${c.id}`, c.name);
          }
        });
      }
    } catch (e) {
      console.error("Failed to fetch clients", e);
    }
  }, []);

  React.useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // --- Delete ---
  const openDelete = (client: any) => setDeleteTarget(client);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      await fetch(`${API}/api/manage-clients/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteTarget(null);
      // Navigate away if we deleted the active client
      if (pathname.startsWith(`/dashboard/clients/${deleteTarget.id}`)) {
        router.push("/dashboard/clients");
      }
      await fetchClients();
    } finally {
      setDeleting(false);
    }
  };

  // --- Edit ---
  const openEdit = (client: any) => {
    setEditTarget(client);
    setEditForm({ name: client.name || "", email: client.email || "", gstin: client.gstin || "" });
  };
  const confirmEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("auth_token") || "";
      // Use PATCH on manage-clients endpoint
      await fetch(`${API}/api/manage-clients/${editTarget.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editForm.name.trim() || editTarget.name,
          email: editForm.email.trim() || null,
          gstin: editForm.gstin.trim().toUpperCase() || null,
        }),
      });
      setEditTarget(null);
      await fetchClients();
    } finally {
      setSaving(false);
    }
  };

  const userEmail = user?.email || "user@finto.io";
  const initials = userEmail.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <>
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
                    isActive={pathname === "/dashboard/clients"}
                    tooltip="New Client"
                    className={cn(
                      "transition-all duration-200",
                      pathname === "/dashboard/clients"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Link href="/dashboard/clients">
                      <Plus className={cn("size-4")} />
                      <span>New Client</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* Dynamic Client List */}
                {clients.map((client) => {
                  const clientUrl = `/dashboard/clients/${client.id}`;
                  const isActive = pathname.startsWith(clientUrl);

                  return (
                    <SidebarMenuItem key={client.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={client.name}
                        className={cn(
                          "transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Link href={clientUrl}>
                          <Building2 className={cn("size-4", isActive && "text-primary")} />
                          <span>{client.name}</span>
                        </Link>
                      </SidebarMenuButton>

                      {/* ⋯ Three-dot context menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction
                            showOnHover
                            className="text-muted-foreground hover:text-foreground"
                            title="More options"
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">More options for {client.name}</span>
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" className="w-48">
                          <DropdownMenuItem onClick={() => openEdit(client)}>
                            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDelete(client)}
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Client
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>


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
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground"
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
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
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

      {/* ——— Delete Confirmation Dialog ——— */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{deleteTarget?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the client and all their associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ——— Edit Details Dialog ——— */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">Client Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Raj Industries Pvt Ltd"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="e.g. accounts@client.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-gstin">GSTIN</Label>
              <Input
                id="edit-gstin"
                value={editForm.gstin}
                onChange={(e) => setEditForm((p) => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                placeholder="e.g. 29ABCDE1234F1Z5"
                maxLength={15}
                className="font-mono uppercase"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={confirmEdit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pencil className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
