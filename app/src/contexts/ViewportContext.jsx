import { createContext, useContext, useEffect, useState } from 'react';

const MOBILE_QUERY = '(max-width: 767px)';

// Per-area mutation gates. Mobile keeps quick-capture surfaces
// (tasks / notes / files) but blocks admin-y ones (vault / team /
// settings). `canDragTasks` is its own gate because touch drag is
// painful even when mutation is allowed.
const DEFAULTS = {
  isMobile: false,
  canMutateTasks: true,
  canMutateNotes: true,
  canMutateFiles: true,
  canMutateVault: true,
  canMutateTeam: true,
  canMutateSettings: true,
  canDragTasks: true,
};

const ViewportContext = createContext(DEFAULTS);

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

  const value = {
    isMobile,
    canMutateTasks: true,
    canMutateNotes: true,
    canMutateFiles: true,
    canMutateVault: !isMobile,
    canMutateTeam: !isMobile,
    canMutateSettings: !isMobile,
    canDragTasks: !isMobile,
  };

  return (
    <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>
  );
}

export function useViewport() {
  return useContext(ViewportContext);
}
