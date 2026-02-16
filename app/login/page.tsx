"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FintoLogoIcon } from "@/components/finto-logo";
import { Mail, ArrowRight, Shield, Zap, Users, Loader2, CheckCircle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/lib/auth-context";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Failed to send OTP");
        return;
      }

      setSuccess("OTP sent! Please check your email inbox.");
      setStep("otp");
      // Focus first OTP input
      setSuccess("OTP sent! Please check your email inbox.");
      setStep("otp");
    } catch (err) {
      setError("Cannot connect to backend. Make sure it's running on port 8000.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      handleVerifyOTP(pasted);
      e.preventDefault();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    setError("");
    const code = otpCode || otp.join("");
    if (code.length !== 6) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Invalid OTP");
        setOtp(["", "", "", "", "", ""]);
        if (!res.ok) {
          setError(data.detail || "Invalid OTP");
          setOtp(["", "", "", "", "", ""]);
          return;
        }
        return;
      }

      // Login success
      login(data.token, data.email);
      setSuccess("Verified! Redirecting...");
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (err) {
      setError("Cannot connect to backend. Make sure it's running on port 8000.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex mesh-gradient">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 gradient-bg opacity-95" />
        <div className="relative z-10 p-12 text-white max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <FintoLogoIcon size={40} />
            <span className="text-2xl font-bold tracking-tight">Finto</span>
          </div>
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            AI-Powered GST Reconciliation
          </h1>
          <p className="text-lg text-white/80 mb-10 leading-relaxed">
            Cut GST reconciliation time by 60-70%. Upload your Purchase Register and GSTR-2B — get instant results.
          </p>
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Instant Reconciliation</p>
                <p className="text-sm text-white/70">Upload 2 files, get results in seconds</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">ITC Protection</p>
                <p className="text-sm text-white/70">Identify at-risk input tax credit instantly</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Vendor Emails</p>
                <p className="text-sm text-white/70">Auto-generate vendor communication for discrepancies</p>
              </div>
            </div>
          </div>
        </div>
        {/* Background decorations */}
        <div className="absolute top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blob" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-white/5 blob-delayed" />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-4">
            <FintoLogoIcon size={32} />
            <span className="text-xl font-bold">Finto</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {step === "email" ? "Sign in to your account" : "Enter verification code"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {step === "email"
                ? "Enter your email to receive a one-time password"
                : `We've sent a 6-digit code to ${email}`}
            </p>
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm border border-destructive/20">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm border border-green-500/20 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          )}

          {step === "email" ? (
            /* Step 1: Email Input */
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 text-base"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold gradient-bg hover:opacity-90 text-white btn-shine"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-5 h-5 mr-2" />
                )}
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                🔒 A 6-digit verification code will be sent to your email by <strong>Team Finto</strong>
              </p>
            </form>
          ) : (
            /* Step 2: OTP Verification */
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Verification Code</Label>
                <div className="flex justify-center" onPaste={handleOTPPaste}>
                  <InputOTP
                    maxLength={6}
                    value={otp.join("")}
                    onChange={(value) => {
                      setOtp(value.split(""));
                      if (value.length === 6) {
                        handleVerifyOTP(value);
                      }
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>

              <Button
                onClick={() => handleVerifyOTP()}
                className="w-full h-12 text-base font-semibold gradient-bg hover:opacity-90 text-white btn-shine"
                disabled={isLoading || otp.join("").length !== 6}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-5 h-5 mr-2" />
                )}
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setOtp(["", "", "", "", "", ""]);
                    setError("");
                    setSuccess("");
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={() => handleSendOTP({ preventDefault: () => { } } as React.FormEvent)}
                  className="text-sm text-primary hover:underline transition-colors"
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                📧 Didn't receive the email? Check your spam folder or click Resend OTP
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
