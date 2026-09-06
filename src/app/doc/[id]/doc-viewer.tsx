'use client';

import { useEffect, useRef } from 'react';

export function DocViewer({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function update() {
      if (!ref.current) return;
      const vw = document.documentElement.clientWidth;
      const available = vw - 16;
      const scale = Math.min(1, available / 794);
      ref.current.style.zoom = String(scale);
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <>
      <style>{`@media print { .doc-viewer { zoom: 1 !important; } }`}</style>
      <div ref={ref} className="doc-viewer" style={{ width: '794px' }}>
        {children}
      </div>
    </>
  );
}
