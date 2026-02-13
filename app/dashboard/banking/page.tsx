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
import {
  Plus,
  Search,
  Download,
  Building2,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Wallet,
  PiggyBank,
  Banknote,
  Link2,
  CheckCircle,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const bankAccounts = [
  {
    id: 1,
    bankName: "HDFC Bank",
    accountType: "Current Account",
    accountNumber: "****4532",
    balance: 2456780,
    lastSync: "2 mins ago",
    status: "connected",
    logo: "H",
    color: "bg-blue-600",
  },
  {
    id: 2,
    bankName: "ICICI Bank",
    accountType: "Savings Account",
    accountNumber: "****7891",
    balance: 892340,
    lastSync: "5 mins ago",
    status: "connected",
    logo: "I",
    color: "bg-orange-600",
  },
  {
    id: 3,
    bankName: "State Bank of India",
    accountType: "Current Account",
    accountNumber: "****2345",
    balance: 1567890,
    lastSync: "1 hour ago",
    status: "connected",
    logo: "S",
    color: "bg-blue-800",
  },
];

const transactions = [
  {
    id: "TXN001",
    description: "Payment from Acme Corp",
    reference: "INV-2023-001",
    date: "Oct 28, 2023",
    time: "14:32",
    type: "credit",
    amount: 125000,
    category: "Sales Receipt",
    status: "reconciled",
    bank: "HDFC Bank",
  },
  {
    id: "TXN002",
    description: "Vendor Payment - Global Tech",
    reference: "PO-2023-045",
    date: "Oct 28, 2023",
    time: "11:15",
    type: "debit",
    amount: 345000,
    category: "Purchase Payment",
    status: "pending",
    bank: "HDFC Bank",
  },
  {
    id: "TXN003",
    description: "GST Payment - Oct 2023",
    reference: "GST-OCT-2023",
    date: "Oct 27, 2023",
    time: "16:45",
    type: "debit",
    amount: 89500,
    category: "Tax Payment",
    status: "reconciled",
    bank: "ICICI Bank",
  },
  {
    id: "TXN004",
    description: "Payment from Starlight Logistics",
    reference: "INV-2023-089",
    date: "Oct 27, 2023",
    time: "09:20",
    type: "credit",
    amount: 210000,
    category: "Sales Receipt",
    status: "reconciled",
    bank: "HDFC Bank",
  },
  {
    id: "TXN005",
    description: "Salary Disbursement",
    reference: "SAL-OCT-2023",
    date: "Oct 26, 2023",
    time: "10:00",
    type: "debit",
    amount: 456000,
    category: "Payroll",
    status: "reconciled",
    bank: "SBI",
  },
  {
    id: "TXN006",
    description: "Office Rent Payment",
    reference: "RENT-OCT-2023",
    date: "Oct 25, 2023",
    time: "15:30",
    type: "debit",
    amount: 85000,
    category: "Operating Expense",
    status: "pending",
    bank: "HDFC Bank",
  },
];

const stats = [
  {
    title: "Total Balance",
    value: 4917010,
    change: "+8.2%",
    trend: "up",
    icon: Wallet,
  },
  {
    title: "This Month Inflow",
    value: 1245000,
    change: "+12.5%",
    trend: "up",
    icon: ArrowDownLeft,
  },
  {
    title: "This Month Outflow",
    value: 975500,
    change: "-5.3%",
    trend: "down",
    icon: ArrowUpRight,
  },
  {
    title: "Pending Reconciliation",
    value: 430000,
    subtext: "3 transactions",
    icon: Clock,
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function BankingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || txn.type === typeFilter;
    const matchesStatus = statusFilter === "all" || txn.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Banking" />

      <div className="flex-1 p-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Banking Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your bank accounts and reconcile transactions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  {stat.change && (
                    <span
                      className={`text-sm font-medium flex items-center gap-1 ${
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.trend === "up" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {stat.change}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-3">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {typeof stat.value === "number" ? formatCurrency(stat.value) : stat.value}
                </p>
                {stat.subtext && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bank Accounts */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Connected Bank Accounts</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              <Link2 className="h-4 w-4 mr-2" />
              Link New Account
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bankAccounts.map((account) => (
                <div
                  key={account.id}
                  className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${account.color} flex items-center justify-center text-white font-bold`}
                      >
                        {account.logo}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{account.bankName}</p>
                        <p className="text-xs text-muted-foreground">{account.accountType}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Statement
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync Now
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download Statement
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Account: {account.accountNumber}
                  </p>
                  <p className="text-2xl font-bold text-foreground mb-3">
                    {formatCurrency(account.balance)}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">Connected</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Last sync: {account.lastSync}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="reconciled">Reconciled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Transaction
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Reference
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Date & Time
                    </th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Category
                    </th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Amount
                    </th>
                    <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${
                              txn.type === "credit" ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            {txn.type === "credit" ? (
                              <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {txn.description}
                            </p>
                            <p className="text-xs text-muted-foreground">{txn.bank}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-primary font-mono">{txn.reference}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-foreground">{txn.date}</p>
                          <p className="text-xs text-muted-foreground">{txn.time}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-muted-foreground">{txn.category}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-sm font-semibold ${
                            txn.type === "credit" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {txn.type === "credit" ? "+" : "-"}
                          {formatCurrency(txn.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            txn.status === "reconciled"
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {txn.status === "reconciled" ? "Reconciled" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
