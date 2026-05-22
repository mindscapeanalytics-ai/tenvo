'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyEmail } from '@/lib/actions/auth/verification';

// Loading fallback for Suspense
function VerifyEmailLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="text-2xl">Loading...</CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}

// Main content component that uses useSearchParams
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      handleVerification();
    } else {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
    }
  }, [token]);

  const handleVerification = async () => {
    try {
      const result = await verifyEmail(token);
      
      if (result.success) {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.error);
      }
    } catch (error) {
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'verifying':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Verifying your email...
            </h2>
            <p className="text-slate-600">
              Please wait while we verify your email address.
            </p>
          </motion.div>
        );

      case 'success':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-block"
              >
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-1 -right-1"
              >
                <span className="flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                </span>
              </motion.div>
            </div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Email Verified!
            </h2>
            <p className="text-slate-600 mb-6">
              Your email has been successfully verified. You can now complete your registration and start using Tenvo.
            </p>
            
            <div className="space-y-3">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => window.location.href = '/register?verified=true'}
              >
                Continue Registration
              </Button>
              <p className="text-sm text-slate-500">
                Or{' '}
                <a href="/login" className="text-blue-600 hover:underline">
                  sign in to your account
                </a>
              </p>
            </div>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Verification Failed
            </h2>
            <p className="text-slate-600 mb-6">
              {message}
            </p>
            
            <div className="space-y-3">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => window.location.href = '/register'}
              >
                Back to Registration
              </Button>
              <p className="text-sm text-slate-500">
                Need help?{' '}
                <a href="mailto:support@tenvo.app" className="text-blue-600 hover:underline">
                  Contact support
                </a>
              </p>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            Tenvo Business Management Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}

// Page component with Suspense wrapper
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
