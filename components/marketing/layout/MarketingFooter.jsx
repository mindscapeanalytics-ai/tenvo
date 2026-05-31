'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trackEvent, EVENTS } from '@/lib/analytics/tracking';
import { validateEmail } from '@/lib/marketing/validation';

/**
 * MarketingFooter Component
 * Comprehensive footer with links, contact info, and newsletter
 * Following 2026 best practices for footer design
 */
export default function MarketingFooter({ variant = 'default' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    setNewsletterError('');
    const check = validateEmail(email);
    if (!check.isValid) {
      setNewsletterError(check.error);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/marketing/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSubscribed(true);
        setEmail('');
        trackEvent(EVENTS.NEWSLETTER_SUBSCRIBE, { email });
      } else {
        setNewsletterError(data.message || 'Could not subscribe. Try again or use /contact.');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setNewsletterError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'minimal') {
    return (
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              © {new Date().getFullYear()} TENVO · Mindscape Analytics LLC. Pakistan launch; global roadmap.
            </div>
            <div className="flex flex-wrap gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <a href="/privacy" className="hover:text-brand-primary-dark transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-brand-primary-dark transition-colors">Terms</a>
              <a href="/contact" className="hover:text-brand-primary-dark transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.98))] border-t border-slate-200 pt-24 pb-12 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-16 mb-24">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 font-black text-xl uppercase tracking-tighter">
              <div className="w-8 h-8 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-[0_14px_34px_-18px_rgba(237,199,92,0.8)]">
                <Building2 className="w-5 h-5" />
              </div>
              TENVO
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              The backbone for growing businesses: deep Pakistan fit at launch, scaling globally. Parent: Mindscape Analytics LLC (Sheridan, WY, USA).
            </p>

            {/* Trust Badges */}
            <div className="flex items-center gap-3 pt-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-[10px] font-black text-green-700 uppercase tracking-wider">FBR Tier-1</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
                <CheckCircle2 className="w-4 h-4 text-amber-700" />
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">SECP</span>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-8">Platform</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-bold">
              <li><a href="/why-tenvo" className="hover:text-brand-primary-dark transition-colors">Why TENVO</a></li>
              <li><a href="/features" className="hover:text-brand-primary-dark transition-colors">Core Features</a></li>
              <li><a href="/features#integrations" className="hover:text-brand-primary-dark transition-colors">Integrations</a></li>
              <li><a href="/features#compliance" className="hover:text-brand-primary-dark transition-colors">Compliance</a></li>
              <li><a href="/solutions/marketing-crm" className="hover:text-brand-primary-dark transition-colors">Marketing &amp; CRM</a></li>
              <li><a href="/features#accounting" className="hover:text-brand-primary-dark transition-colors">Accounting</a></li>
              <li><a href="/features#security" className="hover:text-brand-primary-dark transition-colors">Security</a></li>
              <li><a href="/pricing" className="hover:text-brand-primary-dark transition-colors">Pricing</a></li>
              <li><a href="/industries" className="hover:text-brand-primary-dark transition-colors">Industries</a></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-8">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-bold">
              <li><a href="/about" className="hover:text-brand-primary-dark transition-colors">About Us</a></li>
              <li><a href="/case-studies" className="hover:text-brand-primary-dark transition-colors">Case studies</a></li>
              <li><a href="/careers" className="hover:text-brand-primary-dark transition-colors">Careers</a></li>
              <li><a href="/press" className="hover:text-brand-primary-dark transition-colors">Press</a></li>
              <li><a href="/contact" className="hover:text-brand-primary-dark transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-8">Support</h4>
            <ul className="space-y-4 text-sm text-gray-500 font-bold">
              <li><a href="/help" className="hover:text-brand-primary-dark transition-colors">Help center</a></li>
              <li><a href="/docs" className="hover:text-brand-primary-dark transition-colors">Documentation &amp; API overview</a></li>
              <li><a href="/status" className="hover:text-brand-primary-dark transition-colors">System status</a></li>
              <li><a href="/privacy" className="hover:text-brand-primary-dark transition-colors">Privacy policy</a></li>
              <li><a href="/terms" className="hover:text-brand-primary-dark transition-colors">Terms of use</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="border-t border-slate-200 pt-12 mb-12">
          <div className="max-w-md">
            <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">Stay Updated</h4>
            <p className="text-sm text-gray-500 font-medium mb-6">
              Get the latest updates on features, compliance changes, and industry insights.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Thanks for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (newsletterError) setNewsletterError('');
                    }}
                    required
                    className="flex-1"
                    disabled={loading}
                    aria-invalid={!!newsletterError}
                  />
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                    disabled={loading}
                  >
                    {loading ? 'Subscribing...' : 'Subscribe'}
                  </Button>
                </div>
                {newsletterError ? (
                  <p className="text-sm font-medium text-red-600" role="alert">
                    {newsletterError}
                  </p>
                ) : null}
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            © {new Date().getFullYear()} TENVO · Mindscape Analytics LLC. Pakistan launch; global roadmap.
          </div>
          <a
            href="/industries"
            className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-brand-primary-dark transition-colors"
          >
            Markets we serve
          </a>
        </div>
      </div>
    </footer>
  );
}
