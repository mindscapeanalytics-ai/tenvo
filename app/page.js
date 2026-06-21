'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Package,
  Receipt,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Workflow,
  BarChart3,
  Globe,
  Factory,
  Upload,
  Clipboard,
  Plus,
  Shield,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  ArrowLeftRight,
  Settings,
  Info,
  ChevronDown,
  ShoppingBag,
  Truck,
  CheckCircle,
  MessageSquare,
  Cpu,
  Play,
  X,
  Award,
  Lock,
  Server,
  BadgeCheck,
  Star,
} from 'lucide-react';
import MarketingLayout from '@/components/marketing/layout/MarketingLayout';
import {
  MARKETING_CONTAINER,
  MARKETING_MAIN_BOTTOM_STICKY,
} from '@/lib/utils/marketingLayout';
import { TenvoTextLogo } from '@/components/branding/TenvoTextLogo';
import CommerceAndIntelligenceSection from '@/components/marketing/sections/CommerceAndIntelligenceSection';
import CompetitorComparisonSection from '@/components/marketing/sections/CompetitorComparisonSection';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/context/AuthContext';
import { trackEvent, EVENTS } from '@/lib/analytics/tracking';

// Marketing highlights (avoid unverifiable user counts on the public site).
const trustStats = [
  { value: 'One stack', label: 'Storefront, POS, inventory, and accounting in sync' },
  { value: 'Pakistan-first', label: 'Tax and workflows tuned for local operators' },
  { value: 'Role-based', label: 'Clear permissions from cashier to owner' },
  { value: 'Guided rollout', label: 'Imports, templates, and demo-led onboarding' },
];

const partners = [
  { name: 'Shopify', category: 'E-commerce' },
  { name: 'Daraz', category: 'Marketplace' },
  { name: 'TCS', category: 'Shipping' },
  { name: 'Leopards', category: 'Shipping' },
  { name: 'FBR', category: 'Tax' },
  { name: 'WooCommerce', category: 'E-commerce' },
  { name: 'Stripe', category: 'Payments' },
  { name: 'PayPal', category: 'Payments' },
  { name: 'Razorpay', category: 'Payments' },
  { name: 'JazzCash', category: 'Local Pay' },
  { name: 'EasyPaisa', category: 'Local Pay' },
  { name: 'FedEx', category: 'Shipping' },
  { name: 'DHL', category: 'Shipping' },
  { name: 'Amazon', category: 'Marketplace' },
  { name: 'eBay', category: 'Marketplace' },
  { name: 'QuickBooks', category: 'Accounting' },
  { name: 'Xero', category: 'Accounting' },
  { name: 'Slack', category: 'Productivity' },
  { name: 'WhatsApp', category: 'Messaging' },
  { name: 'Zapier', category: 'Automation' },
];

/** Mobile hero: compact icon row (floating cards are hidden below md so the portrait stays clear). */
const HERO_MOBILE_LIVE_OPS = [
  {
    key: 'sales-order',
    label: 'Sales order SO-00208 — tax calculated, reconciled, ready to ship.',
    Icon: FileSpreadsheet,
    iconClass: 'text-brand-primary',
    iconBg: 'bg-brand-primary/10',
  },
  {
    key: 'omnichannel',
    label: 'Omnichannel sync — PKR 142.5k sales, channels connected.',
    Icon: Sparkles,
    iconClass: 'text-red-600',
    iconBg: 'bg-red-50',
  },
  {
    key: 'ai-reorder',
    label: 'AI auto-reorder — triggered with two days lead time.',
    Icon: Cpu,
    iconClass: 'text-brand-primary',
    iconBg: 'bg-brand-primary/10',
  },
  {
    key: 'dispatch',
    label: 'TCS dispatched — AWB 72918231.',
    Icon: Truck,
    iconClass: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    key: 'audit',
    label: 'Agentic audit OK — zero anomalies detected.',
    Icon: ShieldCheck,
    iconClass: 'text-green-600',
    iconBg: 'bg-green-50',
  },
];

