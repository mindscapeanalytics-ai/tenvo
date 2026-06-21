'use client';

import { Toaster } from 'react-hot-toast';
import { getToastSurfaceStyle, toastIconThemes } from '@/lib/utils/appToast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerClassName="tenvo-toast-container"
      toastOptions={{
        duration: 4000,
        style: getToastSurfaceStyle(),
        success: {
          iconTheme: toastIconThemes.success,
        },
        error: {
          iconTheme: toastIconThemes.error,
        },
        loading: {
          iconTheme: toastIconThemes.success,
        },
      }}
    />
  );
}
