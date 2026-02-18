"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Building2,
  Calendar,
  ArrowRight,
  MoreHorizontal,
  X,
  Loader2,
  Mail,
  Hash,
  User,
  Filter,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface Client {
  id: string;
  name: string;
  email: string | null;
  gstin: string | null;
  status: string;
  last_reconciled: string | null;
  pending_month: string | null;
  created_at: string;
}

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gstin: "",
  });
  const [formError, setFormError] = useState("");

  const fetchClients = useCallback(async () => {
    try {
      // Mock data for UI development if backend is not reachable
      // Remove this mock block when backend is stable
      /*
      setClients([
         { id: "1", name: "Acme Corp", email: "contact@acme.com", gstin: "29ABCDE1234F1Z5", status: "completed", last_reconciled: "Oct 2024", pending_month: "Nov 2024", created_at: "2024-01-01" },
         { id: "2", name: "Globex Inc", email: "accounting@globex.com", gstin: "27AAACW1234F1Z5", status: "pending", last_reconciled: "Sep 2024", pending_month: "Oct 2024", created_at: "2024-02-15" },
      ]);
      setLoading(false);
      return;
      */

      const res = await fetch(`${API}/api/manage-clients/`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      } else {
        // Fallback or empty state
        setClients([]);
      }
    } catch (e) {
      console.error("Failed to fetch clients:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleAddClient = async () => {
    if (!formData.name.trim()) {
      setFormError("Client name is required");
      return;
    }
    setFormError("");
    setCreating(true);

    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch(`${API}/api/manage-clients/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          gstin: formData.gstin.trim() || null,
        }),
      });

      if (res.ok) {
        const newClient = await res.json();
        setClients((prev) => [newClient, ...prev]);
        setShowAddDialog(false);
        setFormData({ name: "", email: "", gstin: "" });
      } else {
        const err = await res.json();
        setFormError(err.detail || "Failed to create client");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      const res = await fetch(`${API}/api/manage-clients/${clientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setClients((prev) => prev.filter((c) => c.id !== clientId));
      }
    } catch (e) {
      console.error("Failed to delete client:", e);
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.gstin || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-emerald-100/50 text-emerald-700 border-emerald-200">
            Up to date
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-100/50 text-amber-700 border-amber-200">
            Pending review
          </Badge>
        );
      case "not_started":
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
            Not started
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/20">
        <AppHeader title="My Clients" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-muted-foreground font-medium animate-pulse">Loading clients...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <AppHeader title="My Clients" />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients by name or GSTIN..."
              className="pl-9 bg-background/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button onClick={() => setShowAddDialog(true)} className="shadow-lg shadow-primary/20 hover:shadow-primary/30">
            <Plus className="mr-2 h-4 w-4" />
            Add New Client
          </Button>
        </div>

        {/* Client Cards */}
        {filteredClients.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <Card
                key={client.id}
                className="group hover-lift transition-all duration-300 border-border/60 hover:border-primary/50"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg leading-none mb-1.5">
                          {client.name}
                        </h3>
                        <p className="text-xs text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded inline-block">
                          {client.gstin || "No GSTIN"}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Client</DropdownMenuItem>
                        <DropdownMenuItem>View History</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClient(client.id)}
                        >
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-4">
                    {client.email && (
                      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <div className="h-6 w-6 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                          <Mail className="h-3.5 w-3.5" />
                        </div>
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-muted/30 rounded-lg p-3">
                        <span className="text-xs text-muted-foreground block mb-1">Last Reconciled</span>
                        <span className="font-medium text-sm">{client.last_reconciled || "Never"}</span>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <span className="text-xs text-muted-foreground block mb-1">Status</span>
                        {getStatusBadge(client.status)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      href={`/dashboard/clients/${client.id}/reconcile?month=${encodeURIComponent(client.pending_month || "July 2024")}`}
                      className="block"
                    >
                      <Button className="w-full group/btn" variant="default">
                        Start {client.pending_month || "Next"} Reconciliation
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed bg-muted/10">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No clients found
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                {searchQuery
                  ? "We couldn't find any clients matching your search. Try adjusting your filters."
                  : "Add your first client to get started with GST reconciliation independently for each business."}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="shadow-md"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Client
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              Add New Client
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Enter the client details below. We'll set up a dedicated reconciliation workspace for them.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-2 space-y-5">
            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-sm font-medium flex items-center gap-1.5">
                Client Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client-name"
                  placeholder="e.g. Raj Industries Pvt Ltd"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="client-email" className="text-sm font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client-email"
                  type="email"
                  placeholder="e.g. accounts@rajindustries.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="pl-9"
                />
              </div>
            </div>

            {/* GSTIN */}
            <div className="space-y-2">
              <Label htmlFor="client-gstin" className="text-sm font-medium">GSTIN Number</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client-gstin"
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  value={formData.gstin}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      gstin: e.target.value.toUpperCase(),
                    }))
                  }
                  className="pl-9 font-mono"
                  maxLength={15}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be a valid 15-character GST number
              </p>
            </div>

            {/* Error */}
            {formError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20">
                <X className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}
          </div>

          <DialogFooter className="p-6 pt-2 bg-muted/50 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setFormData({ name: "", email: "", gstin: "" });
                setFormError("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddClient}
              disabled={creating}
              className="min-w-[120px]"
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Client
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