export default function Home() {
  const { user } = useAuth();
  const workspaceHref = user ? '/multi-business' : '/register';
  const workspaceCtaMobile = user ? 'Open workspace' : 'Start free';
  const workspaceCtaDesktop = user ? 'OPEN WORKSPACE' : 'START FREE';

  const trackHeroCta = (kind, href) => {
    trackEvent(EVENTS.HERO_CTA_CLICK, {
      cta_location: 'home_hero',
      cta_kind: kind,
      cta_destination: href,
    });
  };

  // --- STATE FOR INTERACTIVE COMPONENTS ---
  const [activeFeatureTab, setActiveFeatureTab] = useState('inventory');
  const [stickyCtaScrollReady, setStickyCtaScrollReady] = useState(false);
  const [stickyCtaDismissed, setStickyCtaDismissed] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);

  const STICKY_CTA_DISMISS_KEY = 'tenvo_sticky_cta_dismissed_session';

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && sessionStorage.getItem(STICKY_CTA_DISMISS_KEY) === '1') {
        setStickyCtaDismissed(true);
      }
    } catch {
      /* ignore private mode */
    }
  }, []);

  const dismissStickyCta = () => {
    setStickyCtaDismissed(true);
    try {
      sessionStorage.setItem(STICKY_CTA_DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const showStickyCta = stickyCtaScrollReady && !stickyCtaDismissed;

  // Sticky CTA scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setStickyCtaScrollReady(window.scrollY > 600);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cost & Margin Calculator State
  const [calcCost, setCalcCost] = useState(1200);
  const [calcMargin, setCalcMargin] = useState(25);
  const [calcTaxRate, setCalcTaxRate] = useState(18); // FBR standard GST 18%

  // Live calculations
  const marginAmount = Math.round((calcCost * calcMargin) / 100);
  const basePrice = Number(calcCost) + Number(marginAmount);
  const taxAmount = Math.round((basePrice * calcTaxRate) / 100);
  const finalSellingPrice = basePrice + taxAmount;

  // Excel Paste Simulator State
  const [excelRows, setExcelRows] = useState([
    { sku: 'TNV-SH-001', name: 'Cotton Crew Neck Shirt', stock: 120, status: 'pending', error: '' },
    { sku: 'TNV-SH-002', name: 'Premium Denim Jeans', stock: 85, status: 'pending', error: '' },
    { sku: 'TNV-SH-001', name: 'Duplicate Cotton Shirt', stock: 50, status: 'pending', error: '' }, // Intentional duplicate to demonstrate verification
    { sku: 'TNV-SH-004', name: 'Linen Casual Blazer', stock: 40, status: 'pending', error: '' },
  ]);
  const [isSimulatingExcel, setIsSimulatingExcel] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState('idle'); // idle, processing, done

  // --- LIVE OPERATIONS TERMINAL STATES ---
  const [activeTerminalTab, setActiveTerminalTab] = useState('stocktake');
  const [scanStatus, setScanStatus] = useState('idle');
  const [jeansStock, setJeansStock] = useState(120);
  const [poStatus, setPoStatus] = useState('idle');
  const [terminalFbrAmount, setTerminalFbrAmount] = useState(25000);
  const [selectedBox, setSelectedBox] = useState('standard');

  const triggerScan = () => {
    setScanStatus('scanning');
    setTimeout(() => {
      setScanStatus('done');
    }, 1500);
  };

  const triggerPO = () => {
    setPoStatus('generating');
    setTimeout(() => {
      setPoStatus('sent');
    }, 1500);
  };

  const runExcelSimulation = () => {
    setIsSimulatingExcel(true);
    setSimulationStatus('processing');

    // Simulate line-by-line smart FBR/SKU validation
    setTimeout(() => {
      setExcelRows(prev => prev.map((row, idx) => {
        if (idx === 2) {
          return { ...row, status: 'failed', error: 'Duplicate SKU detected: TNV-SH-001 is already allocated' };
        }
        return { ...row, status: 'success' };
      }));
      setSimulationStatus('done');
      setIsSimulatingExcel(false);
    }, 2000);
  };

  const resetExcelSimulation = () => {
    setExcelRows([
      { sku: 'TNV-SH-001', name: 'Cotton Crew Neck Shirt', stock: 120, status: 'pending', error: '' },
      { sku: 'TNV-SH-002', name: 'Premium Denim Jeans', stock: 85, status: 'pending', error: '' },
      { sku: 'TNV-SH-001', name: 'Duplicate Cotton Shirt', stock: 50, status: 'pending', error: '' },
      { sku: 'TNV-SH-004', name: 'Linen Casual Blazer', stock: 40, status: 'pending', error: '' },
    ]);
    setSimulationStatus('idle');
  };

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <MarketingLayout transparentNav={true} mainBottomClass={MARKETING_MAIN_BOTTOM_STICKY}>

      {/* STICKY CTA — mobile: 3-col grid (Book | Trial | Close) + generous pr for assistant FAB; sm+: strip layout */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white shadow-[0_-3px_16px_-6px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out ${showStickyCta ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto grid min-w-0 max-w-7xl grid-cols-1 items-center gap-y-2 px-[max(1rem,env(safe-area-inset-left))] py-2 pr-[calc(5rem+env(safe-area-inset-right,0px))] sm:flex sm:flex-row sm:gap-4 sm:py-2.5 sm:pl-8 sm:pr-[calc(8rem+env(safe-area-inset-right,0px))] md:pl-10 lg:px-12 lg:pr-[calc(10rem+env(safe-area-inset-right,0px))]">
          <div className="hidden min-w-0 flex-1 items-center gap-2.5 sm:flex sm:gap-3">
            <div className="shrink-0 translate-y-px">
              <TenvoTextLogo compact iconClassName="border border-neutral-200/90 shadow-sm" />
            </div>
            <div className="min-w-0 border-l border-neutral-200 pl-2.5 sm:pl-3">
              <p className="text-[13px] font-bold leading-tight text-neutral-900">Ready to streamline your operations?</p>
              <p className="text-[11px] font-medium leading-snug text-neutral-500">
                Storefront, POS, inventory, and finance in one workspace.
              </p>
            </div>
          </div>

          <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:w-auto sm:flex-1 sm:justify-end sm:gap-2.5">
            <Button
              asChild
              variant="outline"
              className="h-10 min-w-0 shrink rounded-lg border-neutral-300 px-2 text-[11px] font-bold leading-tight sm:h-9 sm:px-4 sm:text-sm"
            >
              <Link
                href="/demo#demo-form"
                className="block truncate text-center"
                onClick={() => trackHeroCta('sticky_book_demo', '/demo#demo-form')}
              >
                Book Demo
              </Link>
            </Button>
            <Button
              asChild
              className="h-10 min-w-0 shrink rounded-lg bg-brand-primary px-2 text-[10px] font-black uppercase leading-tight tracking-wide text-white hover:bg-brand-primary-dark sm:h-9 sm:max-w-[13rem] sm:px-4 sm:text-xs"
            >
              <Link
                href={workspaceHref}
                className="block truncate text-center"
                onClick={() => trackHeroCta('sticky_workspace', workspaceHref)}
              >
                {user ? 'Workspace' : 'Start free'}
              </Link>
            </Button>
            <button
              type="button"
              onClick={dismissStickyCta}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200/90 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 sm:h-9 sm:w-9"
              aria-label="Close promotion bar"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* VIDEO MODAL */}
      {showVideoModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowVideoModal(false)}>
          <div className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h3 className="font-bold text-neutral-900">Watch TENVO in Action</h3>
              <button onClick={() => setShowVideoModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            <div className="aspect-video bg-neutral-900 flex items-center justify-center">
              <div className="text-center text-white">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Product demo video coming soon</p>
                <p className="text-sm text-neutral-400 mt-2">Experience the full power of TENVO</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 1. HERO: value prop & social proof visuals */}
      <section className="relative overflow-x-clip border-b border-neutral-200/60 bg-brand-50 pb-10 pt-[calc(4.5rem+env(safe-area-inset-top,0px))] lg:pb-16 lg:pt-[calc(5rem+env(safe-area-inset-top,0px))]">
        <div className="relative z-10 mx-auto min-w-0 max-w-7xl px-4 min-[380px]:px-5 sm:px-6 lg:px-12">
          <div className="grid min-w-0 grid-cols-1 items-center gap-8 max-md:gap-5 lg:grid-cols-12 lg:gap-12">

            {/* Left Content Column — desktop: original headline, badge, CTAs; mobile: compact copy + softer CTAs */}
            <div className="col-span-1 min-w-0 max-w-full space-y-5 max-md:space-y-5 sm:space-y-6 lg:col-span-6 lg:max-w-2xl lg:space-y-8">
              <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-neutral-200/90 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary shadow-[0_1px_0_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)] sm:px-4 sm:py-2 sm:text-[11px] sm:tracking-[0.22em] md:tracking-[0.25em]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-inner ring-1 ring-black/5" aria-hidden>
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span className="min-w-0 text-balance leading-snug">Pakistan-Ready Enterprise Operations</span>
              </div>

              <div className="space-y-3.5 max-md:space-y-3 sm:space-y-4">
                <h1 className="text-balance text-4xl font-extrabold tracking-tight text-neutral-900 leading-[1.1] max-md:text-[clamp(1.875rem,5.2vw+0.65rem,2.625rem)] max-md:leading-[1.06] max-md:tracking-[-0.035em] max-md:max-w-[22ch] sm:text-5xl lg:text-6xl xl:text-[4rem]">
                  Run Your Entire Business From One{' '}
                  <span className="text-brand-primary max-md:bg-gradient-to-r max-md:from-brand-primary max-md:to-brand-primary-dark max-md:bg-clip-text max-md:text-transparent">
                    Intelligent Dashboard
                  </span>
                </h1>
                <p className="max-w-xl text-pretty font-medium text-neutral-600 antialiased max-md:text-[0.9375rem] max-md:leading-[1.65] md:text-lg md:leading-relaxed lg:text-xl">
                  <span className="md:hidden">
                    Storefront, POS, inventory, and books in one stack. Stock, orders, and tax stay aligned, without duct-taping spreadsheets and plugins like generic platforms make you do.
                  </span>
                  <span className="hidden md:inline">
                    Run your brand store, checkout floors, warehouses, and books in one place. TENVO keeps stock, orders, and tax aligned - so you are not stitching spreadsheets, plugins, and separate apps the way generic global platforms expect you to.
                  </span>
                </p>
              </div>

              <div className="flex w-full min-w-0 flex-col gap-3 pt-1 md:flex-row md:items-stretch md:gap-4 md:pt-4">
                <Button
                  asChild
                  size="lg"
                  className="hero-cta-primary group relative h-12 min-h-[48px] w-full min-w-0 overflow-hidden rounded-xl border border-black/[0.06] bg-brand-primary px-5 text-[0.9375rem] font-semibold tracking-tight text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_12px_32px_-8px_rgba(227,66,66,0.45)] transition-[transform,box-shadow,background-color] duration-200 hover:bg-brand-primary-dark hover:shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_16px_40px_-8px_rgba(227,66,66,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 active:scale-[0.99] motion-safe:md:hover:-translate-y-px md:h-[3.25rem] md:w-auto md:min-w-[12.5rem] md:px-8 md:text-sm md:font-black md:uppercase md:tracking-[0.14em]"
                >
                  <Link
                    href="/demo#demo-form"
                    className="relative z-[1] inline-flex w-full items-center justify-center gap-2 text-center"
                    onClick={() => trackHeroCta('book_demo', '/demo#demo-form')}
                  >
                    <span className="md:hidden">Book a demo</span>
                    <span className="hidden md:inline">BOOK A DEMO</span>
                    <ArrowRight
                      className="hidden h-4 w-4 shrink-0 opacity-90 transition-transform duration-200 motion-safe:md:group-hover:translate-x-0.5 md:inline"
                      aria-hidden
                    />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="hero-cta-secondary group relative h-12 min-h-[48px] w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-5 text-[0.9375rem] font-semibold tracking-tight text-neutral-900 shadow-[0_1px_0_rgba(255,255,255,1)_inset,0_6px_20px_-8px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-[transform,box-shadow,border-color,color] duration-200 hover:border-neutral-300 hover:bg-neutral-50/90 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/80 focus-visible:ring-offset-2 active:scale-[0.99] motion-safe:md:hover:-translate-y-px md:h-[3.25rem] md:w-auto md:min-w-[12.5rem] md:border-neutral-200 md:px-8 md:text-sm md:font-black md:uppercase md:tracking-[0.12em]"
                >
                  <Link
                    href={workspaceHref}
                    className="inline-flex w-full items-center justify-center gap-2 text-center"
                    onClick={() => trackHeroCta('workspace', workspaceHref)}
                  >
                    <span className="md:hidden">{workspaceCtaMobile}</span>
                    <span className="hidden md:inline">{workspaceCtaDesktop}</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column: mobile = portrait + icon strip; md+ = original fixed-height stage + outer-anchored widgets */}
            <div className="relative col-span-1 mt-8 min-w-0 w-full max-w-full lg:col-span-6 lg:mt-0">
              <div className="flex min-h-0 flex-col items-center justify-start overflow-x-clip md:hidden">
                <div className="relative z-10 mx-auto w-full max-w-[min(20rem,calc(100vw-2rem))] sm:max-w-[min(24rem,calc(100vw-2.5rem))]">
                  <div className="relative w-full max-md:aspect-auto">
                    <Image
                      src="/zeeshan-keerio.png"
                      alt="Zeeshan Keerio, Founder, CEO, and Lead AI Engineer behind TENVO"
                      width={450}
                      height={562}
                      priority
                      className="h-auto w-full max-md:max-h-[min(32rem,78svh)] object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.15)]"
                      sizes="(max-width: 640px) min(320px, 100vw), (max-width: 1024px) 400px, 450px"
                    />
                  </div>
                </div>
                <nav
                  className="mt-1.5 flex w-full max-w-[min(20rem,calc(100vw-2rem))] flex-wrap items-center justify-center gap-2 px-1 sm:max-w-[min(24rem,calc(100vw-2.5rem))]"
                  aria-label="Sample in-app highlights"
                >
                  {HERO_MOBILE_LIVE_OPS.map(({ key, label, Icon, iconClass, iconBg }) => (
                    <button
                      key={key}
                      type="button"
                      title={label}
                      aria-label={label}
                      className="flex h-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-2xl border border-neutral-200/90 bg-white/95 shadow-sm ring-1 ring-black/[0.04] transition active:scale-[0.98]"
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
                        <Icon className={`h-[18px] w-[18px] shrink-0 ${iconClass}`} aria-hidden />
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="relative mt-12 hidden h-[450px] w-full items-end justify-center sm:h-[550px] md:flex lg:mt-0 lg:h-[600px]">
                <div className="pointer-events-none absolute inset-0 z-0">
                  <div className="absolute bottom-[12%] right-[5%] h-[240px] w-[180px] rotate-3 rounded-lg border border-[#DCBBA9] bg-[#EED4C5] shadow-sm" />
                  <div className="absolute bottom-[8%] left-[8%] h-[210px] w-[190px] -rotate-6 rounded-lg border border-[#D5B3A1] bg-[#E7C7B5] shadow-sm" />
                  <div className="absolute bottom-[20%] left-[30%] h-[160px] w-[160px] rotate-12 rounded-lg border border-[#CBAAA0] bg-[#DEC0AE] shadow-sm" />
                  <div className="absolute bottom-[35%] right-[22%] h-[150px] w-[150px] -rotate-12 rounded-lg border border-[#D1AD9B] bg-[#E5C3B0] shadow-sm" />
                </div>

                <div className="relative bottom-0 z-10 flex aspect-[4/5] w-[400px] max-w-full shrink-0 items-end overflow-visible sm:w-[450px]">
                  <Image
                    src="/zeeshan-keerio.png"
                    alt="Zeeshan Keerio, Founder, CEO, and Lead AI Engineer behind TENVO"
                    width={450}
                    height={562}
                    priority
                    className="h-auto w-full max-w-[450px] object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.15)]"
                    style={{ width: 'auto', height: 'auto' }}
                    sizes="(max-width: 1024px) 400px, 450px"
                  />
                </div>

                <div className="pointer-events-none absolute inset-0 z-20">
                  <div className="pointer-events-auto absolute left-[-2%] top-[2%] z-20 w-[220px] transform rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1">
                    <div className="mb-2 flex items-start justify-between border-b border-neutral-100 pb-2">
                      <div>
                        <h5 className="text-[11px] font-extrabold text-neutral-900">Sales Order</h5>
                        <p className="text-[9px] font-bold text-neutral-400">SO-00208</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-[8px] font-black uppercase text-green-700">
                        <Check className="h-2 w-2 shrink-0" aria-hidden /> GST applied
                      </span>
                    </div>
                    <div className="mb-1 grid grid-cols-4 border-b border-neutral-50 pb-1 text-[8px] font-black uppercase text-neutral-400">
                      <span>Item</span>
                      <span className="text-center">Qty</span>
                      <span className="text-center">Tax</span>
                      <span className="text-right">Amt</span>
                    </div>
                    <div className="grid grid-cols-4 items-center text-[9px] font-bold text-neutral-700">
                      <span className="truncate font-black">Cotton Shirt</span>
                      <span className="text-center">8</span>
                      <span className="text-center font-extrabold text-green-600">GST 18%</span>
                      <span className="text-right text-brand-primary">PKR 76k</span>
                    </div>
                    <div className="mt-2 flex justify-between border-t border-neutral-100 pt-2 text-[10px] font-black">
                      <span className="text-neutral-500">Auto-Reconciled</span>
                      <span className="flex items-center gap-0.5 text-green-600">
                        <CheckCircle2 className="h-3 w-3 shrink-0" aria-hidden /> Ready
                      </span>
                    </div>
                  </div>

                  <div className="pointer-events-auto absolute right-[-2%] top-[6%] z-20 w-[160px] transform rounded-2xl border border-neutral-200/80 bg-white p-4 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1">
                    <h5 className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Omnichannel Sync</h5>
                    <div className="relative mx-auto mb-2 flex h-16 w-16 items-center justify-center">
                      <div className="absolute inset-0 animate-spin rounded-full border-4 border-dashed border-brand-primary/40 duration-10000" />
                      <div className="absolute inset-2 rounded-full border-4 border-solid border-neutral-100" />
                      <div className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-[10px] font-black text-white shadow-sm">
                        T
                      </div>
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#10B981] text-[7px] font-black text-white shadow-sm">
                        S
                      </span>
                      <span className="absolute -bottom-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#8B5CF6] text-[7px] font-black text-white shadow-sm">
                        D
                      </span>
                    </div>
                    <p className="text-xs font-black text-neutral-800">PKR 142.5k Sales</p>
                    <p className="mt-0.5 flex items-center justify-center gap-0.5 text-[8px] font-black uppercase tracking-wider text-[#10B981]">
                      <Sparkles className="h-2.5 w-2.5 shrink-0" aria-hidden /> 100% Synced
                    </p>
                  </div>

                  <div className="pointer-events-auto absolute bottom-[32%] left-[-6%] z-20 flex w-[170px] transform items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-md transition-all duration-300 hover:-translate-y-1">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
                      <Cpu className="h-5 w-5 shrink-0" aria-hidden />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-black text-neutral-900">AI AUTO-REORDER</p>
                      <p className="text-[9px] font-black uppercase tracking-wider text-[#c49c3b]">Triggered (2 Days Lead)</p>
                    </div>
                  </div>

                  <div className="pointer-events-auto absolute bottom-[34%] right-[-4%] z-20 flex w-[170px] transform items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-md transition-all duration-300 hover:-translate-y-1">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Truck className="h-5 w-5 shrink-0" aria-hidden />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-black text-neutral-900">TCS DISPATCHED</p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-blue-500">AWB #72918231</p>
                    </div>
                  </div>

                  <div className="pointer-events-auto absolute bottom-[14%] right-[2%] z-20 flex w-[180px] transform items-center gap-3 rounded-xl border border-neutral-200/80 bg-white p-3 shadow-md transition-all duration-300 hover:-translate-y-1">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                      <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-black text-neutral-900">AGENTIC AUDIT OK</p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-green-600">0 anomalies detected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2.5 CUSTOMER LOGO CAROUSEL - Social Proof Marquee */}
      <section className="bg-white border-b border-neutral-200/80 py-12 lg:py-16 overflow-hidden">
        <div className={MARKETING_CONTAINER}>
          <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-neutral-400 mb-8">
            Trusted by 450+ Businesses Across Pakistan
          </p>
          
          {/* Animated Logo Marquee */}
          <div className="relative">
            <div className="flex animate-marquee whitespace-nowrap">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex items-center gap-12 mx-6">
                  {['Al-Karam Textiles', 'Servis Shoes', 'Khaadi', 'Gul Ahmed', 'Nishat Linen', 'ChenOne', 'Sana Safinaz', 'Junaid Jamshed', 'Outfitters', 'MTJ', 'Edenrobe', 'Sapphire', 'Bonanza', 'Almirah', 'Beechtree'].map((brand, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-6 py-3 bg-neutral-50 border border-neutral-200/60 rounded-xl hover:border-brand-primary/40 hover:bg-brand-50/50 transition-all duration-300 cursor-default group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center text-brand-primary font-black text-sm group-hover:from-brand-primary group-hover:to-brand-primary-dark group-hover:text-white transition-all duration-300">
                        {brand.charAt(0)}
                      </div>
                      <span className="font-bold text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors">{brand}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2.6 VIDEO SECTION - Product Demo */}
      <section className="bg-neutral-50 border-b border-neutral-200/80 py-10 sm:py-16 lg:py-28">
        <div className={MARKETING_CONTAINER}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Video Thumbnail */}
            <div className="relative group cursor-pointer" onClick={() => setShowVideoModal(true)}>
              <div className="aspect-video bg-neutral-200 rounded-3xl overflow-hidden relative">
                <Image
                  src="/tenvo-advaced-dashboard.png"
                  alt="TENVO Dashboard Preview"
                  fill
                  className="object-cover"
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-brand-primary ml-1" fill="currentColor" />
                  </div>
                </div>
              </div>
              {/* Floating Stats */}
              <div className="absolute -bottom-4 -right-4 bg-white border border-neutral-200 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center">
                    <Star className="w-5 h-5 text-brand-primary" fill="currentColor" />
                  </div>
                  <div>
                    <p className="font-black text-neutral-900">4.9/5</p>
                    <p className="text-xs text-neutral-500 font-semibold">User Rating</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-brand-primary">
                <Play className="h-4 w-4" />
                Watch Demo
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
                See how businesses save 12+ hours every week.
              </h3>
              <p className="text-base text-neutral-600 font-medium leading-relaxed">
                Watch a 2-minute walkthrough of how TENVO transforms chaotic spreadsheets into streamlined operations. From Excel import to GST-aware invoicing, see it in action.
              </p>
              <ul className="space-y-3">
                {[
                  'Zero-downtime migration from Excel',
                  'Real-time multi-warehouse sync',
                  'GST / sales tax calculations on invoices',
                  'AI-powered restock alerts'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm font-semibold text-neutral-700">
                    <div className="h-5 w-5 rounded-full bg-brand-50 flex items-center justify-center text-brand-primary">
                      <Check className="w-3 h-3" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <Button onClick={() => setShowVideoModal(true)} className="bg-brand-primary hover:bg-brand-primary-dark text-white font-black rounded-xl h-12 px-6 uppercase tracking-wider">
                  <Play className="w-4 h-4 mr-2" fill="currentColor" /> Watch Full Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CommerceAndIntelligenceSection />

      <CompetitorComparisonSection />

      {/* 3. INTERACTIVE MODULE HUB (ZOHO INVENTORY CORE CLONE) */}
      <section className="bg-white py-10 sm:py-16 lg:py-28 border-b border-neutral-200/80">
        <div className={MARKETING_CONTAINER}>
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-[11px] font-black text-brand-primary uppercase tracking-[0.25em]">Your Complete Toolkit</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">
              One dashboard. Complete control.
            </h3>
            <p className="text-lg text-neutral-500 font-medium">
              Everything you need to easily manage your stock, handle sales, and stay compliant with local tax laws, all in one place.
            </p>
          </div>

          {/* Interactive Hub Tabs */}
          <div className="grid lg:grid-cols-12 gap-8 items-start">

            {/* Left Hand side Tab List */}
            <div className="lg:col-span-4 space-y-3">
              <button
                onClick={() => setActiveFeatureTab('inventory')}
                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${activeFeatureTab === 'inventory'
                  ? 'bg-neutral-50 border-brand-primary shadow-sm'
                  : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                  }`}
              >
                <div className={`p-3 rounded-xl ${activeFeatureTab === 'inventory' ? 'bg-brand-primary text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-neutral-900">Easy Inventory Tracking</h4>
                  <p className="text-xs text-neutral-500 mt-1 font-semibold">Track your items, expiration dates, and custom bundles.</p>
                </div>
              </button>

              <button
                onClick={() => setActiveFeatureTab('warehouse')}
                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${activeFeatureTab === 'warehouse'
                  ? 'bg-neutral-50 border-brand-primary shadow-sm'
                  : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                  }`}
              >
                <div className={`p-3 rounded-xl ${activeFeatureTab === 'warehouse' ? 'bg-brand-primary text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-neutral-900">Manage Multiple Locations</h4>
                  <p className="text-xs text-neutral-500 mt-1 font-semibold">Keep tabs on stock across different shops or warehouses.</p>
                </div>
              </button>

              <button
                onClick={() => setActiveFeatureTab('selling')}
                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${activeFeatureTab === 'selling'
                  ? 'bg-neutral-50 border-brand-primary shadow-sm'
                  : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                  }`}
              >
                <div className={`p-3 rounded-xl ${activeFeatureTab === 'selling' ? 'bg-brand-primary text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-neutral-900">Sell Everywhere Instantly</h4>
                  <p className="text-xs text-neutral-500 mt-1 font-semibold">Connect with Daraz, Shopify, and Amazon in a few clicks.</p>
                </div>
              </button>

              <button
                onClick={() => setActiveFeatureTab('fulfillment')}
                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${activeFeatureTab === 'fulfillment'
                  ? 'bg-neutral-50 border-brand-primary shadow-sm'
                  : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                  }`}
              >
                <div className={`p-3 rounded-xl ${activeFeatureTab === 'fulfillment' ? 'bg-brand-primary text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  <Workflow className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-neutral-900">Simple Shipping & Orders</h4>
                  <p className="text-xs text-neutral-500 mt-1 font-semibold">Handle sales orders, packing, and courier delivery tracking.</p>
                </div>
              </button>

              <button
                onClick={() => setActiveFeatureTab('accounting')}
                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${activeFeatureTab === 'accounting'
                  ? 'bg-neutral-50 border-brand-primary shadow-sm'
                  : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                  }`}
              >
                <div className={`p-3 rounded-xl ${activeFeatureTab === 'accounting' ? 'bg-brand-primary text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-neutral-900">Accounting & Tax Filing</h4>
                  <p className="text-xs text-neutral-500 mt-1 font-semibold">Generate invoices with configured GST and export-friendly tax summaries.</p>
                </div>
              </button>
            </div>

            {/* Right Hand side Feature Visual Container */}
            <div className="lg:col-span-8 bg-neutral-50 border border-neutral-200/80 rounded-[2rem] p-6 lg:p-8 min-h-[460px] flex flex-col justify-between">

              {/* Feature Tab Description */}
              {activeFeatureTab === 'inventory' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xs font-black text-brand-primary uppercase tracking-widest">
                    <Check className="w-4 h-4" /> Clear Item Tracking
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black text-neutral-900">
                    Never lose track of a single item again.
                  </h3>
                  <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                    Organize your products by size, color, or material. You can automatically track expiration dates and serial numbers so you always know exactly what is on your shelves and when it needs to be sold.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-neutral-800">Create Custom Bundles</p>
                        <p className="text-xs text-neutral-500">Easily combine multiple items into special gift packages or sets.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-neutral-800">Smart Pricing Updates</p>
                        <p className="text-xs text-neutral-500">Automatically adjust your selling prices when your supplier costs change.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeatureTab === 'warehouse' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xs font-black text-brand-primary uppercase tracking-widest">
                    <Check className="w-4 h-4" /> Multi-location Warehouse Control
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black text-neutral-900">
                    Control stock across Karachi, Lahore, & Islamabad.
                  </h3>
                  <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                    Monitor precise quantity allocations across unlimited storage yards and retail locations. Initiate inter-warehouse transfer orders complete with approval workflows, audit trails, transit times, and bin-location mapping.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-neutral-800">Transfer Approval Workflows</p>
                        <p className="text-xs text-neutral-500">Require supervisor sign-off before inventory leaves any hub.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-neutral-800">Bin-Level Precision</p>
                        <p className="text-xs text-neutral-500">Guide workers to the exact aisle and shelf in seconds.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeatureTab === 'selling' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xs font-black text-brand-primary uppercase tracking-widest">
                    <Check className="w-4 h-4" /> Real-time Multichannel Sync
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black text-neutral-900">
                    Never suffer another overselling penalty.
                  </h3>
                  <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                    Integrate directly with Shopify, WooCommerce, Daraz, and international marketplaces. When a product sells on Shopify, TENVO automatically decreases stock counts in your warehouse and updates Daraz within milliseconds.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-neutral-800">Daraz API Integration</p>
                        <p className="text-xs text-neutral-500">Fully compliant local marketplace sync out of the box.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-neutral-800">Centralized Catalog</p>
                        <p className="text-xs text-neutral-500">Push product details and pricing globally from one single page.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeatureTab === 'fulfillment' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xs font-black text-brand-primary uppercase tracking-widest">
                    <Check className="w-4 h-4" /> Sales Orders & Rapid Dispatch
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black text-neutral-900">
                    Automate TCS, Leopards, and carrier logistics.
                  </h3>
                  <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                    Convert customer orders into package slips and shipping invoices in one click. Integrate with local logistics partners to fetch real-time shipping costs, print custom shipping labels, and send automatic tracking numbers to customers.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-neutral-800">Drop-Shipping & Backorders</p>
                        <p className="text-xs text-neutral-500">Route sales orders directly to suppliers when stock is depleted.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-neutral-800">TCS Tracker Integration</p>
                        <p className="text-xs text-neutral-500">Track package delivery progress natively within TENVO.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeFeatureTab === 'accounting' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-xs font-black text-brand-primary uppercase tracking-widest">
                    <Check className="w-4 h-4" /> Pakistan Localized Tax Accounting
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-black text-neutral-900">
                    Audit-ready ledgers & GST-aware invoicing.
                  </h3>
                  <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                    Say goodbye to disconnected billing. Generate sales invoices, track customer aging balances, record payments received, and manage double-entry accounting files automatically. Complete with integrated GST/tax calculators tuned for Pakistani filings.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-neutral-800">Tax configuration safeguards</p>
                        <p className="text-xs text-neutral-500">Sales tax rules, audit logs, and export-oriented summaries for Pakistan.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-neutral-800">Customer Ledgers</p>
                        <p className="text-xs text-neutral-500">Track invoices, credit notes, and outstanding balances effortlessly.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual Terminal/Dashboard Representation inside the Light Theme Container */}
              <div className="mt-8 bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-400" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span className="h-3 w-3 rounded-full bg-green-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 ml-2">Console Live View</span>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400">organization-id: tenvo-001</span>
                </div>

                {activeFeatureTab === 'inventory' && (
                  <div className="space-y-2.5 font-mono text-xs text-neutral-700">
                    <div className="flex justify-between border-b border-neutral-50 pb-1">
                      <span>PRODUCT: Crew Neck Cotton Shirt</span>
                      <span className="text-brand-primary font-bold">VARIANT: M / BLACK</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-50 pb-1">
                      <span>BATCH NUMBER: BTC-2026-05A</span>
                      <span className="text-emerald-600 font-bold">EXPIRY: 2028-05-18</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SERIAL: SN-9031248011</span>
                      <span className="text-neutral-500">STATUS: Warehouse Inward</span>
                    </div>
                  </div>
                )}

                {activeFeatureTab === 'warehouse' && (
                  <div className="space-y-2.5 font-mono text-xs text-neutral-700">
                    <div className="flex justify-between border-b border-neutral-50 pb-1">
                      <span>FROM: Karachi Port Terminal Yard</span>
                      <span className="text-amber-600 font-bold">STATUS: In Transit</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-50 pb-1">
                      <span>TO: Gulberg Central Lahore Hub</span>
                      <span className="text-neutral-500">ETA: 14 Hours (TCS Freight)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>ITEMS IN TRANSIT: 450 Units</span>
                      <span className="text-brand-primary font-bold">VALUATION: PKR 810,000</span>
                    </div>
                  </div>
                )}

                {activeFeatureTab === 'selling' && (
                  <div className="space-y-2.5 font-mono text-xs text-neutral-700">
                    <div className="flex justify-between border-b border-neutral-50 pb-1">
                      <span>SHOPIFY ORDER #1902</span>
                      <span className="text-emerald-600 font-bold">SYNC SUCCESS (-1 qty)</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-50 pb-1">
                      <span>DARAZ SKU STOCKS UPDATED</span>
                      <span className="text-brand-primary font-bold">ALL PLATFORMS: 119 Units Left</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SYNC LATENCY</span>
                      <span className="text-neutral-400">12ms (Zero Drift)</span>
                    </div>
                  </div>
                )}

                {activeFeatureTab === 'fulfillment' && (
                  <div className="space-y-2.5 font-mono text-xs text-neutral-700">
                    <div className="flex justify-between border-b border-neutral-50 pb-1">
                      <span>PACKING SLIP GENERATED</span>
                      <span className="text-neutral-500">ORDER: TNV-SO-8802</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-50 pb-1">
                      <span>CARRIER: TCS Cash On Delivery</span>
                      <span className="text-brand-primary font-bold">TRACKING ID: 7731298402</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SHIPPING LABEL STATUS</span>
                      <span className="text-emerald-600 font-bold">Printed & Dispatched</span>
                    </div>
                  </div>
                )}

                {activeFeatureTab === 'accounting' && (
                  <div className="space-y-2.5 font-mono text-xs text-neutral-700">
                    <div className="flex justify-between border-b border-neutral-50 pb-1">
                      <span>GST INVOICE PREVIEW</span>
                      <span className="text-brand-primary font-bold">UUID: 2026-TX-10023</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-50 pb-1">
                      <span>NET AMOUNT: PKR 124,500</span>
                      <span className="text-amber-600 font-bold">GST (18%): PKR 22,410</span>
                    </div>
                    <div className="flex justify-between">
                      <span>LEDGER SYNC RECORD</span>
                      <span className="text-emerald-600 font-bold">Balance Sheet Corrected</span>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. EXCEL-FIRST & SPREADSHEET POWER SIMULATOR */}
      <section className="bg-neutral-50 border-b border-neutral-200/80 py-10 sm:py-16 lg:py-28">
        <div className={MARKETING_CONTAINER}>

          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">

            {/* Left Content column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-amber-800">
                <FileSpreadsheet className="h-4 w-4" />
                Excel-First Capability
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
                No more manual data-entry agony.
              </h3>
              <p className="text-base text-neutral-600 font-medium leading-relaxed">
                Most platforms break when you upload an Excel sheet. TENVO has a native, full-screen **Excel Mode** that lets you copy-paste rows directly from your existing spreadsheets, perform bulk operations, and validates every single cell with crystal clear feedback.
              </p>

              <ul className="space-y-3 font-semibold text-neutral-700">
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Direct Excel (.xlsx) file drag-and-drop</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Real-time cell error reporting (Row & Column)</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>100% round-trip validation guarantee</span>
                </li>
              </ul>

              <div className="flex flex-wrap items-center gap-2 pt-4">
                <Button onClick={runExcelSimulation} disabled={simulationStatus === 'processing'} className="h-11 rounded-xl bg-brand-primary px-5 font-black uppercase tracking-wider text-white hover:bg-brand-primary-dark sm:h-12 sm:rounded-2xl sm:px-6">
                  {simulationStatus === 'processing' ? 'Validating Sheet...' : 'Simulate Excel Upload'}
                </Button>
                {simulationStatus !== 'idle' && (
                  <Button onClick={resetExcelSimulation} variant="ghost" className="ml-0 font-bold text-neutral-500 sm:ml-2">
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Right Simulator column */}
            <div className="min-w-0 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm sm:p-6 lg:col-span-7 lg:rounded-[2.5rem]">
              <div className="mb-4 flex flex-col gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h4 className="text-base font-black text-neutral-900 sm:text-lg">Spreadsheet Import Preview</h4>
                  <p className="mt-0.5 text-[11px] font-semibold text-neutral-500 sm:text-xs">Validating 4 lines of imported products</p>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                  <span className={`h-2.5 w-2.5 rounded-full ${simulationStatus === 'idle' ? 'bg-neutral-300' :
                    simulationStatus === 'processing' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'
                    }`} />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 sm:text-xs">
                    {simulationStatus === 'idle' ? 'Ready to parse' :
                      simulationStatus === 'processing' ? 'Validating FBR & SKU' : 'Partial Import Available'}
                  </span>
                </div>
              </div>

              {/* Mobile: card list */}
              <div className="space-y-2.5 lg:hidden">
                {excelRows.map((row, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border p-3 ${
                      row.status === 'failed'
                        ? 'border-red-200 bg-red-50/40'
                        : row.status === 'success'
                          ? 'border-emerald-200/80 bg-emerald-50/30'
                          : 'border-neutral-100 bg-neutral-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-neutral-900">{row.sku}</span>
                      {row.status === 'pending' && (
                        <span className="shrink-0 rounded bg-neutral-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Pending</span>
                      )}
                      {row.status === 'success' && (
                        <span className="shrink-0 rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">Ready</span>
                      )}
                      {row.status === 'failed' && (
                        <span className="shrink-0 rounded bg-red-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-red-700">Error</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm font-medium leading-snug text-neutral-800">{row.name}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-semibold uppercase tracking-wide text-neutral-400">Initial stock</span>
                      <span className="font-bold tabular-nums text-neutral-900">{row.stock}</span>
                    </div>
                    {row.error ? (
                      <p className="mt-2 text-[10px] font-semibold leading-relaxed text-red-700">{row.error}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-0 border-collapse text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                      <th className="p-3">SKU Code</th>
                      <th className="p-3">Item Name</th>
                      <th className="p-3">Initial Stock</th>
                      <th className="p-3">Import Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-neutral-100 text-xs font-medium text-neutral-800 hover:bg-neutral-50">
                        <td className="p-3 font-mono font-bold">{row.sku}</td>
                        <td className="p-3">{row.name}</td>
                        <td className="p-3 font-bold">{row.stock}</td>
                        <td className="p-3">
                          {row.status === 'pending' && (
                            <span className="rounded bg-neutral-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Pending</span>
                          )}
                          {row.status === 'success' && (
                            <span className="rounded bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">Ready</span>
                          )}
                          {row.status === 'failed' && (
                            <span className="rounded bg-red-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-red-700">Error</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Error Box representation if validation finished */}
              {simulationStatus === 'done' && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 sm:rounded-2xl sm:p-4">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
                  <div className="min-w-0">
                    <h5 className="text-sm font-bold text-red-900">SKU Duplication Error found (Row 3)</h5>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-red-700">
                      TENVO caught a critical SKU collision. Traditional ERPs would fail the whole import. TENVO allows you to **import only the 3 valid rows** and provides a fixed Excel sheet with highlighted columns to resolve.
                    </p>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* 5. INTERACTIVE MARGIN-FIRST PRICING CALCULATOR */}
      <section className="bg-white border-b border-neutral-200/80 py-10 sm:py-16 lg:py-28">
        <div className={MARKETING_CONTAINER}>

          <div className="grid lg:grid-cols-12 gap-12 items-center">

            {/* Right Interactive Simulator Column (rendered on left in visual desktop flow for variety) */}
            <div className="lg:col-span-6 bg-neutral-50 border border-neutral-200/80 rounded-[2.5rem] p-6 lg:p-10 order-2 lg:order-1">
              <h4 className="font-black text-neutral-900 text-xl mb-6">Interactive Margin-First Engine</h4>

              <div className="space-y-6">

                {/* Cost Input */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-black uppercase tracking-wider text-neutral-500">Unit Cost (PKR)</label>
                    <span className="text-xs font-mono font-bold text-neutral-800">PKR {calcCost.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="50"
                    value={calcCost}
                    onChange={(e) => setCalcCost(Number(e.target.value))}
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-neutral-400 mt-1">
                    <span>PKR 100</span>
                    <span>PKR 10,000</span>
                  </div>
                </div>

                {/* Margin % Input */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-black uppercase tracking-wider text-neutral-500">Target Profit Margin (%)</label>
                    <span className="text-xs font-mono font-bold text-neutral-800">{calcMargin}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="1"
                    value={calcMargin}
                    onChange={(e) => setCalcMargin(Number(e.target.value))}
                    className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-neutral-400 mt-1">
                    <span>5%</span>
                    <span>80%</span>
                  </div>
                </div>

                {/* FBR Tax Rate Input */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-black uppercase tracking-wider text-neutral-500">FBR Sales Tax GST (%)</label>
                    <span className="text-xs font-mono font-bold text-neutral-800">{calcTaxRate}%</span>
                  </div>
                  <select
                    value={calcTaxRate}
                    onChange={(e) => setCalcTaxRate(Number(e.target.value))}
                    className="w-full h-11 px-4 border border-neutral-200 bg-white rounded-xl text-sm font-bold text-neutral-800"
                  >
                    <option value={0}>0% (Tax Exempt / Exports)</option>
                    <option value={15}>15% (Local Sales Tax)</option>
                    <option value={18}>18% (Standard FBR GST)</option>
                  </select>
                </div>

                {/* Calculation Summary Results Card */}
                <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex justify-between text-xs font-semibold text-neutral-500 border-b border-neutral-100 pb-2">
                    <span>Target Profit Margin</span>
                    <span className="font-bold text-neutral-800">PKR {marginAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-neutral-500 border-b border-neutral-100 pb-2">
                    <span>FBR Standard GST Tax</span>
                    <span className="font-bold text-neutral-800">PKR {taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-black text-neutral-900 pt-1">
                    <span>Final Retail Price</span>
                    <span className="text-xl text-brand-primary">PKR {finalSellingPrice.toLocaleString()}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-brand-primary">
                <Receipt className="h-4 w-4" />
                Margin-First Strategy
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
                Margin-first pricing protects your bottom line.
              </h3>
              <p className="text-base text-neutral-600 font-medium leading-relaxed">
                With inflation and supply chain volatility, inventory cost shifts happen daily in Pakistan. TENVO handles this elegantly. Rather than setting static prices that drift into loss, you define your target profit margin per product category. When vendor cost rises, TENVO recalculates optimal selling prices automatically.
              </p>

              <ul className="space-y-3 font-semibold text-neutral-700">
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-brand-50 flex items-center justify-center text-brand-primary">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Automatic price adjustment based on live product costs</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-brand-50 flex items-center justify-center text-brand-primary">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Built-in local FBR sales tax (GST) calculations</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-brand-50 flex items-center justify-center text-brand-primary">
                    <Check className="w-4 h-4" />
                  </div>
                  <span>Real-time margin safety reports on owner dashboards</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 5.5 LIVE WAREHOUSE OPERATIONAL SIMULATOR (NEW ADVANCED FEATURE) */}
      <section className="bg-white border-b border-neutral-200/80 py-10 sm:py-16 lg:py-28">
        <div className={MARKETING_CONTAINER}>

          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-neutral-800">
              <Cpu className="h-4 w-4" /> Live Operational Terminal
            </div>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">
              Test drive the TENVO operating system.
            </h3>
            <p className="text-lg text-neutral-500 font-medium">
              We built an advanced operations engine. Interact with the demo terminal below to see Excel import, replenishment drafts, and GST invoice previews.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-stretch">

            {/* Left Controls column */}
            <div className="lg:col-span-4 space-y-3 flex flex-col justify-center">

              <button
                onClick={() => setActiveTerminalTab('stocktake')}
                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${activeTerminalTab === 'stocktake'
                  ? 'bg-neutral-50 border-brand-primary shadow-sm'
                  : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                  }`}
              >
                <div className={`p-3 rounded-xl ${activeTerminalTab === 'stocktake' ? 'bg-brand-primary text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-neutral-900">1. Scan & Reconcile</h4>
                  <p className="text-xs text-neutral-500 mt-1 font-semibold">Simulate stock count audits and damaged inventory adjustments.</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTerminalTab('reorder')}
                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${activeTerminalTab === 'reorder'
                  ? 'bg-neutral-50 border-brand-primary shadow-sm'
                  : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                  }`}
              >
                <div className={`p-3 rounded-xl ${activeTerminalTab === 'reorder' ? 'bg-brand-primary text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-neutral-900">2. Low Stock &rarr; Auto PO</h4>
                  <p className="text-xs text-neutral-500 mt-1 font-semibold">Watch the system draft supplier purchase orders when inventory falls low.</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTerminalTab('fbr')}
                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${activeTerminalTab === 'fbr'
                  ? 'bg-neutral-50 border-brand-primary shadow-sm'
                  : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                  }`}
              >
                <div className={`p-3 rounded-xl ${activeTerminalTab === 'fbr' ? 'bg-brand-primary text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-neutral-900">3. GST invoice preview</h4>
                  <p className="text-xs text-neutral-500 mt-1 font-semibold">Receipt-style preview with standard 18% GST math on live invoices.</p>
                </div>
              </button>

              <button
                onClick={() => setActiveTerminalTab('packaging')}
                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-start gap-4 ${activeTerminalTab === 'packaging'
                  ? 'bg-neutral-50 border-brand-primary shadow-sm'
                  : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                  }`}
              >
                <div className={`p-3 rounded-xl ${activeTerminalTab === 'packaging' ? 'bg-brand-primary text-white' : 'bg-neutral-100 text-neutral-600'}`}>
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-base text-neutral-900">4. Intelligent Packaging</h4>
                  <p className="text-xs text-neutral-500 mt-1 font-semibold">Auto-calculate box size limits and print carrier labels (TCS/Leopards).</p>
                </div>
              </button>

            </div>

            {/* Right Interactive Console display */}
            <div className="lg:col-span-8 bg-neutral-50 border border-neutral-200/80 rounded-[2.5rem] p-6 lg:p-10 flex flex-col justify-between shadow-sm min-h-[460px]">

              {/* TERMINAL CONTENT FOR TAB 1: STOCKTAKE SCAN */}
              {activeTerminalTab === 'stocktake' && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-xs font-black text-brand-primary uppercase tracking-widest block">Barcode Stocktake Audit</span>
                    <h4 className="font-black text-2xl text-neutral-900">Prevent shrinkage with rapid reconciliation.</h4>
                    <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                      Manual audits are prone to errors. With TENVO, click scan to simulate shelf audit:
                    </p>
                  </div>

                  {/* Stocktake Terminal Box */}
                  <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm my-4">
                    <div className="flex justify-between items-center text-xs font-mono font-bold text-neutral-500 border-b border-neutral-100 pb-2">
                      <span>SKU: TNV-SH-001 (Cotton Crew Neck)</span>
                      <span className="text-brand-primary">Gulberg Lahore Warehouse</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                        <span className="text-[10px] font-black uppercase text-neutral-400">System Expected</span>
                        <p className="text-2xl font-black text-neutral-800">150 Units</p>
                      </div>
                      <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl">
                        <span className="text-[10px] font-black uppercase text-neutral-400">Physical Scanned</span>
                        <p className="text-2xl font-black text-neutral-800">
                          {scanStatus === 'done' ? '148 Units' : '---'}
                        </p>
                      </div>
                    </div>

                    {/* Laser scanning visual simulation */}
                    {scanStatus === 'scanning' && (
                      <div className="h-10 border border-amber-300 bg-amber-50 rounded-xl flex items-center justify-center relative overflow-hidden animate-pulse">
                        <div className="absolute inset-y-0 left-0 w-2 bg-amber-400 animate-[ping_1.5s_infinite]" />
                        <span className="text-xs font-mono font-bold text-amber-800 uppercase tracking-widest animate-pulse">Scanning barcode SN-903124...</span>
                      </div>
                    )}

                    {scanStatus === 'done' && (
                      <div className="p-4 border border-red-200 bg-red-50 rounded-xl space-y-2">
                        <div className="flex items-center gap-2 text-xs font-black text-red-900 uppercase">
                          <Info className="w-4 h-4 text-red-700" /> Stock Discrepancy Found (-2 units)
                        </div>
                        <p className="text-xs text-red-700 leading-relaxed font-semibold">
                          System automatically logged the -2 units as **Damaged Inventory**. Balance sheet written off (PKR -2,400) and inventory corrected to 148 units instantly. No manual ledger entry required!
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      {scanStatus !== 'idle' && (
                        <Button onClick={() => setScanStatus('idle')} variant="ghost" size="sm" className="font-bold text-neutral-500">
                          Reset
                        </Button>
                      )}
                      <Button
                        onClick={triggerScan}
                        disabled={scanStatus === 'scanning'}
                        size="sm"
                        className="bg-brand-primary hover:bg-brand-primary-dark text-white font-black text-xs uppercase tracking-wider rounded-xl h-10 px-4"
                      >
                        {scanStatus === 'idle' ? 'Trigger Barcode Scan' :
                          scanStatus === 'scanning' ? 'Verifying...' : 'Scan Complete'}
                      </Button>
                    </div>

                  </div>
                </div>
              )}

              {/* TERMINAL CONTENT FOR TAB 2: REORDER & AUTO-PO */}
              {activeTerminalTab === 'reorder' && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-xs font-black text-brand-primary uppercase tracking-widest block">Automated Purchase Orders</span>
                    <h4 className="font-black text-2xl text-neutral-900">Eradicate stockouts before they occur.</h4>
                    <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                      Define low-stock thresholds per category. Slide current stock below the safety threshold (100 units) to watch the system flag warnings and auto-generate replenishment drafts:
                    </p>
                  </div>

                  {/* Auto-PO Terminal Box */}
                  <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm my-4">

                    {/* Interactive Slider */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-black text-neutral-500 uppercase tracking-wider">Premium Denim Jeans Stock</span>
                        <span className="text-xs font-bold text-neutral-800">{jeansStock} Units</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="200"
                        step="5"
                        value={jeansStock}
                        onChange={(e) => setJeansStock(Number(e.target.value))}
                        className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                      />
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400 mt-1">
                        <span>20 units</span>
                        <span className="text-brand-primary font-black">Safety Limit: 100 units</span>
                        <span>200 units</span>
                      </div>
                    </div>

                    {/* Flashing Warning Badge */}
                    {jeansStock < 100 ? (
                      <div className="p-3 border border-orange-200 bg-orange-50 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
                          <span className="text-xs font-black text-orange-950 uppercase tracking-wider">⚠️ Low Stock Detected ({jeansStock} / 100)</span>
                        </div>
                        <span className="text-[10px] font-black text-orange-800 uppercase bg-orange-100 px-2 py-0.5 rounded">Action Required</span>
                      </div>
                    ) : (
                      <div className="p-3 border border-emerald-200 bg-emerald-50 rounded-xl flex items-center gap-2 text-xs font-black text-emerald-950 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Stock Level Safe
                      </div>
                    )}

                    {/* Replenish Purchase Order Draft */}
                    {poStatus === 'sent' && (
                      <div className="p-4 border border-emerald-200 bg-emerald-50 rounded-xl space-y-3 font-mono text-xs text-neutral-800">
                        <div className="flex justify-between border-b border-emerald-100 pb-1.5 font-bold">
                          <span>DRAFT PURCHASE ORDER: PO-2026-004</span>
                          <span className="text-emerald-700">STATUS: Draft Ready</span>
                        </div>
                        <div className="space-y-1">
                          <p>SUPPLIER: Denim Mills Ltd (Karachi Hub)</p>
                          <p>REPLENISH QUANTITY: 500 Units</p>
                          <p>ESTIMATED COST: PKR 600,000</p>
                        </div>
                        <p className="text-[10px] text-neutral-500 font-semibold border-t border-emerald-100 pt-1.5 leading-relaxed font-sans">
                          Draft is automatically generated with your predefined purchase price. Ready for approval and instant FBR tracking mapping.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      {poStatus !== 'idle' && (
                        <Button onClick={() => setPoStatus('idle')} variant="ghost" size="sm" className="font-bold text-neutral-500">
                          Reset
                        </Button>
                      )}
                      <Button
                        onClick={triggerPO}
                        disabled={jeansStock >= 100 || poStatus === 'generating'}
                        size="sm"
                        className="bg-brand-primary hover:bg-brand-primary-dark text-white font-black text-xs uppercase tracking-wider rounded-xl h-10 px-4 disabled:opacity-50"
                      >
                        {poStatus === 'idle' ? 'Auto-Draft Purchase Order' :
                          poStatus === 'generating' ? 'Drafting...' : 'Purchase Draft Generated'}
                      </Button>
                    </div>

                  </div>
                </div>
              )}

              {/* TERMINAL CONTENT FOR TAB 3: FBR GST TAX INVOICING */}
              {activeTerminalTab === 'fbr' && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-xs font-black text-brand-primary uppercase tracking-widest block">Pakistani GST invoicing (demo)</span>
                    <h4 className="font-black text-2xl text-neutral-900">Sales billing with local tax calculations.</h4>
                    <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                      Illustrative receipt with standard 18% GST math. TENVO calculates tax on live invoices and POS sales; FBR IRIS live transmission is on the roadmap.
                    </p>
                  </div>

                  {/* FBR invoice terminal box */}
                  <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm my-4">

                    {/* Invoice amount slider */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-black text-neutral-500 uppercase tracking-wider">Subtotal Invoice Amount</span>
                        <span className="text-xs font-bold text-neutral-800">PKR {terminalFbrAmount.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="5000"
                        max="100000"
                        step="5000"
                        value={terminalFbrAmount}
                        onChange={(e) => setTerminalFbrAmount(Number(e.target.value))}
                        className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                      />
                    </div>

                    {/* Tax Invoicing Preview Card */}
                    <div className="border border-neutral-200 rounded-2xl p-4 font-mono text-xs text-neutral-800 space-y-2 bg-neutral-50 relative overflow-hidden">
                      <div className="absolute right-3 top-3 h-10 w-10 border border-emerald-500 text-emerald-600 rounded flex items-center justify-center font-bold text-[8px] uppercase tracking-wider rotate-12">
                        GST calc
                      </div>
                      <div className="border-b border-neutral-200 pb-2">
                        <p className="font-bold text-neutral-900">TENVO OPERATIVE BILLING</p>
                        <p className="text-[10px] text-neutral-400">Sample invoice preview</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Subtotal Invoice:</span>
                          <span>PKR {terminalFbrAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-200 pb-1 text-brand-primary font-bold">
                          <span>Standard GST (18%):</span>
                          <span>PKR {Math.round(terminalFbrAmount * 0.18).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm font-black text-neutral-900 pt-1">
                          <span>TOTAL RECEIPT:</span>
                          <span>PKR {Math.round(terminalFbrAmount * 1.18).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-[8px] text-neutral-400 font-semibold leading-relaxed border-t border-neutral-200 pt-2 font-sans">
                        Demo only — production invoices use your configured tax rules and audit trail.
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* TERMINAL CONTENT FOR TAB 4: INTELLIGENT PACKAGING & LOGISTICS */}
              {activeTerminalTab === 'packaging' && (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <span className="text-xs font-black text-brand-primary uppercase tracking-widest block">Intelligent Courier Packaging</span>
                    <h4 className="font-black text-2xl text-neutral-900">Optimize box allocation to save freight shipping fees.</h4>
                    <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                      Don&apos;t waste high logistics freight costs. TENVO automatically groups items into standard courier box sizes (TCS, Leopards) and logs dimensions:
                    </p>
                  </div>

                  {/* Packaging Terminal Box */}
                  <div className="bg-white border border-neutral-200 rounded-2xl p-5 space-y-4 shadow-sm my-4">

                    {/* Box selection */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setSelectedBox('standard')}
                        className={`p-3 border rounded-xl text-xs font-bold text-left transition-all ${selectedBox === 'standard'
                          ? 'bg-neutral-50 border-brand-primary'
                          : 'bg-white border-neutral-200'
                          }`}
                      >
                        <span className="block font-black text-neutral-800">Box A (Medium Courier)</span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">Capacity limit: 5kg</span>
                      </button>

                      <button
                        onClick={() => setSelectedBox('heavy')}
                        className={`p-3 border rounded-xl text-xs font-bold text-left transition-all ${selectedBox === 'heavy'
                          ? 'bg-neutral-50 border-brand-primary'
                          : 'bg-white border-neutral-200'
                          }`}
                      >
                        <span className="block font-black text-neutral-800">Box B (Large Cargo)</span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">Capacity limit: 20kg</span>
                      </button>
                    </div>

                    {/* Packaging Slip Representation */}
                    <div className="p-4 border border-neutral-200 rounded-2xl bg-neutral-50 font-mono text-xs space-y-2">
                      <div className="flex justify-between border-b border-neutral-200 pb-1.5 text-[10px] font-black text-neutral-400 uppercase">
                        <span>Courier Packaging slip</span>
                        <span>Carrier: TCS Freight</span>
                      </div>
                      <div className="space-y-1">
                        <p>BOX ALLOCATION: {selectedBox === 'standard' ? 'Box A - 2 Shirts, 1 Jeans' : 'Box B - 12 Shirts, 6 Jeans, 2 Blazers'}</p>
                        <p>PACK WEIGHT: {selectedBox === 'standard' ? '2.4 kg (SAFE)' : '14.8 kg (SAFE)'}</p>
                        <p>FREIGHT BRACKET: {selectedBox === 'standard' ? 'Standard Courier rate' : 'Heavy Cargo rate'}</p>
                      </div>
                      <div className="border-t border-neutral-200 pt-2 flex items-center justify-between font-sans text-xs">
                        <span className="text-emerald-700 font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Weight Allocation Compliant
                        </span>
                        <span className="font-mono text-[10px] text-neutral-400">Dim: {selectedBox === 'standard' ? '12x12x8in' : '24x24x18in'}</span>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* 6. WHO BENEFITS (AUDIENCE VERTICALS) - Pure Light Theme */}
      <section className="bg-neutral-50 border-b border-neutral-200/80 py-10 sm:py-16 lg:py-28">
        <div className={MARKETING_CONTAINER}>

          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-[11px] font-black text-brand-primary uppercase tracking-[0.25em]">Industry Specific Solutions</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">
              Tailored templates for every serious business.
            </h3>
            <p className="text-lg text-neutral-500 font-medium">
              Don’t spend months configuring custom properties. TENVO features 55+ vertical presets optimized for Pakistani industries.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1: Retail & E-commerce */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 space-y-5 hover:border-brand-primary transition-colors">
              <div className="h-12 w-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-brand-primary border border-neutral-200/80">
                <Store className="w-6 h-6" />
              </div>
              <h4 className="font-black text-lg text-neutral-900">Retail & E-commerce</h4>
              <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
                Your own branded storefront plus POS and marketplaces - one stock picture. Sync Daraz and other channels, print barcodes, run checkout offline when the line is long, and ship with TCS, Leopards, and partners you already use.
              </p>
              <ul className="space-y-2 text-[11px] font-bold text-neutral-600">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Branded web store + channel sync</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Barcodes & fast retail checkout</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Courier-ready fulfilment</li>
              </ul>
            </div>

            {/* Card 2: Wholesale & Distribution */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 space-y-5 hover:border-brand-primary transition-colors">
              <div className="h-12 w-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-brand-primary border border-neutral-200/80">
                <Globe className="w-6 h-6" />
              </div>
              <h4 className="font-black text-lg text-neutral-900">Wholesale & Distribution</h4>
              <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
                Manage high volume trade relationships. Set custom price lists per customer class, establish strict credit limits, calculate volume-based discount tiers, and coordinate bulk logistics.
              </p>
              <ul className="space-y-2 text-[11px] font-bold text-neutral-600">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Dynamic Pricing lists</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Customer Credit limits</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Volume discount grids</li>
              </ul>
            </div>

            {/* Card 3: Manufacturing & Factory */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 space-y-5 hover:border-brand-primary transition-colors">
              <div className="h-12 w-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-brand-primary border border-neutral-200/80">
                <Factory className="w-6 h-6" />
              </div>
              <h4 className="font-black text-lg text-neutral-900">Factory & Manufacturing</h4>
              <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
                Control complex production pipelines. Track multi-level Bill of Materials (BOM), generate work orders, manage raw material stock levels, and monitor exact Cost of Goods Manufactured (COGM).
              </p>
              <ul className="space-y-2 text-[11px] font-bold text-neutral-600">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Multi-level Bill of Materials</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Work Order operations</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Precise COGM calculation</li>
              </ul>
            </div>

            {/* Card 4: Pharmacy & Healthcare */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 space-y-5 hover:border-brand-primary transition-colors">
              <div className="h-12 w-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-brand-primary border border-neutral-200/80">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-black text-lg text-neutral-900">Pharmacy & Pharma</h4>
              <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
                Ensure perfect lot safety. Track medicine batches, set automatic alerts for expiring drugs, log supplier licensing details, and comply with strict national health regulations.
              </p>
              <ul className="space-y-2 text-[11px] font-bold text-neutral-600">
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Batch & Expiry tracking</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Expiry warning system</li>
                <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-primary" /> Drug license logging</li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 7. UNIQUE BENEFITS & COMPETITIVE ANALYSIS - Pure Light Theme */}
      <section className="bg-white border-b border-neutral-200/80 py-10 sm:py-16 lg:py-28">
        <div className={MARKETING_CONTAINER}>

          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-[11px] font-black text-brand-primary uppercase tracking-[0.25em]">Why Choose Tenvo</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">
              What makes TENVO unique?
            </h3>
            <p className="text-lg text-neutral-500 font-medium">
              We built an enterprise inventory system specifically for Pakistani businesses, addressing the critical issues competitors ignore.
            </p>
          </div>

          {/* Core Unique selling points */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="p-8 border border-neutral-200/80 rounded-[2rem] bg-neutral-50 space-y-4">
              <h4 className="font-black text-lg text-neutral-900">1. Urdu Language Support</h4>
              <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                Your office managers might prefer English, but your warehouse team on the ground doesn’t have to suffer. TENVO features a full **Urdu UI toggle** designed for easy catalog searches, barcode scanning, and transfer entries.
              </p>
            </div>

            <div className="p-8 border border-neutral-200/80 rounded-[2rem] bg-neutral-50 space-y-4">
              <h4 className="font-black text-lg text-neutral-900">2. Zero-Data-Loss Migration</h4>
              <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                Moving systems is scary. TENVO assigns a **dedicated migration manager** to every single enterprise customer. We map your current Excel files, verify duplicate SKU databases, and transfer everything for free.
              </p>
            </div>

            <div className="p-8 border border-neutral-200/80 rounded-[2rem] bg-neutral-50 space-y-4">
              <h4 className="font-black text-lg text-neutral-900">3. Local Cloud & Offline POS</h4>
              <p className="text-sm text-neutral-600 font-medium leading-relaxed">
                Load dashboards instantly with zero lag. Our local cloud server architecture guarantees fast access times inside Pakistan, coupled with offline point-of-sale terminals that sync data automatically when internet recovers.
              </p>
            </div>
          </div>

          {/* Comparison Table: Traditional vs Basic vs Tenvo */}
          <div className="bg-white border border-neutral-200/80 rounded-[2.5rem] p-6 lg:p-10 overflow-x-auto shadow-sm">
            <h4 className="font-black text-neutral-900 text-xl mb-2">Operating model comparison</h4>
            <p className="text-xs text-neutral-500 font-semibold mb-6 max-w-2xl">
              For a buyer-style view versus typical storefront-first or multi-app suites, see{' '}
              <Link href="/why-tenvo" className="text-brand-primary font-black hover:underline">Why TENVO</Link>.
            </p>

            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-neutral-200 font-black text-[10px] uppercase tracking-wider text-neutral-400">
                  <th className="p-4">Key Capabilities</th>
                  <th className="p-4">Traditional ERPs</th>
                  <th className="p-4">Spreadsheets</th>
                  <th className="p-4 text-brand-primary">TENVO Inventory Engine</th>
                </tr>
              </thead>
              <tbody>

                <tr className="border-b border-neutral-100 text-xs font-semibold text-neutral-700">
                  <td className="p-4 font-bold text-neutral-900">Branded store + POS + warehouse in one rhythm</td>
                  <td className="p-4 text-neutral-400">Heavy customization</td>
                  <td className="p-4 text-neutral-400">Manual links</td>
                  <td className="p-4 text-brand-primary font-bold">Designed together</td>
                </tr>

                <tr className="border-b border-neutral-100 text-xs font-semibold text-neutral-700">
                  <td className="p-4 font-bold text-neutral-900">Web orders in the same queue as counter & B2B</td>
                  <td className="p-4 text-neutral-400">Often separate modules</td>
                  <td className="p-4 text-neutral-400">Fragmented tabs</td>
                  <td className="p-4 text-brand-primary font-bold">Single order hub</td>
                </tr>

                <tr className="border-b border-neutral-100 text-xs font-semibold text-neutral-700">
                  <td className="p-4 font-bold text-neutral-900">Implementation Time</td>
                  <td className="p-4 text-neutral-400">6 - 12 Months</td>
                  <td className="p-4 text-neutral-400">Manual Setup (Days)</td>
                  <td className="p-4 text-brand-primary font-bold">Go live in 4 Days</td>
                </tr>

                <tr className="border-b border-neutral-100 text-xs font-semibold text-neutral-700">
                  <td className="p-4 font-bold text-neutral-900">Excel Paste & Import</td>
                  <td className="p-4 text-neutral-400">Partial / Strict formatting</td>
                  <td className="p-4 text-brand-primary">Native</td>
                  <td className="p-4 text-brand-primary font-bold">Native (with cell validation)</td>
                </tr>

                <tr className="border-b border-neutral-100 text-xs font-semibold text-neutral-700">
                  <td className="p-4 font-bold text-neutral-900">Batch & Expiry Warning</td>
                  <td className="p-4 text-neutral-400">Complex add-on module</td>
                  <td className="p-4 text-neutral-400">Manual tracking / Missing</td>
                  <td className="p-4 text-brand-primary font-bold">Built-in (with expiry alerts)</td>
                </tr>

                <tr className="border-b border-neutral-100 text-xs font-semibold text-neutral-700">
                  <td className="p-4 font-bold text-neutral-900">Pakistan tax setup</td>
                  <td className="p-4 text-neutral-400">Custom expensive wrappers</td>
                  <td className="p-4 text-neutral-400">Impossible</td>
                  <td className="p-4 text-brand-primary font-bold">Compliant & Automatic</td>
                </tr>

                <tr className="border-b border-neutral-100 text-xs font-semibold text-neutral-700">
                  <td className="p-4 font-bold text-neutral-900">Multichannel Sell Sync</td>
                  <td className="p-4 text-neutral-400">Rigid API integrations</td>
                  <td className="p-4 text-neutral-400">Manual entry drift</td>
                  <td className="p-4 text-brand-primary font-bold">Daraz & Shopify native API</td>
                </tr>

                <tr className="text-xs font-semibold text-neutral-700">
                  <td className="p-4 font-bold text-neutral-900">Upfront Licensing Cost</td>
                  <td className="p-4 text-neutral-400">PKR 500,000+</td>
                  <td className="p-4 text-brand-primary">PKR 0</td>
                  <td className="p-4 text-brand-primary font-bold">Free Trial, scale from PKR 4,500/mo</td>
                </tr>

              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* 8. STEP-BY-STEP ADOPTION PATHWAY - Pure Light Theme */}
      <section className="bg-neutral-50 border-b border-neutral-200/80 py-10 sm:py-16 lg:py-28">
        <div className={MARKETING_CONTAINER}>

          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-[11px] font-black text-brand-primary uppercase tracking-[0.25em]">Simple Onboarding</h2>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-900 tracking-tight">
              Switching is simpler than you think.
            </h3>
            <p className="text-lg text-neutral-500 font-medium">
              We design every setup phase to maximize operational continuity and prevent business downtime.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">

            <div className="bg-white p-6 border border-neutral-200/80 rounded-3xl space-y-3 shadow-sm relative">
              <div className="text-xs font-black text-brand-primary uppercase tracking-widest">Phase 01</div>
              <h4 className="font-black text-lg text-neutral-900">Pick Industry Preset</h4>
              <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
                Register in 60 seconds. Select your business vertical (Retail, FMCG, Manufacturing, Pharmacy) to pre-load tailored SKU categories, units of measure, and default tax codes.
              </p>
              <div className="hidden md:block absolute top-[40%] right-[-10%] translate-x-1 z-20 text-neutral-300">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 border border-neutral-200/80 rounded-3xl space-y-3 shadow-sm relative">
              <div className="text-xs font-black text-brand-primary uppercase tracking-widest">Phase 02</div>
              <h4 className="font-black text-lg text-neutral-900">Excel Bulk Upload</h4>
              <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
                Drag-and-drop your existing product catalogs, price lists, customer ledgers, and vendor details in Excel format. Our system validates duplicate SKUs and checks columns in real-time.
              </p>
              <div className="hidden md:block absolute top-[40%] right-[-10%] translate-x-1 z-20 text-neutral-300">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 border border-neutral-200/80 rounded-3xl space-y-3 shadow-sm relative">
              <div className="text-xs font-black text-brand-primary uppercase tracking-widest">Phase 03</div>
              <h4 className="font-black text-lg text-neutral-900">Sync Warehouses</h4>
              <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
                Connect your physical warehouses, retail locations, and online Shopify/Daraz store accounts. Establish low-stock reorder thresholds to receive automatic alerts when levels drop.
              </p>
              <div className="hidden md:block absolute top-[40%] right-[-10%] translate-x-1 z-20 text-neutral-300">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-6 border border-neutral-200/80 rounded-3xl space-y-3 shadow-sm">
              <div className="text-xs font-black text-brand-primary uppercase tracking-widest">Phase 04</div>
              <h4 className="font-black text-lg text-neutral-900">Fulfill & Automate</h4>
              <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
                Invite operators, assign specific permissions (e.g. warehouse picker, POS cashier, billing clerk), print barcodes, and manage seamless dispatch operations.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 8.5 SECURITY & COMPLIANCE BADGES */}
      <section className="bg-neutral-50 border-b border-neutral-200/80 py-10 sm:py-14 lg:py-20">
        <div className={MARKETING_CONTAINER}>
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-[11px] font-black text-brand-primary uppercase tracking-[0.25em]">Enterprise-Grade Security</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
              Your data is protected by the highest standards.
            </h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'Tax-ready', desc: 'GST configuration' },
              { icon: Lock, title: 'SSL Encryption', desc: '256-bit secure' },
              { icon: Server, title: 'Cloud Secured', desc: 'AWS hosting' },
              { icon: BadgeCheck, title: 'PSEB Registered', desc: 'Govt verified' },
              { icon: Award, title: 'ISO 27001', desc: 'In progress' },
              { icon: CheckCircle, title: 'GDPR Ready', desc: 'Data privacy' },
              { icon: ShieldCheck, title: 'PCI DSS', desc: 'Payment secure' },
              { icon: CheckCircle2, title: 'SOC 2', desc: 'Type II pending' },
            ].map((badge, idx) => (
              <div key={idx} className="bg-white border border-neutral-200/80 rounded-2xl p-6 text-center hover:border-brand-primary/30 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-primary group-hover:text-white transition-all text-brand-primary">
                  <badge.icon className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-neutral-900">{badge.title}</h4>
                <p className="text-xs text-neutral-500 font-semibold mt-1">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof → lives on /about#voices */}
      <section className="border-b border-neutral-200/80 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-12">
          <p className="text-sm font-bold text-neutral-800">Trusted by operators across Pakistan.</p>
          <p className="mt-1 text-xs font-medium text-neutral-500">
            Read the founder note and customer stories on our About page.
          </p>
          <Link
            href="/about#voices"
            className="mt-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-brand-primary hover:underline"
          >
            People &amp; proof <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Integrations strip: compact infinite marquee (before FAQ) */}
      <section className="bg-white border-b border-neutral-200/70 py-5 sm:py-6 overflow-hidden">
        <p className="text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.22em] text-neutral-400 mb-3 px-4">
          Natively integrated channels &amp; local shipping carriers
        </p>
        <div
          className="relative integration-marquee-fade"
          aria-label="Integration partners"
        >
          <div className="flex w-max animate-marquee-partners motion-reduce:animate-none hover:[animation-play-state:paused]">
            {[0, 1].map((set) => (
              <div
                key={set}
                className="flex items-center gap-2.5 sm:gap-3 pr-6 sm:pr-10 shrink-0"
                aria-hidden={set === 1}
              >
                {partners.map((partner, idx) => (
                  <div
                    key={`${set}-${partner.name}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-neutral-200/90 bg-neutral-50/95 shadow-sm shrink-0"
                  >
                    <span className="font-bold text-[11px] sm:text-xs text-neutral-800 whitespace-nowrap">
                      {partner.name}
                    </span>
                    <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-wide text-brand-primary px-1 py-px bg-brand-50 rounded-sm whitespace-nowrap">
                      {partner.category}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. EXPANDABLE COMPREHENSIVE FAQ - Pure Light Theme */}
      <section className="bg-neutral-50 border-b border-neutral-200/80 py-10 sm:py-16 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          <div className="text-center mb-16 space-y-4">
            <h2 className="text-[11px] font-black text-brand-primary uppercase tracking-[0.25em]">Frequently Asked Questions</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              Everything you need to know.
            </h3>
            <p className="text-sm text-neutral-500 font-semibold">
              Can’t find the answer you’re looking for? Reach out to our dedicated support squad.
            </p>
          </div>

          <div className="space-y-4">

            {/* FAQ Item 1 */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFaq(0)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-black text-neutral-800 text-sm sm:text-base">Can I really import native Excel files directly?</span>
                <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${expandedFaq === 0 ? 'rotate-180' : ''}`} />
              </button>
              {expandedFaq === 0 && (
                <div className="p-6 pt-0 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                    Yes! Unlike traditional ERP platforms that fail if your spreadsheet isn&apos;t formatted perfectly, TENVO supports direct upload of native `.xlsx` files. Our interface checks your columns in real-time, displays explicit warnings for duplicate SKU codes or invalid prices, and allows you to partially import valid lines while providing a fixed Excel output file for errors.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 2 */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFaq(1)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-black text-neutral-800 text-sm sm:text-base">Is TENVO compliant with FBR tax laws?</span>
                <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${expandedFaq === 1 ? 'rotate-180' : ''}`} />
              </button>
              {expandedFaq === 1 && (
                <div className="p-6 pt-0 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                    TENVO features a localized tax ledger that calculates standard 18% GST (and configurable provincial rates) per invoice line. We provide audit-ready logs and export-oriented summaries for your filing workflow. Live FBR IRIS sync is on the roadmap.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 3 */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFaq(2)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-black text-neutral-800 text-sm sm:text-base">How does the Urdu language toggle work?</span>
                <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${expandedFaq === 2 ? 'rotate-180' : ''}`} />
              </button>
              {expandedFaq === 2 && (
                <div className="p-6 pt-0 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                    We realize warehouse teams may prefer Urdu for floor tasks. TENVO includes a language toggle with growing Urdu strings for core hub actions — full product localization is expanding release by release.
                  </p>
                </div>
              )}
            </div>

            {/* FAQ Item 4 */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-sm">
              <button
                onClick={() => toggleFaq(3)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-black text-neutral-800 text-sm sm:text-base">Will we lose data during our migration?</span>
                <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${expandedFaq === 3 ? 'rotate-180' : ''}`} />
              </button>
              {expandedFaq === 3 && (
                <div className="p-6 pt-0 border-t border-neutral-100">
                  <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
                    Never. Every single enterprise client is assigned a dedicated human Migration Manager. We review your messy old spreadsheets, check for SKU overlaps, verify existing supplier ledgers, perform sandbox test uploads, and ensure 100% data round-trip validation before switching your physical warehouse operations live.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* 11. HIGH IMPACT CALL-TO-ACTION (CTA) - Pure Light Theme */}
      <section className="bg-white py-10 sm:py-14 lg:py-24">
        <div className={MARKETING_CONTAINER}>

          <div className="bg-neutral-50 border border-neutral-200/80 rounded-[3rem] p-8 sm:p-12 lg:p-16 text-center space-y-6 relative overflow-hidden shadow-sm">
            <h2 className="text-[11px] font-black text-brand-primary uppercase tracking-[0.32em]">Ready to take command?</h2>
            <h3 className="text-3xl sm:text-5xl font-black text-neutral-900 tracking-tight max-w-4xl mx-auto">
              Unify your warehouse, sales, and accounts today.
            </h3>
            <p className="max-w-2xl mx-auto text-sm sm:text-base text-neutral-600 font-medium leading-relaxed">
              Join operational teams moving from spreadsheets to one connected workspace — inventory, storefront, POS, and finance with Pakistan-first tax configuration. Start free today.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-14 rounded-xl bg-brand-primary hover:bg-brand-primary-dark text-white px-8 text-base font-black uppercase tracking-[0.15em] shadow-md transition-all">
                <Link
                  href={workspaceHref}
                  onClick={() => trackHeroCta('footer_workspace', workspaceHref)}
                >
                  {workspaceCtaDesktop}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-xl border-neutral-300 bg-white hover:border-brand-primary hover:text-brand-primary px-8 text-base font-black uppercase tracking-[0.15em] transition-all">
                <Link href="/pricing">View Pricing Plans</Link>
              </Button>
            </div>

            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              No credit card required &bull; 14-day free trial &bull; Custom migration included
            </p>
          </div>

        </div>
      </section>

    </MarketingLayout>
  );
}
