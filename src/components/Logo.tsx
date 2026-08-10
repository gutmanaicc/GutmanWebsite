import { useState } from "react";

type Props = {
  className?: string;
  variant?: "default" | "white";
  height?: number;
};

const Logo = ({ className = "", variant = "default", height = 32 }: Props) => {
  const sources =
    variant === "white"
      ? ["/brand/logo-white.png", "/brand/logo-cutout.svg"]
      : ["/brand/logo-cutout.png", "/brand/logo-cutout.svg"];
  const [srcIndex, setSrcIndex] = useState(0);

  if (srcIndex >= sources.length) {
    return (
      <span
        className={`inline-flex items-center font-bold tracking-tight ${variant === "white" ? "text-white" : "text-brand"} ${className}`}
        style={{ fontSize: height * 0.75 }}
        aria-label="Gutman"
      >
        Gutman
      </span>
    );
  }

  return (
    <img
      src={sources[srcIndex]}
      alt="Gutman"
      height={height}
      className={`h-auto w-auto object-contain ${className}`}
      onError={() => setSrcIndex((i) => i + 1)}
    />
  );
};

export default Logo;
