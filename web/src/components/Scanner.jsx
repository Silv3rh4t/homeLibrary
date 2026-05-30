import React, { useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

// Camera barcode scanner. Decodes EAN-13 (book ISBN barcodes) and calls onDetected.
// Requires HTTPS off-localhost — browsers block camera access otherwise.
export default function Scanner({ onDetected, onClose }) {
  const containerId = 'scanner-region';
  const scannerRef = useRef(null);
  const handledRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const scanner = new Html5Qrcode(containerId, {
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
      ],
      verbose: false,
    });
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 15, qrbox: { width: 300, height: 150 } },
        (decoded) => {
          if (handledRef.current) return;
          handledRef.current = true;
          onDetected(decoded);
        },
        () => {}, // ignore per-frame decode errors
      )
      .catch((err) => {
        if (!cancelled) {
          alert(`Camera error: ${err?.message || err}. HTTPS is required for the camera.`);
          onClose();
        }
      });

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s && s.isScanning) s.stop().then(() => s.clear()).catch(() => {});
    };
  }, [onDetected, onClose]);

  return (
    <div className="scanner-overlay">
      <div className="scanner-header">
        <span>Point at the book's barcode</span>
        <button className="btn-ghost" onClick={onClose}>Close</button>
      </div>
      <div id={containerId} className="scanner-region" />
    </div>
  );
}
