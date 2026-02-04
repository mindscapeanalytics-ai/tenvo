'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#000',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '12px 16px',
        },
        success: {
          iconTheme: {
            primary: '#8B1538',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}








