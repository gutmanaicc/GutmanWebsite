import { useCallback, useEffect, useRef, useState } from "react";
import Pressable from "./Pressable";
import ReviewsRatingBadge from "./ReviewsRatingBadge";
import { WhatsAppIcon } from "./icons";
import { SITE } from "../data/site";

/**
 * ההירו הנגלל של הסקיל, מותאם ל-React: וידאו אחד מתנגן קדימה בגלילה
 * למטה ואחורה בגלילה למעלה. כל התקן ההנדסי של scrub-pipeline נשמר:
 * Blob fetch מאחורי מרוץ-פוסטר, lerp מנורמל-dt שנח, seek gating עם
 * מילוט מ-deadlock, כתיבות DOM רק בשינוי, חמשת שערי הסטטי חיים,
 * ושלם-גם-בלי-וידאו.
 */

const VIDEO_MP4 = "/videos/hero-scrub.mp4";
const VIDEO_WEBM = "/videos/hero-scrub.webm";
/** בוחרים קידוד לפי מה שהדפדפן באמת יודע לפענח, לא לפי ניחוש */
const pickVideoUrl = () => {
  const probe = document.createElement("video");
  if (probe.canPlayType('video/mp4; codecs="avc1.42E01E"')) return VIDEO_MP4;
  if (probe.canPlayType('video/webm; codecs="vp9"')) return VIDEO_WEBM;
  return VIDEO_MP4;
};
const POSTER_URL = "/images/hero-poster.jpg";
const ENDING_URL = "/images/hero-ending.jpg";
/** גובה ההירו בגלילה: שוט יחיד של 6 שניות = ‎420vh */
const HERO_VH = 520;

/* חמשת שערי הסטטי - זהים תו-בתו ל-CSS שב-index.css */
const GATES = [
  "(max-width: 720px)",
  "(orientation: portrait) and (max-width: 1024px)",
  "(orientation: portrait) and (pointer: coarse)",
  "(orientation: landscape) and (pointer: coarse) and (max-height: 560px)",
  "(prefers-reduced-motion: reduce)",
];

/* מפת הרצועות מחבילת העיצוב; נקודות פתיחה, מכוילות במבחן ההינף */
type Band = { a: number; b: number; lines: string[]; side: "start" | "end" | "center" };
const BANDS: Band[] = [
  { a: 0.0, b: 0.2, lines: ["לא רק ללמוד AI."], side: "start" },
  { a: 0.24, b: 0.5, lines: ["לומדים דרך בנייה.", "לא צפייה מהצד."], side: "end" },
  { a: 0.54, b: 0.79, lines: ["יוצאים עם תוצר אמיתי.", "ושיטה שנשארת."], side: "start" },
];
const SETTLE = { a: 0.83, b: 1.0 };

