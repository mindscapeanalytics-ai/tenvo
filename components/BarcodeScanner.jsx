'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function BarcodeScanner({ onScan, onClose }) {
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (isScanning) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isScanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast.error('Unable to access camera');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleManualInput = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      onScan(e.target.value);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Scan Barcode</h3>
          <button
            onClick={() => {
              setIsScanning(false);
              onClose?.();
            }}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setIsScanning(!isScanning)}
            className="w-full px-4 py-2 bg-wine text-white rounded-lg hover:bg-wine/90"
          >
            {isScanning ? 'Stop Scanning' : 'Start Camera'}
          </button>
        </div>

        {isScanning && (
          <div className="mb-4 relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 border-4 border-wine border-dashed m-8 pointer-events-none" />
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Or enter barcode manually:</p>
          <input
            type="text"
            onKeyDown={handleManualInput}
            placeholder="Enter barcode and press Enter"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine focus:border-wine"
            autoFocus
          />
        </div>

        <p className="text-xs text-gray-500 text-center">
          Position the barcode within the frame or enter manually
        </p>
      </div>
    </div>
  );
}








