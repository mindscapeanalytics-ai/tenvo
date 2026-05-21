'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Hook for managing subscription and billing
 */
export function useSubscription() {
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  /**
   * Fetch subscription details
   */
  const fetchSubscription = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/subscription');
      if (!response.ok) throw new Error('Failed to fetch subscription');
      const data = await response.json();
      setSubscription(data.subscription);
      return data.subscription;
    } catch (error) {
      console.error('Fetch subscription error:', error);
      return null;
    }
  }, []);

  /**
   * Fetch invoices
   */
  const fetchInvoices = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/invoices');
      if (!response.ok) throw new Error('Failed to fetch invoices');
      const data = await response.json();
      setInvoices(data.invoices);
      return data.invoices;
    } catch (error) {
      console.error('Fetch invoices error:', error);
      return [];
    }
  }, []);

  /**
   * Fetch payment methods
   */
  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await fetch('/api/billing/payment-methods');
      if (!response.ok) throw new Error('Failed to fetch payment methods');
      const data = await response.json();
      setPaymentMethods(data.paymentMethods);
      return data.paymentMethods;
    } catch (error) {
      console.error('Fetch payment methods error:', error);
      return [];
    }
  }, []);

  /**
   * Initialize checkout for plan upgrade
   */
  const initiateCheckout = useCallback(async ({ planTier, currency = 'pkr' }) => {
    setIsRedirecting(true);
    
    try {
      const response = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planTier, currency }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout');
      }

      const { checkoutUrl } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
      
    } catch (error) {
      toast.error(error.message);
      setIsRedirecting(false);
      throw error;
    }
  }, []);

  /**
   * Open billing portal
   */
  const openBillingPortal = useCallback(async () => {
    setIsRedirecting(true);
    
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to open billing portal');
      }

      const { portalUrl } = await response.json();
      
      // Redirect to Stripe billing portal
      window.location.href = portalUrl;
      
    } catch (error) {
      toast.error(error.message);
      setIsRedirecting(false);
      throw error;
    }
  }, []);

  /**
   * Cancel subscription
   */
  const cancelSubscription = useCallback(async ({ atPeriodEnd = true } = {}) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atPeriodEnd }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      const result = await response.json();
      
      toast.success(
        atPeriodEnd 
          ? 'Subscription will be cancelled at the end of your billing period' 
          : 'Subscription cancelled successfully'
      );
      
      // Refresh subscription data
      await fetchSubscription();
      
      return result;
      
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscription]);

  /**
   * Update subscription (upgrade/downgrade)
   */
  const updateSubscription = useCallback(async (newPlanTier) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/billing/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlanTier }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update subscription');
      }

      const result = await response.json();
      
      toast.success('Subscription updated successfully');
      
      // Refresh subscription data
      await fetchSubscription();
      
      return result;
      
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [fetchSubscription]);

  /**
   * Create crypto payment
   */
  const createCryptoPayment = useCallback(async ({ amount, currency = 'usd', cryptoCurrency = 'btc' }) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/billing/crypto/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, cryptoCurrency }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create crypto payment');
      }

      const data = await response.json();
      return data;
      
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check crypto payment status
   */
  const checkCryptoPaymentStatus = useCallback(async (paymentId) => {
    try {
      const response = await fetch(`/api/billing/crypto/status?paymentId=${paymentId}`);
      if (!response.ok) throw new Error('Failed to check payment status');
      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Check crypto payment status error:', error);
      return null;
    }
  }, []);

  // Load subscription data on mount
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    invoices,
    paymentMethods,
    isLoading,
    isRedirecting,
    fetchSubscription,
    fetchInvoices,
    fetchPaymentMethods,
    initiateCheckout,
    openBillingPortal,
    cancelSubscription,
    updateSubscription,
    createCryptoPayment,
    checkCryptoPaymentStatus,
  };
}

export default useSubscription;
