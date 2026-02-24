"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Mail,
  Phone,
  MessageCircle,
  HelpCircle,
  FileText,
  ExternalLink,
  Send,
  ChevronRight,
  LifeBuoy,
} from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I upload my GSTR-2B data?",
        answer:
          "To upload your GSTR-2B data, go to Dashboard > Reconciliation > Import Data. You can either download the JSON file from the GST portal or use our direct API integration. Supported formats include JSON and Excel exports from the government portal.",
      },
      {
        question: "What file formats are supported for Purchase Register?",
        answer:
          "Finto supports multiple file formats for Purchase Register uploads including Excel (.xlsx, .xls), CSV, and XML formats. We also support direct exports from popular accounting software like Tally, Zoho Books, and QuickBooks.",
      },
      {
        question: "How does the auto-matching algorithm work?",
        answer:
          "Our AI-powered matching algorithm compares invoice numbers, GSTIN, amounts, and dates between your books and GSTR-2B. It uses fuzzy matching for invoice numbers to handle minor discrepancies and flags potential matches for your review.",
      },
    ],
  },
  {
    category: "Reconciliation",
    questions: [
      {
        question: "What causes mismatches between my books and GSTR-2B?",
        answer:
          "Common causes include: 1) Different invoice numbers in vendor's system vs yours, 2) Timing differences where vendor filed in a different period, 3) Amount discrepancies due to rounding or tax calculation differences, 4) Missing invoices not yet uploaded by vendor to GST portal.",
      },
      {
        question: "How do I resolve discrepancies with vendors?",
        answer:
          "Use our Resolution Center to send automated nudge emails to vendors. Go to Reconciliation > Resolution Center, select the vendor, and use the email template feature. You can customize the message and attach a discrepancy report PDF.",
      },
      {
        question: "Can I reconcile multiple months at once?",
        answer:
          "Yes, Finto supports bulk reconciliation. Upload all your data files and GSTR-2B exports for multiple periods. The system will automatically organize and reconcile each period separately while giving you a consolidated view.",
      },
    ],
  },
  {
    category: "Reports & Export",
    questions: [
      {
        question: "What reports can I generate from Finto?",
        answer:
          "Finto generates comprehensive reports including: Reconciliation Summary, Mismatch Report, Missing Invoice Report, ITC Eligibility Report, Vendor-wise Analysis, and Period Comparison reports. All reports can be exported as PDF or Excel.",
      },
    ],
  },
];

const supportTickets = [
  {
    id: "TKT-2023-089",
    subject: "Unable to import Tally export file",
    status: "Open",
    priority: "High",
    created: "Oct 28, 2023",
    lastUpdate: "2 hours ago",
  },
  {
    id: "TKT-2023-087",
    subject: "Request for custom report format",
    status: "In Progress",
    priority: "Medium",
    created: "Oct 26, 2023",
    lastUpdate: "1 day ago",
  },
  {
    id: "TKT-2023-082",
    subject: "Question about ITC eligibility rules",
    status: "Resolved",
    priority: "Low",
    created: "Oct 22, 2023",
    lastUpdate: "Oct 24, 2023",
  },
];

const problemCategories = [
  { value: "import", label: "Data Import Issues" },
  { value: "reconciliation", label: "Reconciliation Problems" },
  { value: "reports", label: "Report Generation" },
  { value: "billing", label: "Billing & Subscription" },
  { value: "account", label: "Account & Access" },
  { value: "integration", label: "Software Integration" },
  { value: "other", label: "Other" },
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketCategory, setTicketCategory] = useState("");
  const [ticketPriority, setTicketPriority] = useState("");

  const filteredFaqs = faqs
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.questions.length > 0);

  const handleSubmitTicket = () => {
    // In a real app, this would submit to backend
    alert("Support ticket submitted successfully! We will respond within 24 hours.");
    setTicketSubject("");
    setTicketDescription("");
    setTicketCategory("");
    setTicketPriority("");
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <AppHeader title="Support" />

      <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Page Header */}
        <div className="text-center md:text-left space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Help Center</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Everything you need to troubleshoot issues, learn more, and get in touch with our team.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover-lift border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-primary/10 ring-4 ring-primary/5">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Email Support</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Get detailed answers within 24 hours
                  </p>
                  <Button variant="outline" className="rounded-full">
                    <span className="mr-2">support@finto.io</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-green-100 ring-4 ring-green-50">
                  <Phone className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Phone Support</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Mon-Fri, 9:00 AM - 6:00 PM IST
                  </p>
                  <Button variant="outline" className="rounded-full text-green-700 hover:text-green-800 hover:bg-green-50">
                    <span className="mr-2">+91 800-123-4567</span>
                    <Phone className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="p-4 rounded-full bg-purple-100 ring-4 ring-purple-50">
                  <MessageCircle className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Live Chat</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-3">
                    Chat with our team in real-time
                  </p>
                  <Button className="rounded-full bg-purple-600 hover:bg-purple-700">
                    Start Chat <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQs Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* FAQ Search */}
            <Card className="shadow-sm border-border/60">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <LifeBuoy className="h-5 w-5 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative mb-8">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search for answers..."
                    className="pl-11 h-12 text-base shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {filteredFaqs.length > 0 ? (
                  <div className="space-y-8">
                    {filteredFaqs.map((category) => (
                      <div key={category.category}>
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 ml-1">
                          {category.category}
                        </h3>
                        <Accordion type="single" collapsible className="w-full space-y-3">
                          {category.questions.map((item, index) => (
                            <AccordionItem
                              key={index}
                              value={`${category.category}-${index}`}
                              className="border rounded-lg px-4 bg-background shadow-sm data-[state=open]:ring-2 data-[state=open]:ring-primary/20 transition-all"
                            >
                              <AccordionTrigger className="text-left font-medium hover:no-underline py-4">
                                {item.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
                                {item.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed text-muted-foreground">
                    <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p>No results found for &quot;{searchQuery}&quot;</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Right Column - Forms & Tickets */}
          <div className="space-y-6">
            {/* Submit Ticket */}
            <Card className="shadow-lg border-primary/20 ring-1 ring-primary/5">
              <CardHeader className="bg-primary/5 pb-4 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Report a Problem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={ticketCategory} onValueChange={setTicketCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                    <SelectContent>
                      {problemCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={ticketPriority} onValueChange={setTicketPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Brief summary"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Details about the issue..."
                    className="min-h-[100px] resize-none"
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                  />
                </div>

                <Button className="w-full shadow-lg" onClick={handleSubmitTicket}>
                  Submit Ticket
                </Button>
              </CardContent>
            </Card>

            {/* My Tickets */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base font-semibold">Recent Tickets</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {supportTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 h-5 ${ticket.status === "Open" ? "text-blue-600 border-blue-200 bg-blue-50" :
                          ticket.status === "Resolved" ? "text-green-600 border-green-200 bg-green-50" :
                            "text-amber-600 border-amber-200 bg-amber-50"
                          }`}>
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-foreground line-clamp-1 mb-1">{ticket.subject}</p>
                      <span className="text-xs text-muted-foreground">{ticket.lastUpdate}</span>
                    </div>
                  ))}
                </div>
                <Button variant="link" className="w-full mt-2 h-auto p-0 text-primary">
                  View All History
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