const smoothstep = (p: number, e0: number, e1: number) => {
  const t = Math.min(1, Math.max(0, (p - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const ScrubHero = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const bandRefs = useRef<(HTMLDivElement | null)[]>([]);
  const settleRef = useRef<HTMLDivElement>(null);
  const [statiq, setStatiq] = useState(true); // עד שהשערים מוכרעים, סטטי
  const [videoState, setVideoState] = useState<"loading" | "ready" | "failed">("loading");

  /* -------- מנוע הסקראב: חי רק כשהשערים פתוחים -------- */
  useEffect(() => {
    const wrap = wrapRef.current;
    const video = videoRef.current;
    if (!wrap || !video) return;

    let scrubOn = false;
    let heroOnScreen = true;
    let target = 0;
    let shown = 0;
    let rafId: number | null = null;
    let lastTick = 0;
    let seekBusy = false;
    let pendingTime: number | null = null;
    let started = false;
    let disposed = false;
    const bandCache = BANDS.map(() => ({ op: -1, k: -1 }));
    let settleCache = { op: -1, k: -1 };

    const heroProgress = () => {
      const rect = wrap.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      if (range <= 0) return 0;
      return clamp01(-rect.top / range);
    };

    const requestSeek = (t: number) => {
      if (!video.duration || !isFinite(t)) return;
      if (seekBusy) {
        pendingTime = t;
        return;
      }
      seekBusy = true;
      video.currentTime = t;
    };
    const onSeeked = () => {
      seekBusy = false;
      if (pendingTime !== null) {
        const t = pendingTime;
        pendingTime = null;
        requestSeek(t);
      }
    };
    const onVideoError = () => {
      seekBusy = false;
      pendingTime = null;
      setVideoState("failed");
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onVideoError);

    /* כתיבות DOM רק בשינוי */
    const updateCaptions = (p: number) => {
      BANDS.forEach((band, i) => {
        const el = bandRefs.current[i];
        if (!el) return;
        const f = Math.min(0.02, (band.b - band.a) / 3);
        let op =
          smoothstep(p, band.a, band.a + f) * (1 - smoothstep(p, band.b - f, band.b));
        if (i === 0) op = 1 - smoothstep(p, band.b - f, band.b); // הרצועה הראשונה נפתחת מיושבת
        const ramp = Math.min(0.025, (band.b - band.a) * 0.35);
        const k = clamp01((p - band.a) / ramp);
        const c = bandCache[i];
        if (Math.abs(op - c.op) > 0.008) {
          c.op = op;
          el.style.opacity = String(op);
        }
        if (Math.abs(k - c.k) > 0.008) {
          c.k = k;
          el.style.setProperty("--k", String(i === 0 ? Math.max(k, 1) : k));
        }
      });
      const st = settleRef.current;
      if (st) {
        const op = smoothstep(p, SETTLE.a, SETTLE.a + 0.04);
        const k = clamp01((p - SETTLE.a) / 0.08);
        if (Math.abs(op - settleCache.op) > 0.008) {
          settleCache.op = op;
          st.style.opacity = String(op);
          st.style.pointerEvents = op > 0.6 ? "auto" : "none";
        }
        if (Math.abs(k - settleCache.k) > 0.008) {
          settleCache.k = k;
          st.style.setProperty("--k", String(k));
        }
      }
    };

    /* lerp מנורמל-dt שנח בהתכנסות */
    const tick = (now: number) => {
      const dt = Math.min(100, now - (lastTick || now));
      lastTick = now;
      const k = 0.16;
      shown += (target - shown) * (1 - Math.pow(1 - k, dt / 16.667));
      if (Math.abs(target - shown) < 0.0005) {
        shown = target;
        rafId = null;
        lastTick = 0;
      } else {
        rafId = requestAnimationFrame(tick);
      }
      if (video.duration) requestSeek(shown * Math.max(0, video.duration - 0.05));
      updateCaptions(shown);
    };

    const onScroll = () => {
      target = heroProgress();
      if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
    };

    /* Blob fetch: הפוסטר מנצח את מרוץ הרוחב, הווידאו נטען בעדיפות נמוכה */
    const startBlobFetch = async () => {
      if (started || disposed) return;
      started = true;
      try {
        const ctrl = new AbortController();
        let watchdog = window.setTimeout(() => ctrl.abort(), 20000);
        const url = pickVideoUrl();
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok || !res.body) throw new Error("fetch failed");
        const total = Number(res.headers.get("Content-Length")) || 3_500_000;
        const reader = res.body.getReader();
        const chunks: BlobPart[] = [];
        let got = 0;
        let lastRing = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          window.clearTimeout(watchdog);
          watchdog = window.setTimeout(() => ctrl.abort(), 20000);
          chunks.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength) as ArrayBuffer);
          got += value.length;
          const frac = Math.min(1, got / total);
          const now = performance.now();
          if ((now - lastRing > 100 || frac === 1) && ringRef.current) {
            lastRing = now;
            ringRef.current.style.strokeDashoffset = String(Math.round(126 * (1 - frac)));
          }
        }
        window.clearTimeout(watchdog);
        if (disposed) return;
        video.src = URL.createObjectURL(
          new Blob(chunks, { type: url.endsWith(".webm") ? "video/webm" : "video/mp4" }),
        );
        video.load();
        video.addEventListener(
          "canplay",
          () => {
            if (disposed) return;
            setVideoState("ready");
            requestSeek(heroProgress() * Math.max(0, video.duration - 0.05));
          },
          { once: true },
        );
      } catch {
        if (!disposed) setVideoState("failed");
      }
    };

    const io = new IntersectionObserver(([e]) => {
      heroOnScreen = e.isIntersecting;
      if (heroOnScreen && scrubOn) onScroll();
    });
    io.observe(wrap);

    const enableScrub = () => {
      if (scrubOn) return;
      scrubOn = true;
      setStatiq(false);
      startBlobFetch();
      window.addEventListener("scroll", onScroll, { passive: true });
      bandCache.forEach((c) => {
        c.op = -1;
        c.k = -1;
      });
      settleCache = { op: -1, k: -1 };
      updateCaptions(heroProgress());
      onScroll();
    };
    const disableScrub = () => {
      if (!scrubOn) return;
      scrubOn = false;
      setStatiq(true);
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };
    const applyHeroMode = () => {
      if (GATES.some((q) => window.matchMedia(q).matches)) disableScrub();
      else enableScrub();
    };
    const mqls = GATES.map((q) => window.matchMedia(q));
    mqls.forEach((m) => m.addEventListener("change", applyHeroMode));
    applyHeroMode();

    return () => {
      disposed = true;
      io.disconnect();
      mqls.forEach((m) => m.removeEventListener("change", applyHeroMode));
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onVideoError);
      if (video.src.startsWith("blob:")) URL.revokeObjectURL(video.src);
    };
  }, []);

  const setBandRef = useCallback((i: number) => (el: HTMLDivElement | null) => {
    bandRefs.current[i] = el;
  }, []);

  /* תוכן ה-settle וההירו הסטטי חולקים את אותו בלוק (הקופי מחבילת העיצוב) */
  const SettleContent = ({ forStatic = false }: { forStatic?: boolean }) => (
    <div className={forStatic ? "" : "settle-stage"}>
      <h1 className="text-[clamp(2.6rem,7vw,6rem)] font-semibold leading-[1.02] tracking-tightest text-bone">
        לא רק ללמוד AI.{" "}
        <span className="accent-serif block">לדעת לעבוד איתו.</span>
      </h1>
      <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-bone/65 sm:text-lg">
        האקדמיה הפרונטלית ללימודי בינה מלאכותית. מגיעים עם החומר שלכם, יוצאים עם תוצר.
      </p>
      <div className="mt-6 flex justify-center">
        <ReviewsRatingBadge />
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3.5">
        <Pressable as="link" to="/courses" className="btn-primary">
          {SITE.hero.primaryCta}
        </Pressable>
        <Pressable
          as="a"
          href={SITE.contact.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost"
          rippleTone="pink"
        >
          <WhatsAppIcon size={19} className="shrink-0 text-[#25D366]" />
          דברו איתנו בוואטסאפ
        </Pressable>
      </div>
      <p className="mt-7 text-xs font-medium text-bone/40">
        ההירו הזה נוצר ב-AI. זה מה שתלמדו לעשות.
      </p>
    </div>
  );

  return (
    <section ref={wrapRef} className="scrub-hero relative" style={{ height: `${HERO_VH}vh` }}>
      <div className="sticky top-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden">
        {/* שכבות הבמה: פוסטר, וידאו, סקרים גלובלי */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${statiq ? ENDING_URL : POSTER_URL})` }}
          aria-hidden
        />
        {/* מרונדר תמיד כדי שה-ref יתקיים; הטעינה עצמה שמורה מאחורי השערים */}
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            !statiq && videoState === "ready" ? "opacity-100" : "opacity-0"
          }`}
          style={{ willChange: "transform", transform: "translateZ(0)" }}
          muted
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
        />
        {/* הסקרים הבסיסי - אף פריים לא נשאר גולמי מאחורי טקסט */}
        <div className="scrub-scrim absolute inset-0" aria-hidden />

        {/* טבעת טעינה כנה; בכשל הופכת לרמז גלילה */}
        {!statiq && videoState === "loading" && (
          <svg className="absolute bottom-8 left-1/2 h-12 w-12 -translate-x-1/2 -rotate-90 text-bone/60" viewBox="0 0 48 48" aria-hidden>
            <circle ref={ringRef} cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="126" style={{ strokeDashoffset: 126 }} />
          </svg>
        )}

        {statiq ? (
          /* ההירו הסטטי: פריסה מעוצבת מלאה מעל פריים הסיום */
          <div className="relative z-[2] px-5 text-center">
            <SettleContent forStatic />
          </div>
        ) : (
          <>
            {/* רצועות הכתוביות - בשוליים הנקיים, מתחלפות צדדים */}
            {BANDS.map((band, i) => (
              <div
                key={band.a}
                ref={setBandRef(i)}
                className={`scrub-band absolute bottom-[12%] z-[2] max-w-[26rem] px-6 ${
                  band.side === "start"
                    ? "right-[7%] text-right"
                    : band.side === "end"
                      ? "left-[7%] text-left"
                      : "left-1/2 -translate-x-1/2 text-center"
                }`}
                style={{ opacity: i === 0 ? 1 : 0, ["--k" as string]: i === 0 ? 1 : 0 }}
              >
                {band.lines.map((line, li) => (
                  <span
                    key={line}
                    className="scrub-line block text-[clamp(1.9rem,4.2vw,3.4rem)] font-semibold leading-[1.12] tracking-tight text-bone"
                    style={{ ["--li" as string]: li }}
                  >
                    {li === 1 ? <span className="accent-serif">{line}</span> : line}
                  </span>
                ))}
              </div>
            ))}

            {/* רצועת ה-settle: הכותרת האמיתית של האתר נוחתת על הרגע השקט */}
            <div
              ref={settleRef}
              className="absolute inset-x-0 z-[2] px-5 text-center"
              style={{ opacity: 0, pointerEvents: "none", ["--k" as string]: 0 }}
            >
              <SettleContent />
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ScrubHero;
