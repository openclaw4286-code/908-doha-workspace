import { createContext, useContext, useEffect, useState } from 'react';

const ViewportContext = createContext({ isMobile: false, readOnly: false });

const MOBILE_QUERY = '(max-width: 767px)';

export function ViewportProvider({ children }) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_QUERY).matches : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia(MOBILE_QUERY);
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(m.matches);
    m.addEventListener('change', handler);
    return () => m.removeEventListener('change', handler);
  }, []);

  // Mobile is read-only by design — users can browse but not mutate.
  return (
    <ViewportContext.Provider value={{ isMobile, readOnly: isMobile }}>
      {children}
    </ViewportContext.Provider>
  );
}

export function useViewport() {
  return useContext(ViewportContext);
}
