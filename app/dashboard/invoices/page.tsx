"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  Building2,
  Eye,
  Pencil,
  Trash2,
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
    title: "Pending",
    value: "89",
    change: "Worth Rs. 2.4L",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  {
    title: "Approved",
    value: "1,150",
    change: "89.6% approval rate",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    title: "Disputed",
    value: "45",
    change: "Requires attention",
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
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Invoices" />

      <div className="flex-1 p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Invoice Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track, manage, and reconcile all your purchase and sales invoices
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {invoiceStats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice ID, vendor name, or GSTIN..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <Filter className="h-4 w-4 mr-2" />
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
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Actions */}
        {selectedInvoices.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              {selectedInvoices.length} invoice(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Export Selected
              </Button>
              <Button variant="outline" size="sm">
                Mark as Approved
              </Button>
              <Button variant="destructive" size="sm">
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 w-10">
                      <Checkbox
                        checked={
                          filteredInvoices.length > 0 &&
                          selectedInvoices.length === filteredInvoices.length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Invoice
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Vendor
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Date
                      </div>
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Type
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <IndianRupee className="h-3 w-3" />
                        Amount
                      </div>
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Tax (GST)
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Status
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={() => toggleSelect(invoice.id)}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium text-primary">{invoice.id}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{invoice.vendor}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {invoice.vendorGstin}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-foreground">{invoice.date}</p>
                          <p className="text-xs text-muted-foreground">Due: {invoice.dueDate}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            invoice.type === "Purchase"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {invoice.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm font-medium text-foreground">
                          {formatCurrency(invoice.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(invoice.tax)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            invoice.status === "Approved"
                              ? "bg-green-100 text-green-700"
                              : invoice.status === "Pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing {filteredInvoices.length} of {invoices.length} invoices
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
