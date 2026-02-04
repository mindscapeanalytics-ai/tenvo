'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import {
  Quote, Calendar, Clock, Lock, Layers, Briefcase, Award, Factory, ChevronRight, Store, Globe, Package, ShoppingCart, TrendingUp, Receipt, Building2, Smartphone, Shield, Users, Menu, X, ChevronDown, Check, PieChart, Zap, BarChart3, FileText, ArrowRight, Star, Target, DollarSign, CreditCard, FileCheck, Database, Tag, Cloud, Rocket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { domainKnowledge } from '@/lib/domainKnowledge';
import { useAuth } from '@/lib/context/AuthContext';
import { useBusiness } from '@/lib/context/BusinessContext';

// Helper to render Lucide icon by name safely
const IconRenderer = ({ name, className }) => {
  const Icon = LucideIcons[name] || LucideIcons.Package;
  return <Icon className={className} />;
};

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { business, loading: businessLoading } = useBusiness();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-redirect to dashboard if logged in - REMOVED to allow visiting landing page
  /*
  useEffect(() => {
    if (!authLoading && !businessLoading && user && business) {
      router.push(`/business/${business.domain || 'retail-shop'}`);
    }
  }, [user, business, authLoading, businessLoading, router]);
  */

  // High-quality professional imagery
  const inventoryImages = [
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=800&fit=crop', // Business Analytics
    'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=1200&h=800&fit=crop', // Payment
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&h=800&fit=crop', // Warehouse
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % inventoryImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const toggleMenu = (menu) => {
    setExpandedMenu(expandedMenu === menu ? null : menu);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-wine/10">
      {/* Decorative Blur Elements */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-wine/5 rounded-full blur-[120px] -z-10 -translate-y-1/2 translate-x-1/2" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-wine/5 rounded-full blur-[100px] -z-10 translate-y-1/2 -translate-x-1/2" />

      {/* --- Navigation --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div
              onClick={() => router.push('/')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-wine text-white shadow-xl shadow-wine/20 group-hover:scale-105 transition-all duration-300">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-xl font-black tracking-tighter uppercase text-gray-900">TENVO</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-8">
              <div className="flex items-center gap-6">
                <NavDropdown
                  label="Solutions"
                  isOpen={expandedMenu === 'products'}
                  onToggle={() => toggleMenu('products')}
                >
                  <div className="w-[640px] p-8 grid grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest">Enterprise Core</h4>
                      <DropdownLink href="/register" icon={<Package />} title="Inventory Engine" desc="Precision stock control with batch & serial tracking." />
                      <DropdownLink href="/register" icon={<Receipt />} title="Tax Compliance" desc="FBR & Local tax localized automation." />
                      <DropdownLink href="/register" icon={<Briefcase />} title="General Ledger" desc="Double-entry accounting for professionals." />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest">Verticals</h4>
                      <DropdownLink href="/register?domain=retail-shop" icon={<Store />} title="POS Terminal" desc="High-speed retail checkout workflows." />
                      <DropdownLink href="/register?domain=industrial-manufacturing" icon={<Factory />} title="Manufacturing" desc="BOM, Work Orders, and shop floor control." />
                      <DropdownLink href="/register?domain=wholesale-distribution" icon={<Globe />} title="B2B Supply Chain" desc="Wholesale and distribution management." />
                    </div>
                  </div>
                </NavDropdown>

                <button className="text-sm font-bold text-gray-600 hover:text-wine transition-colors">Enterprise</button>
                <button className="text-sm font-bold text-gray-600 hover:text-wine transition-colors">Pricing</button>
              </div>

              <div className="h-4 w-px bg-gray-200 mx-2" />

              <div className="flex items-center gap-4">
                {user ? (
                  <Button onClick={() => router.push(`/business/${business?.domain || 'retail-shop'}`)} className="bg-wine hover:bg-wine/90 text-white font-black rounded-xl px-8 shadow-lg shadow-wine/20 transition-all active:scale-[0.98]">
                    Enter Dashboard
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" className="font-bold text-gray-900 hover:bg-gray-50 rounded-xl px-6" onClick={() => router.push('/login')}>
                      Log In
                    </Button>
                    <Button onClick={() => router.push('/register')} className="bg-wine hover:bg-wine/90 text-white font-black rounded-xl px-8 shadow-lg shadow-wine/20 transition-all active:scale-[0.98]">
                      Start Your Journey
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
            <div className="space-y-4">
              <div className="font-bold text-gray-900 px-2 uppercase text-[10px] tracking-widest text-gray-400">Products</div>
              <div className="grid gap-2">
                <button className="text-left font-bold text-gray-700 px-2 py-2">Inventory Management</button>
                <button className="text-left font-bold text-gray-700 px-2 py-2">Accounting & Finance</button>
                <button className="text-left font-bold text-gray-700 px-2 py-2">POS Station</button>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" className="w-full h-12 font-bold rounded-xl" onClick={() => router.push('/login')}>Log In</Button>
              <Button className="w-full h-12 bg-wine font-black text-white rounded-xl" onClick={() => router.push('/register')}>Join Enterprise</Button>
            </div>
          </div>
        )}
      </nav>


      {/* --- Hero Section --- */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-wine/5 text-wine text-[11px] font-black uppercase tracking-widest border border-wine/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wine opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-wine"></span>
                </span>
                V4.0 Enterprise Edition
              </div>

              <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-gray-900 leading-[0.95]">
                The Intelligent <br />
                <span className="text-wine">Operating System</span> <br />
                for Pakistan.
              </h1>

              <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-xl">
                Unified financial infrastructure for the modern enterprise. Scale your inventory, accounting, and compliance with bank-grade precision.
              </p>

              <div className="flex flex-wrap gap-5">
                <Button size="lg" className="h-16 px-10 text-lg font-black bg-wine hover:bg-wine/90 text-white rounded-2xl shadow-[0_20px_40px_-15px_rgba(144,20,53,0.3)] transition-all active:scale-[0.98]"
                  onClick={() => router.push(user ? `/business/${business?.domain || 'retail-shop'}` : '/register')}>
                  {user ? 'Back to Dashboard' : 'Start Building'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                {!user && (
                  <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-bold border-gray-200 hover:bg-gray-50 rounded-2xl transition-all" onClick={() => router.push('/demo')}>
                    Schedule Demo
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-12 pt-12 border-t border-gray-100">
                <div>
                  <div className="text-4xl font-black text-gray-900 tracking-tighter">450k+</div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Active Users</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-gray-900 tracking-tighter">99.9%</div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Core Uptime</div>
                </div>
                <div>
                  <div className="text-4xl font-black text-gray-900 tracking-tighter">SECP</div>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Compliant</div>
                </div>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative group perspective-1000">
              <div className="relative rounded-[40px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-gray-100 bg-white p-4">
                <div className="relative rounded-[32px] overflow-hidden aspect-[4/3]">
                  <img
                    src={inventoryImages[currentImageIndex]}
                    alt="Dashboard Preview"
                    className="w-full h-full object-cover transition-all duration-1000 scale-105 group-hover:scale-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>

                {/* Overlying UI Elements */}
                <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden xl:block p-6 bg-white rounded-3xl shadow-2xl border border-gray-100 animate-in slide-in-from-left-8 duration-1000 delay-500">
                  <div className="flex flex-col gap-4">
                    <div className="w-12 h-12 bg-wine/5 rounded-2xl flex items-center justify-center text-wine">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Growth</div>
                      <div className="text-2xl font-black text-gray-900">+42.8%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* --- Features Grid --- */}
      <section className="py-32 bg-gray-50/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-24 space-y-4">
            <h2 className="text-[11px] font-black text-wine uppercase tracking-[0.3em] mb-4">Enterprise Capabilities</h2>
            <h3 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">Everything you need <br /> to run your business</h3>
            <p className="text-lg text-gray-500 font-medium">
              Eliminate software silos. TENVO integrates inventory, finance, and operations into a single, high-performance source of truth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            <FeatureCard
              icon={<Package />}
              title="Inventory Intelligence"
              desc="Real-time multi-warehouse tracking with AI-driven stock predictions and low-stock alerts."
            />
            <FeatureCard
              icon={<Receipt />}
              title="Automated Compliance"
              desc="Stay 100% compliant with FBR Tier-1, SRB, and PRA regulations automatically."
            />
            <FeatureCard
              icon={<PieChart />}
              title="Advanced Analytics"
              desc="Instant P&L, Balance Sheets, and Cash Flow statements with granular drill-down capacity."
            />
            <FeatureCard
              icon={<Store />}
              title="Scale Everywhere"
              desc="Manage hundreds of branches, outlets, and depots from a single global control center."
            />
            <FeatureCard
              icon={<Shield />}
              title="Identity & Security"
              desc="Zero-trust security architecture with role-based access and immutable audit trails."
            />
            <FeatureCard
              icon={<Cloud />}
              title="Cloud Infrastructure"
              desc="High-availability server network ensuring your business stays online 24/7/365."
            />
          </div>
        </div>
      </section>


      {/* --- Domain Expertise --- */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl space-y-4">
              <h2 className="text-[11px] font-black text-wine uppercase tracking-[0.3em] mb-4">Market Verticals</h2>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">Localized for your Industry</h3>
              <p className="text-gray-500 font-medium text-lg leading-relaxed">
                We've built specialized ERP frameworks pre-configured for Pakistan's most critical business sectors.
              </p>
            </div>
            <Button variant="ghost" className="font-bold text-wine hover:bg-wine/5 px-8 h-12 rounded-xl" onClick={() => router.push('/register')}>
              Explore All Verticals <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {Object.entries(domainKnowledge).slice(0, 12).map(([slug, domain]) => (
              <a
                key={slug}
                href={`/register?domain=${slug}`}
                className="group relative flex flex-col items-center p-8 bg-white border border-gray-100 rounded-[32px] hover:border-wine/20 hover:shadow-2xl hover:shadow-wine/5 transition-all duration-300"
              >
                <div className="p-5 bg-gray-50 rounded-2xl group-hover:bg-wine group-hover:text-white transition-all duration-300 mb-6">
                  <IconRenderer name={domain.icon} className="w-7 h-7" />
                </div>
                <span className="text-sm font-black text-center capitalize text-gray-900 group-hover:text-wine transition-colors">
                  {slug.replace('-', ' ')}
                </span>
                <div className="mt-2 h-1 w-0 bg-wine group-hover:w-8 transition-all duration-300 rounded-full" />
              </a>
            ))}
          </div>
        </div>
      </section>


      {/* --- Testimonials --- */}
      <section className="py-32 bg-wine relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-white rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1400px] h-[1400px] border border-white rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-[11px] font-black text-white/60 uppercase tracking-[0.4em] mb-4">Partner Success</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Trusted by Industry Leaders</h3>
          </div>
          <div className="grid md:grid-cols-3 gap-10">
            <TestimonialCard
              quote="The most intuitive ERP we've ever used. It streamlined our entire supply chain within months."
              author="Ibrahim Mansoor"
              role="Director, Mansoor Textiles"
            />
            <TestimonialCard
              quote="TENVO's tax automation saved our accounting team hundreds of hours every quarter."
              author="Sara Ahmed"
              role="CFO, Nexus Logis"
            />
            <TestimonialCard
              quote="Finally, a platform that scales with us. managing 20+ retail locations is now effortless."
              author="Kamran Malik"
              role="Founder, Malik Mart"
            />
          </div>
        </div>
      </section>


      {/* --- Final CTA --- */}
      <section className="py-32 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-12">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-wine/5 rounded-[40px] blur-xl" />
            <div className="relative p-12 space-y-6">
              <h2 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tighter">Join the Future of <br /> Business Excellence</h2>
              <p className="text-xl text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
                Join 450,000+ forward-thinking enterprises running on TENVO. Start your zero-risk journey today.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6 pt-6 animate-bounce-subtle">
                <Button size="lg" className="h-16 px-12 text-lg font-black bg-wine hover:bg-wine/90 text-white rounded-2xl shadow-2xl shadow-wine/20 transition-all active:scale-[0.98]" onClick={() => router.push('/register')}>
                  Launch Your Account
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-12 text-lg font-bold border-gray-200 hover:bg-gray-50 rounded-2xl transition-all" onClick={() => router.push('/demo')}>
                  Request Enterprise Demo
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-12 text-[10px] font-black uppercase text-gray-400 tracking-[0.4em]">
            TENVO Global Enterprise Cloud
          </div>
        </div>
      </section>


      {/* --- Footer --- */}
      <footer className="bg-white border-t border-gray-100 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="grid md:grid-cols-4 gap-16 mb-24">
            <div className="space-y-6">
              <div className="flex items-center gap-3 font-black text-xl uppercase tracking-tighter">
                <div className="w-8 h-8 bg-wine rounded-lg flex items-center justify-center text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                TENVO
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                The backbone for modern Pakistani enterprises looking for scalability, precision, and compliance.
              </p>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-8">Platform</h4>
              <ul className="space-y-4 text-sm text-gray-500 font-bold">
                <li><a href="#" className="hover:text-wine transition-colors">Core Features</a></li>
                <li><a href="#" className="hover:text-wine transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-wine transition-colors">Compliance</a></li>
                <li><a href="#" className="hover:text-wine transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-8">Company</h4>
              <ul className="space-y-4 text-sm text-gray-500 font-bold">
                <li><a href="#" className="hover:text-wine transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-wine transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-wine transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-wine transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-8">Support</h4>
              <ul className="space-y-4 text-sm text-gray-500 font-bold">
                <li><a href="#" className="hover:text-wine transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-wine transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-wine transition-colors">API Status</a></li>
                <li><a href="#" className="hover:text-wine transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              © 2026 TENVO Enterprise. Built for Pakistan.
            </div>
            <div className="flex gap-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <a href="#" className="hover:text-wine transition-colors">Pakistan</a>
              <a href="#" className="hover:text-wine transition-colors">UAE</a>
              <a href="#" className="hover:text-wine transition-colors">Saudi Arabia</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Sub-Components ---

function NavDropdown({ label, isOpen, onToggle, children }) {
  return (
    <div className="relative">
      <button
        className={`flex items-center gap-1.5 text-sm font-bold transition-all hover:text-wine ${isOpen ? 'text-wine' : 'text-gray-600'}`}
        onClick={onToggle}
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-[calc(100%+12px)] left-0 mt-2 bg-white border border-gray-100 rounded-[32px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] z-50 animate-in fade-in zoom-in-95 duration-300 p-2 min-w-[200px]">
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownLink({ icon, title, desc, href = "#" }) {
  return (
    <a href={href} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all group">
      <div className="mt-1 p-2 bg-gray-50 rounded-xl group-hover:bg-wine group-hover:text-white transition-all">
        <div className="w-5 h-5">{icon}</div>
      </div>
      <div>
        <div className="font-bold text-gray-900 group-hover:text-wine transition-colors text-sm">{title}</div>
        <div className="text-xs text-gray-400 font-medium mt-0.5">{desc}</div>
      </div>
    </a>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white border border-gray-100 p-10 rounded-[40px] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-2 group">
      <div className="text-gray-900 mb-8 p-4 bg-gray-50 rounded-2xl w-fit group-hover:bg-wine group-hover:text-white transition-all duration-500">
        <div className="w-8 h-8">{icon}</div>
      </div>
      <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
  );
}

function TestimonialCard({ quote, author, role }) {
  return (
    <div className="bg-white/5 backdrop-blur-md p-10 rounded-[40px] border border-white/10 relative group hover:bg-white/10 transition-all duration-500">
      <Quote className="w-10 h-10 mb-8 text-white/20" />
      <p className="text-xl leading-relaxed mb-8 font-bold text-white/90 italic">"{quote}"</p>
      <div>
        <div className="font-black text-white uppercase tracking-widest text-[10px]">{author}</div>
        <div className="text-xs text-white/40 font-bold mt-1">{role}</div>
      </div>
    </div>
  );
}
