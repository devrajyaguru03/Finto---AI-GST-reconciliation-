"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Wallet,
  Clock,
  ChevronRight,
  CheckCircle,
  Link2,
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
    color: "from-blue-600 to-blue-800",
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
    color: "from-orange-500 to-orange-700",
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
    color: "from-blue-500 to-blue-700",
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
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "This Month Inflow",
    value: 1245000,
    change: "+12.5%",
    trend: "up",
    icon: ArrowDownLeft,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    title: "This Month Outflow",
    value: 975500,
    change: "-5.3%",
    trend: "down",
    icon: ArrowUpRight,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  {
    title: "Pending Reconciliation",
    value: 430000,
    subtext: "3 transactions",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
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
    <div className="flex flex-col min-h-screen bg-muted/20">
      <AppHeader title="Banking" />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Banking Overview</h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Manage connected accounts and reconcile transactions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="shadow-sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All
            </Button>
            <Button className="shadow-lg shadow-primary/25">
              <Link2 className="h-4 w-4 mr-2" />
              Link Account
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="hover-lift border-t-4 border-t-transparent hover:border-t-primary/50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  {stat.change && (
                    <Badge variant="outline" className={`${stat.trend === "up" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                      } rounded-full px-2 py-0.5`}>
                      {stat.trend === "up" ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {stat.change}
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-foreground mt-1">
                    {typeof stat.value === "number" ? formatCurrency(stat.value) : stat.value}
                  </h3>
                  {stat.subtext && (
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bank Accounts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {bankAccounts.map((account) => (
            <Card key={account.id} className="group overflow-hidden relative border-0 shadow-md">
              <div className={`absolute inset-0 bg-gradient-to-br ${account.color} opacity-10 group-hover:opacity-15 transition-opacity`} />
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${account.color}`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${account.color} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                  {account.logo}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Statement</DropdownMenuItem>
                    <DropdownMenuItem>Sync Now</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Unlink Account</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="relative z-10 pt-2">
                <div className="space-y-1 mb-4">
                  <h3 className="font-bold text-lg text-foreground">{account.bankName}</h3>
                  <p className="text-sm text-muted-foreground">{account.accountType} • {account.accountNumber}</p>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Available Balance</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(account.balance)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-100/50 px-2 py-1 rounded-full border border-green-200/50">
                    <CheckCircle className="h-3 w-3" />
                    <span>Connected</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Transactions */}
        <Card className="overflow-hidden border-border/60 shadow-sm">
          <CardHeader className="border-b bg-muted/10 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">View and manage your latest financial activity</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-9 w-[200px] h-9 bg-background/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[110px] h-9">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="debit">Debit</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                    <th className="text-left font-medium py-3 px-6 uppercase text-xs tracking-wider">Transaction</th>
                    <th className="text-left font-medium py-3 px-4 uppercase text-xs tracking-wider">Reference</th>
                    <th className="text-left font-medium py-3 px-4 uppercase text-xs tracking-wider">Date</th>
                    <th className="text-left font-medium py-3 px-4 uppercase text-xs tracking-wider">Category</th>
                    <th className="text-right font-medium py-3 px-6 uppercase text-xs tracking-wider">Amount</th>
                    <th className="text-center font-medium py-3 px-4 uppercase text-xs tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredTransactions.map((txn) => (
                    <tr
                      key={txn.id}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${txn.type === "credit" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                              }`}
                          >
                            {txn.type === "credit" ? (
                              <ArrowDownLeft className="h-4 w-4" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {txn.description}
                            </p>
                            <p className="text-xs text-muted-foreground">{txn.bank}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-muted-foreground">
                        {txn.reference}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-foreground">{txn.date}</span>
                          <span className="text-xs text-muted-foreground">{txn.time}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="secondary" className="font-normal bg-muted text-muted-foreground hover:bg-muted">
                          {txn.category}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span
                          className={`font-semibold ${txn.type === "credit" ? "text-green-600" : "text-foreground"
                            }`}
                        >
                          {txn.type === "credit" ? "+" : "-"} {formatCurrency(txn.amount)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant={txn.status === "reconciled" ? "default" : "secondary"}
                          className={txn.status === "reconciled"
                            ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200"
                          }>
                          {txn.status === "reconciled" ? "Reconciled" : "Pending"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t flex justify-center">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                View All Transactions <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
