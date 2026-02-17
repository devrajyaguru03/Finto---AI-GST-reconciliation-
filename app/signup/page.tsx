"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FintoLogoIcon } from "@/components/finto-logo";
import { Lock, Mail, Loader2, ArrowRight, UserPlus, CheckCircle, Zap, Shield, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function SignupPage() {
    const router = useRouter();
    const { login, isAuthenticated } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (isAuthenticated) {
            router.replace("/dashboard");
        }
    }, [isAuthenticated, router]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || "Registration failed");
                setIsLoading(false);
                return;
            }

            setSuccess("Account created successfully!");
            // Auto login
            login(data.token, data.email);
            setTimeout(() => router.push("/dashboard"), 1000);
        } catch (err) {
            setError("Cannot connect to server");
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
                        Join Finto Today
                    </h1>
                    <p className="text-lg text-white/80 mb-10 leading-relaxed">
                        Start reconciling your GST data with AI precision. Create an account to access premium features.
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

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-4">
                        <FintoLogoIcon size={32} />
                        <span className="text-xl font-bold">Finto</span>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
                        <p className="text-muted-foreground mt-2">
                            Enter your details to get started
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

                    <form onSubmit={handleSignup} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
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
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 h-12 text-base"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10 h-12 text-base"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold gradient-bg hover:opacity-90 text-white btn-shine"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5 mr-2" />
                                    Sign Up
                                </>
                            )}
                        </Button>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-muted-foreground">Already have an account? </span>
                            <Link href="/login" className="font-medium text-primary hover:underline">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
