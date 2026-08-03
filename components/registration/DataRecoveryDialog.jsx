'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, RotateCcw, Trash2 } from 'lucide-react';

/**
 * Dialog shown when registration data is recovered from localStorage
 */
export function DataRecoveryDialog({ 
  isOpen, 
  onClose, 
  onAccept, 
  onReject,
  savedAt,
  ageHours,
  step
}) {
  const getStepName = (stepNum) => {
    switch (stepNum) {
      case 1: return 'Business Identity';
      case 2: return 'Business Type Selection';
      case 3: return 'Configuration';
      default: return 'Registration';
    }
  };

  const formattedTime = savedAt 
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      }).format(savedAt)
    : 'Unknown';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-blue-500" />
            Resume Previous Registration?
          </DialogTitle>
          <DialogDescription className="pt-2">
            We found a saved registration from <strong>{formattedTime}</strong>.
            Would you like to continue where you left off?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-slate-500" />
              <span className="text-slate-600">
                Saved {ageHours < 1 ? 'less than an hour ago' : 
                       ageHours === 1 ? '1 hour ago' : 
                       `${ageHours} hours ago`}
              </span>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="h-4 w-4 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600">
                {step}
              </div>
              <span className="text-slate-600">
                Last step: <strong>{getStepName(step)}</strong>
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-3">
            Your information is securely stored on your device and will be cleared after successful registration.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onReject}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Start Fresh
          </Button>
          <Button 
            onClick={onAccept}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <RotateCcw className="h-4 w-4" />
            Resume Registration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact banner for inline recovery prompt (alternative to dialog)
 */
export function DataRecoveryBanner({ 
  onAccept, 
  onReject,
  ageHours 
}) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <RotateCcw className="h-5 w-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-blue-900">
            Continue where you left off?
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            We saved your progress from {ageHours < 1 ? 'earlier' : `${ageHours} hours ago`}.
          </p>
          <div className="flex gap-2 mt-3">
            <Button 
              size="sm" 
              onClick={onAccept}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Resume
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onReject}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Start Over
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
