"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Download,
  Upload,
  Filter,
  MoreHorizontal,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  IndianRupee,
  Calendar,
  Eye,
  Pencil,
  Trash2,
  ArrowRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const invoiceStats = [
  {
    title: "Total Invoices",
    value: "1,284",
    change: "+23 this month",
    icon: FileText,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Pending Approval",
    value: "89",
    change: "Worth ₹2.4L",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    title: "Approved",
    value: "1,150",
    change: "90% approval rate",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    title: "Disputed",
    value: "45",
    change: "Action required",
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
];

const invoices = [
  {
    id: "INV-2023-001",
    vendor: "Acme Corporation Pvt Ltd",
    vendorGstin: "27AABCU9603R1ZM",
    date: "Oct 24, 2023",
    dueDate: "Nov 24, 2023",
    amount: 125000,
    tax: 22500,
    status: "Approved",
    type: "Purchase",
  },
  {
    id: "INV-2023-002",
    vendor: "Global Tech Solutions",
    vendorGstin: "29AABCT1332L1ZL",
    date: "Oct 25, 2023",
    dueDate: "Nov 25, 2023",
    amount: 345000,
    tax: 62100,
    status: "Pending",
    type: "Purchase",
  },
  {
    id: "INV-2023-003",
    vendor: "Nebula Industries",
    vendorGstin: "27AAACN0107P1ZA",
    date: "Oct 26, 2023",
    dueDate: "Nov 26, 2023",
    amount: 85000,
    tax: 15300,
    status: "Disputed",
    type: "Purchase",
  },
  {
    id: "INV-2023-004",
    vendor: "Starlight Logistics",
    vendorGstin: "33AADCS4294P1ZG",
    date: "Oct 26, 2023",
    dueDate: "Nov 26, 2023",
    amount: 210000,
    tax: 37800,
    status: "Approved",
    type: "Purchase",
  },
  {
    id: "INV-2023-005",
    vendor: "Zenith Supplies",
    vendorGstin: "27AABCZ9876F1ZN",
    date: "Oct 27, 2023",
    dueDate: "Nov 27, 2023",
    amount: 54000,
    tax: 9720,
    status: "Approved",
    type: "Purchase",
  },
  {
    id: "INV-2023-006",
    vendor: "Omega Services",
    vendorGstin: "29AACCO5678K1ZM",
    date: "Oct 28, 2023",
    dueDate: "Nov 28, 2023",
    amount: 780000,
    tax: 140400,
    status: "Pending",
    type: "Purchase",
  },
  {
    id: "INV-2023-007",
    vendor: "Delta Manufacturing",
    vendorGstin: "27AABCD1234E1ZP",
    date: "Oct 28, 2023",
    dueDate: "Nov 28, 2023",
    amount: 156000,
    tax: 28080,
    status: "Approved",
    type: "Sales",
  },
  {
    id: "INV-2023-008",
    vendor: "Phoenix Traders",
    vendorGstin: "33AABCP9012H1ZQ",
    date: "Oct 29, 2023",
    dueDate: "Nov 29, 2023",
    amount: 92000,
    tax: 16560,
    status: "Pending",
    type: "Purchase",
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function InvoicesPage() {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.vendorGstin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status.toLowerCase() === statusFilter;
    const matchesType = typeFilter === "all" || invoice.type.toLowerCase() === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const toggleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map((inv) => inv.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter((i) => i !== id));
    } else {
      setSelectedInvoices([...selectedInvoices, id]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <AppHeader title="Invoices" />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Invoice Management</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Track, organize, and manage all your purchase and sales invoices.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="shadow-sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button className="shadow-lg shadow-primary/25 hover:shadow-primary/40">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {invoiceStats.map((stat) => (
            <Card key={stat.title} className="hover-lift border-t-4 border-t-transparent hover:border-t-primary/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${stat.bgColor} ring-1 ring-inset ring-black/5`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                    <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-1.5 py-0.5 rounded">{stat.change}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              className="pl-9 bg-background/60 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] shadow-sm bg-background/60">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] shadow-sm bg-background/60">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="shadow-sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Selected Actions */}
        {selectedInvoices.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="text-sm font-medium text-primary flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {selectedInvoices.length} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-background">
                Export
              </Button>
              <Button variant="default" size="sm">
                Approve
              </Button>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        <Card className="overflow-hidden shadow-md border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="text-left py-3 px-4 w-10">
                      <Checkbox
                        checked={
                          filteredInvoices.length > 0 &&
                          selectedInvoices.length === filteredInvoices.length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left font-medium py-3 px-4 uppercase text-xs tracking-wider">Invoice ID</th>
                    <th className="text-left font-medium py-3 px-4 uppercase text-xs tracking-wider">Vendor details</th>
                    <th className="text-left font-medium py-3 px-4 uppercase text-xs tracking-wider">Date</th>
                    <th className="text-left font-medium py-3 px-4 uppercase text-xs tracking-wider">Type</th>
                    <th className="text-right font-medium py-3 px-4 uppercase text-xs tracking-wider">Amount</th>
                    <th className="text-right font-medium py-3 px-4 uppercase text-xs tracking-wider">Tax ID</th>
                    <th className="text-center font-medium py-3 px-4 uppercase text-xs tracking-wider">Status</th>
                    <th className="text-center font-medium py-3 px-4 uppercase text-xs tracking-wider w-[50px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className={`hover:bg-muted/30 transition-colors group ${selectedInvoices.includes(invoice.id) ? "bg-primary/5" : ""}`}
                    >
                      <td className="py-4 px-4">
                        <Checkbox
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={() => toggleSelect(invoice.id)}
                        />
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono font-medium text-primary hover:underline cursor-pointer">{invoice.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{invoice.vendor}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {invoice.vendorGstin}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-foreground">{invoice.date}</span>
                          <span className="text-xs text-muted-foreground">Due: {invoice.dueDate}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary" className="font-normal font-mono text-xs">
                          {invoice.type.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-semibold text-foreground">
                          {formatCurrency(invoice.amount)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="text-muted-foreground font-mono text-xs">
                          {formatCurrency(invoice.tax)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant="outline" className={`${invoice.status === "Approved" ? "bg-green-50 text-green-700 border-green-200" :
                            invoice.status === "Pending" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-red-50 text-red-700 border-red-200"
                          }`}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-border bg-muted/10">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filteredInvoices.length}</span> of <span className="font-medium text-foreground">{invoices.length}</span> invoices
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  <Button variant="secondary" size="sm" className="h-8 w-8 p-0">1</Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">2</Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">3</Button>
                </div>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
