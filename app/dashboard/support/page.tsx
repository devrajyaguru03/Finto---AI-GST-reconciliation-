"use client";

import { useState } from "react";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Video,
  BookOpen,
  ExternalLink,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Headphones,
  Building2,
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
      {
        question: "How do I share reports with my clients?",
        answer:
          "You can export reports in CA-ready formats (Excel, PDF) and share directly via email. For multi-client setups, use the client portal feature to give clients secure access to their own reports and reconciliation status.",
      },
      {
        question: "Can I customize the report templates?",
        answer:
          "Yes, Professional and Enterprise plans allow report customization. You can add your firm's logo, customize headers/footers, select which columns to include, and save templates for future use.",
      },
    ],
  },
  {
    category: "Billing & Account",
    questions: [
      {
        question: "How is the invoice limit calculated?",
        answer:
          "Invoice limits are calculated per calendar month based on the total unique invoices processed across all reconciliations. Both matched and unmatched invoices count toward your limit. Unused invoices do not roll over.",
      },
      {
        question: "Can I upgrade or downgrade my plan?",
        answer:
          "Yes, you can change your plan at any time from Settings > Billing. Upgrades take effect immediately with prorated billing. Downgrades take effect at the start of your next billing cycle.",
      },
      {
        question: "Do you offer discounts for annual billing?",
        answer:
          "Yes, we offer 20% discount on all plans when you choose annual billing. Contact our sales team for custom pricing on Enterprise plans with higher volumes.",
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
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Support" />

      <div className="flex-1 p-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Find answers, get help, and contact our support team
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Email Support</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Get help via email within 24 hours
                  </p>
                  <a
                    href="mailto:support@finto.io"
                    className="text-sm text-primary font-medium mt-2 inline-flex items-center hover:underline"
                  >
                    support@finto.io
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-100">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Phone Support</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mon-Fri, 9 AM - 6 PM IST
                  </p>
                  <a
                    href="tel:+918001234567"
                    className="text-sm text-green-600 font-medium mt-2 inline-flex items-center hover:underline"
                  >
                    +91 800-123-4567
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Live Chat</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Chat with our team in real-time
                  </p>
                  <Button variant="link" className="p-0 h-auto text-purple-600 mt-2">
                    Start Chat
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FAQs Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* FAQ Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search FAQs..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {filteredFaqs.length > 0 ? (
                  filteredFaqs.map((category) => (
                    <div key={category.category} className="mb-6 last:mb-0">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        {category.category}
                      </h3>
                      <Accordion type="single" collapsible className="w-full">
                        {category.questions.map((item, index) => (
                          <AccordionItem key={index} value={`${category.category}-${index}`}>
                            <AccordionTrigger className="text-left text-sm font-medium">
                              {item.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-muted-foreground">
                              {item.answer}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No FAQs found matching your search</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resources */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Helpful Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href="#"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-blue-100">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">User Guide</p>
                      <p className="text-xs text-muted-foreground">Complete documentation</p>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-red-100">
                      <Video className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Video Tutorials</p>
                      <p className="text-xs text-muted-foreground">Step-by-step guides</p>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-green-100">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">GST Guidelines</p>
                      <p className="text-xs text-muted-foreground">Latest GST updates</p>
                    </div>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Headphones className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Webinars</p>
                      <p className="text-xs text-muted-foreground">Live sessions & recordings</p>
                    </div>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Submit Ticket */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Report a Problem
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="category" className="text-sm">
                    What is your problem about?
                  </Label>
                  <Select value={ticketCategory} onValueChange={setTicketCategory}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select category" />
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

                <div>
                  <Label htmlFor="priority" className="text-sm">
                    Priority
                  </Label>
                  <Select value={ticketPriority} onValueChange={setTicketPriority}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - General question</SelectItem>
                      <SelectItem value="medium">Medium - Need help soon</SelectItem>
                      <SelectItem value="high">High - Blocking my work</SelectItem>
                      <SelectItem value="urgent">Urgent - Critical issue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject" className="text-sm">
                    Subject
                  </Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    className="mt-1.5"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm">
                    Describe your problem
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Please provide as much detail as possible including steps to reproduce the issue, error messages, and screenshots if applicable."
                    className="mt-1.5 min-h-[120px]"
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                  />
                </div>

                <Button className="w-full" onClick={handleSubmitTicket}>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Ticket
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  We typically respond within 24 hours
                </p>
              </CardContent>
            </Card>

            {/* My Tickets */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">My Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supportTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {ticket.id}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            ticket.status === "Open"
                              ? "bg-blue-100 text-blue-700"
                              : ticket.status === "In Progress"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {ticket.status === "Open" && <AlertCircle className="h-3 w-3" />}
                          {ticket.status === "In Progress" && <Clock className="h-3 w-3" />}
                          {ticket.status === "Resolved" && <CheckCircle className="h-3 w-3" />}
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground line-clamp-1">
                        {ticket.subject}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{ticket.created}</span>
                        <span className="text-xs text-muted-foreground">
                          Updated: {ticket.lastUpdate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-3 text-primary">
                  View All Tickets
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>

            {/* Company Info */}
            <Card className="bg-muted/30">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Finto Technologies</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Support Email</p>
                    <a href="mailto:support@finto.io" className="text-primary hover:underline">
                      support@finto.io
                    </a>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Sales Inquiries</p>
                    <a href="mailto:sales@finto.io" className="text-primary hover:underline">
                      sales@finto.io
                    </a>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Business Hours</p>
                    <p className="text-foreground">Monday - Friday, 9:00 AM - 6:00 PM IST</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Address</p>
                    <p className="text-foreground">
                      123 Tech Park, Whitefield
                      <br />
                      Bangalore, Karnataka 560066
                      <br />
                      India
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
