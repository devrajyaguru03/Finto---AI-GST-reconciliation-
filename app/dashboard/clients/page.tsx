"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
      const res = await fetch(`${API}/api/manage-clients/`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
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
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Up to date
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            Pending review
          </Badge>
        );
      case "not_started":
        return (
          <Badge className="bg-muted text-muted-foreground hover:bg-muted">
            Not started
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground hover:bg-muted">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Clients</h1>
          <p className="text-muted-foreground mt-1">
            Manage GST reconciliation for your clients
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients by name or GSTIN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Client Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card
            key={client.id}
            className="hover:shadow-md transition-shadow border-border"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {client.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      {client.gstin || "No GSTIN"}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Client</DropdownMenuItem>
                    <DropdownMenuItem>View History</DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      Delete Client
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {client.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Mail className="h-3 w-3" />
                  {client.email}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    Last Reconciled
                  </span>
                  <span className="font-medium text-foreground">
                    {client.last_reconciled || "Never"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {getStatusBadge(client.status)}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-border">
                <Link
                  href={`/dashboard/clients/${client.id}/reconcile?month=${encodeURIComponent(client.pending_month || "July 2024")}`}
                >
                  <Button className="w-full" variant="default">
                    Start {client.pending_month || "Next"} Reconciliation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-foreground mb-1">
              No clients found
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              {searchQuery
                ? "Try adjusting your search query"
                : "Add your first client to get started with GST reconciliation"}
            </p>
            {!searchQuery && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Client
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              Add New Client
            </DialogTitle>
            <DialogDescription>
              Enter the client details below. The client will appear on your dashboard after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Client Name */}
            <div className="space-y-2">
              <Label htmlFor="client-name" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Client Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="client-name"
                placeholder="e.g. Raj Industries Pvt Ltd"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                autoFocus
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="client-email" className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Email Address
              </Label>
              <Input
                id="client-email"
                type="email"
                placeholder="e.g. accounts@rajindustries.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            {/* GSTIN */}
            <div className="space-y-2">
              <Label htmlFor="client-gstin" className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" />
                GSTIN Number
              </Label>
              <Input
                id="client-gstin"
                placeholder="e.g. 24ABCDE1234F1Z5"
                value={formData.gstin}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    gstin: e.target.value.toUpperCase(),
                  }))
                }
                className="font-mono tracking-wider"
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground">
                15 character GST Identification Number
              </p>
            </div>

            {/* Error */}
            {formError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                <X className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowAddDialog(false);
                setFormData({ name: "", email: "", gstin: "" });
                setFormError("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAddClient}
              disabled={creating}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
