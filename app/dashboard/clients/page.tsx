"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, Building2, Mail, Hash, User } from "lucide-react";

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function ClientsPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gstin: "",
  });
  const [formError, setFormError] = useState("");

  const handleAddClient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

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
        const nextMonth = newClient.pending_month || "July 2024";
        // Force a reload to update the sidebar's client list and navigate to the new client
        window.location.href = `/dashboard/clients/${newClient.id}/reconcile?month=${encodeURIComponent(nextMonth)}`;
      } else {
        const err = await res.json();
        setFormError(err.detail || "Failed to create client");
        setCreating(false);
      }
    } catch {
      setFormError("Network error. Please try again.");
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <AppHeader title="Add New Client" />

      <main className="flex-1 p-4 md:p-6 lg:p-8 flex justify-center items-start pt-12">
        <Card className="w-full max-w-2xl border-border/60 shadow-lg shadow-primary/5">
          <CardHeader className="p-6 pb-6 border-b bg-muted/20">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Add New Client</CardTitle>
                <CardDescription className="text-base mt-1.5">
                  Set up a dedicated reconciliation workspace for a new business.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-8">
            <form onSubmit={handleAddClient} className="space-y-6">
              {/* Client Name */}
              <div className="space-y-3">
                <Label htmlFor="client-name" className="text-sm font-semibold flex items-center gap-1.5">
                  Client Name <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="client-name"
                    placeholder="e.g. Raj Industries Pvt Ltd"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="pl-11 h-12 text-base"
                    autoFocus
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-3">
                <Label htmlFor="client-email" className="text-sm font-semibold">Email Address (Optional)</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="client-email"
                    type="email"
                    placeholder="e.g. accounts@rajindustries.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, email: e.target.value }))
                    }
                    className="pl-11 h-12 text-base"
                  />
                </div>
              </div>

              {/* GSTIN */}
              <div className="space-y-3">
                <Label htmlFor="client-gstin" className="text-sm font-semibold">GSTIN Number (Optional)</Label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
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
                    className="pl-11 h-12 font-mono text-base uppercase"
                    maxLength={15}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Must be a valid 15-character GST number
                </p>
              </div>

              {/* Error */}
              {formError && (
                <div className="flex items-center gap-2.5 text-sm text-destructive bg-destructive/10 px-4 py-3.5 rounded-lg border border-destructive/20 font-medium">
                  <X className="h-5 w-5 shrink-0" />
                  {formError}
                </div>
              )}

              <div className="pt-4 border-t flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={creating}
                  className="min-w-[150px] h-12 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating Workspace...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" />
                      Add Client
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
