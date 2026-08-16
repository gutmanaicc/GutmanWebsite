import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type WaitlistTarget = {
  /** מזהה הסדנה, נשלח כמקור הליד */
  slug: string;
  /** שם הסדנה, ממלא אוטומטית את השדה בטופס */
  title: string;
};

type WaitlistModalContextValue = {
  isOpen: boolean;
  target: WaitlistTarget | null;
  openWaitlist: (target: WaitlistTarget) => void;
  closeWaitlist: () => void;
};

const WaitlistModalContext = createContext<WaitlistModalContextValue | null>(null);

export function WaitlistModalProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<WaitlistTarget | null>(null);

  const openWaitlist = useCallback((next: WaitlistTarget) => setTarget(next), []);
  const closeWaitlist = useCallback(() => setTarget(null), []);

  const value = useMemo(
    () => ({ isOpen: target !== null, target, openWaitlist, closeWaitlist }),
    [target, openWaitlist, closeWaitlist],
  );

  return <WaitlistModalContext.Provider value={value}>{children}</WaitlistModalContext.Provider>;
}

export function useWaitlistModal() {
  const ctx = useContext(WaitlistModalContext);
  if (!ctx) throw new Error("useWaitlistModal must be used within WaitlistModalProvider");
  return ctx;
}
