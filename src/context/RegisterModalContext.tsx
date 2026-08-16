import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { getRegistrationSection, scrollToRegistrationForm } from "../lib/registration";

export type RegisterModalOptions = {
  /** Course slug to pre-select in the form dropdown */
  courseId?: string;
  initialGoal?: string;
  leadSource?: string;
  /** If true and an on-page form exists, scroll there instead of opening the modal */
  preferScroll?: boolean;
};

type InlinePrefill = {
  courseId?: string;
  initialGoal?: string;
  leadSource?: string;
};

type RegisterModalContextValue = {
  isOpen: boolean;
  options: RegisterModalOptions;
  inlinePrefill: InlinePrefill;
  /** Open the global registration modal. Pass a course slug or options object. */
  openRegisterModal: (courseIdOrOpts?: string | RegisterModalOptions) => void;
  closeRegisterModal: () => void;
  /** Scroll to on-page form when present; otherwise open the modal */
  openRegister: (courseIdOrOpts?: string | RegisterModalOptions) => void;
  scrollToRegisterForm: (opts?: InlinePrefill) => void;
  setInlinePrefill: (opts: InlinePrefill) => void;
};

const RegisterModalContext = createContext<RegisterModalContextValue | null>(null);

function normalizeOpenArg(arg?: string | RegisterModalOptions): RegisterModalOptions {
  if (typeof arg === "string") return { courseId: arg };
  return arg ?? {};
}

export function RegisterModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<RegisterModalOptions>({});
  const [inlinePrefill, setInlinePrefillState] = useState<InlinePrefill>({});

  const openRegisterModal = useCallback((courseIdOrOpts?: string | RegisterModalOptions) => {
    const opts = normalizeOpenArg(courseIdOrOpts);
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeRegisterModal = useCallback(() => setIsOpen(false), []);

  const setInlinePrefill = useCallback((opts: InlinePrefill) => {
    setInlinePrefillState(opts);
  }, []);

  const scrollToRegisterForm = useCallback((opts?: InlinePrefill) => {
    if (opts) setInlinePrefillState(opts);
    requestAnimationFrame(() => {
      scrollToRegistrationForm({ focus: true });
    });
  }, []);

  const openRegister = useCallback(
    (courseIdOrOpts?: string | RegisterModalOptions) => {
      const opts = normalizeOpenArg(courseIdOrOpts);
      const preferScroll = opts.preferScroll !== false;
      if (preferScroll && getRegistrationSection()) {
        scrollToRegisterForm({
          courseId: opts.courseId,
          initialGoal: opts.initialGoal,
          leadSource: opts.leadSource ?? "nav-register",
        });
        return;
      }
      openRegisterModal({ ...opts, leadSource: opts.leadSource ?? "nav-register" });
    },
    [openRegisterModal, scrollToRegisterForm]
  );

  const value = useMemo(
    () => ({
      isOpen,
      options,
      inlinePrefill,
      openRegisterModal,
      closeRegisterModal,
      openRegister,
      scrollToRegisterForm,
      setInlinePrefill,
    }),
    [isOpen, options, inlinePrefill, openRegisterModal, closeRegisterModal, openRegister, scrollToRegisterForm, setInlinePrefill]
  );

  return <RegisterModalContext.Provider value={value}>{children}</RegisterModalContext.Provider>;
}

export function useRegisterModal() {
  const ctx = useContext(RegisterModalContext);
  if (!ctx) throw new Error("useRegisterModal must be used within RegisterModalProvider");
  return ctx;
}
