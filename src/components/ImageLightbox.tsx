import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

/**
 * פופאפ לצפייה בצילום הודעה. צילומי שיחה הם לרוב ארוכים מאוד, ולכן
 * התמונה יושבת בתוך אזור שנגלל בפני עצמו במקום להימתח מעבר למסך.
 */
const ImageLightbox = ({
  src,
  alt,
  onClose,
}: {
  src: string | null;
  alt: string;
  onClose: () => void;
}) => {
  const reduced = useReducedMotion();
  const open = Boolean(src);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            aria-label="סגירה"
            onClick={onClose}
          />

          <motion.div
            className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-[#141416] shadow-float"
            initial={reduced ? false : { opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
          >
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
              <span className="text-xs font-medium tracking-wide text-bone/50">ההודעה המקורית</span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-bone/70 transition-colors hover:border-white/45 hover:text-bone"
                onClick={onClose}
                aria-label="סגירה"
              >
                <X size={17} />
              </button>
            </div>

            {/* התמונה נגללת בתוך הפופאפ, כך שגם צילום ארוך מאוד נשאר קריא */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
              <img src={src ?? ""} alt={alt} className="block w-full" draggable={false} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageLightbox;
