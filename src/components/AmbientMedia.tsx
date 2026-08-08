import { useCallback, useEffect, useState } from "react";

type Props = {
  video?: string;
  videoWebm?: string;
  poster: string;
  alt?: string;
  className?: string;
};

// מדיה אווירתית: וידאו לופ שקט כשמותר, תמונה סטטית כשהמשתמש ביקש פחות תנועה
const AmbientMedia = ({ video, videoWebm, poster, alt = "", className }: Props) => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // React לא כותב את muted ל-DOM (באג ידוע), ואז הדפדפן חוסם autoplay.
  // מגדירים ידנית דרך ref ומנגנים.
  const attach = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return;
    el.muted = true;
    el.defaultMuted = true;
    el.play().catch(() => {
      /* אם הדפדפן בכל זאת חסם, נשאר פוסטר */
    });
  }, []);

  if (!video || reduced) {
    return <img src={poster} alt={alt} loading="lazy" className={className} />;
  }

  return (
    <video
      ref={attach}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      aria-label={alt || undefined}
    >
      {videoWebm && <source src={videoWebm} type="video/webm" />}
      <source src={video} type="video/mp4" />
    </video>
  );
};

export default AmbientMedia;
