'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Client side supabase used mostly for listeners now or removed if not needed, 
// but we keep it if other parts need it, though for login we use action.
import { authClient } from '@/lib/auth-client';
import { getBusinessByUserId } from '@/lib/actions/basic/business';
import { businessAPI } from '@/lib/api/business';
import { useBusiness } from '@/lib/context/BusinessContext';
import { toast } from 'react-hot-toast';
import { Building2, Key, Mail, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
    const router = useRouter();
    const { updateBusiness } = useBusiness();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        console.log("Starting login process with Better Auth...");

        try {
            const { data, error } = await authClient.signIn.email({
                email,
                password,
            });

            if (error) {
                console.error("Login error:", error);
                if (error.status === 401 || error.code === 'INVALID_EMAIL_OR_PASSWORD') {
                    toast.error("Incorrect email or password. Please try again.");
                } else if (error.code === 'USER_BANNED') {
                    toast.error("This account has been suspended. Please contact support.");
                } else {
                    toast.error(error.message || 'Login failed. Please verify your credentials.');
                }
                setIsLoading(false);
                return;
            }

            // Success! Redirection logic
            const user = data?.user;

            if (!user) {
                toast.error("Session establishment failed.");
                setIsLoading(false);
                return;
            }

            // Check for multiple businesses to decide redirection
            try {
                const businesses = await businessAPI.getJoinedBusinesses(user.id);

                if (businesses && businesses.length > 0) {
                    toast.success(`Welcome back, ${user.name || 'User'}!`);

                    if (businesses.length === 1) {
                        // Exactly one business - go straight to its dashboard
                        router.push(`/business/${businesses[0].domain}`);
                    } else {
                        // Multiple businesses - go to selection screen
                        router.push('/multi-business');
                    }
                    return;
                }
            } catch (bizErr) {
                console.error("Error fetching businesses during login:", bizErr);
            }

            // Fallback - No business found
            toast.success("Login successful! Let's set up your business.");
            router.push('/register');

        } catch (error) {
            console.error('Unexpected login error:', error);
            const msg = error.message || "";
            if (msg.includes("Invalid URL")) {
                toast.error("System configuration error. Please contact support.");
            } else {
                toast.error('An unexpected error occurred. Please try again.');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row overflow-hidden">
            {/* Left Side: Branding & Visuals */}
            <div className="hidden md:flex md:w-1/2 bg-wine relative items-center justify-center p-12 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
                    <div className="grid grid-cols-10 gap-2 opacity-50 translate-x-[-10%] translate-y-[-10%] rotate-[-12deg]">
                        {Array.from({ length: 100 }).map((_, i) => (
                            <div key={i} className="w-12 h-12 border border-white/20 rounded-lg" />
                        ))}
                    </div>
                </div>

                <div className="relative z-10 max-w-lg space-y-8">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl animate-in zoom-in duration-700">
                        <Building2 className="w-10 h-10 text-white" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
                            Enterprise <br />
                            Cloud ERP.
                        </h1>
                        <p className="text-white/70 text-lg font-medium">
                            The intelligent backbone for modern Pakistani businesses. Secure, localized, and hyper-efficient.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-8">
                        <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                            <h4 className="text-white font-black text-sm mb-1 uppercase tracking-widest opacity-60">Verified User</h4>
                            <p className="text-white text-2xl font-black">2.5k+</p>
                        </div>
                        <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
                            <h4 className="text-white font-black text-sm mb-1 uppercase tracking-widest opacity-60">Success Rate</h4>
                            <p className="text-white text-2xl font-black">99.9%</p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 left-12 right-12 flex justify-between items-center text-white/40 text-xs font-bold uppercase tracking-widest">
                    <span>© 2026 TENVO</span>
                    <span>Localized Compliance v4.0</span>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-gray-50/30">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h2>
                        <p className="text-gray-500 font-medium">Please enter your credentials to access your dashboard.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Work Email Address</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-wine transition-all" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="owner@business.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-12 h-14 bg-white border-gray-100 focus:border-wine/30 focus:ring-wine/20 rounded-2xl shadow-sm transition-all text-base font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <Label htmlFor="password" className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Secret Password</Label>
                                    <button type="button" className="text-[10px] font-black uppercase text-wine hover:underline tracking-widest">Forgot Access?</button>
                                </div>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-wine transition-all" />
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-12 h-14 bg-white border-gray-100 focus:border-wine/30 focus:ring-wine/20 rounded-2xl shadow-sm transition-all text-base font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 bg-wine hover:bg-wine/90 text-white font-black rounded-2xl shadow-xl shadow-wine/20 text-lg transition-all active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Establishing Session...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-2">
                                    <span>Access Dashboard</span>
                                    <ArrowRight className="w-5 h-5" />
                                </div>
                            )}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-transparent px-2 text-gray-400 font-bold tracking-widest">Business Partnership</span>
                        </div>
                    </div>

                    <p className="text-center text-sm font-medium text-gray-500">
                        New to TENVO?{' '}
                        <button
                            type="button"
                            onClick={() => router.push('/register')}
                            className="text-wine font-black hover:underline underline-offset-4"
                        >
                            Register your business today
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
