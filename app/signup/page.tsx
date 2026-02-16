"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FintoLogoIcon } from "@/components/finto-logo";
import { Lock, Mail, Loader2, ArrowRight, UserPlus, CheckCircle } from "lucide-react";
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
        <div className="min-h-screen flex mesh-gradient text-white">
            {/* Left Side - Branding (Reuse from login if possible, or simplified) */}
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
                </div>
                {/* Background decorations */}
                <div className="absolute top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blob" />
                <div className="absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-white/5 blob-delayed" />
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0B1121] lg:bg-transparent">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile Logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-4">
                        <FintoLogoIcon size={32} />
                        <span className="text-xl font-bold">Finto</span>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
                        <p className="text-gray-400 mt-2">
                            Enter your details to get started
                        </p>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm border border-red-500/20">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-500/10 text-green-400 px-4 py-3 rounded-lg text-sm border border-green-500/20 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                {success}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-[#1F2937] border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 h-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-300">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 bg-[#1F2937] border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 h-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-10 bg-[#1F2937] border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 h-10"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-6 shadow-lg shadow-blue-500/20 transition-all btn-shine"
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
                    </form>

                    <p className="text-center text-sm text-gray-400">
                        Already have an account?{" "}
                        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
