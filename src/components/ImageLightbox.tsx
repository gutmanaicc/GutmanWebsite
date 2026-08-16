import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { markPopupClosed, useScrollLock } from "../lib/scrollLock";

/**
 * פופאפ לצפייה בצילום הודעה. צילומי שיחה הם לרוב ארוכים מאוד, ולכן
 * התמונה יושבת בתוך אזור שנגלל בפני עצמו במקום להימתח מעבר למסך.
 *
 * הפופאפ מורכב ומפורק ישירות ולא דרך AnimatePresence, כדי שהסגירה תהיה
 * מיידית וודאית ולא תלויה בסיום אנימציית יציאה.
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

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /** סגירה בלחיצה מחוץ לפאנל, עם חסם קצר שמונע פתיחה מחדש מאותה לחיצה */
  const closeFromBackdrop = () => {
    markPopupClosed();
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onPointerDown={closeFromBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" aria-hidden />

      <motion.div
        className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-[#141416] shadow-float"
        initial={reduced ? false : { opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 30 }}
        onPointerDown={(e) => e.stopPropagation()}
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
    </motion.div>,
    document.body,
  );
};

export default ImageLightbox;
