"use client";

interface TaoIconProps {
  color?: string;
  size?: string;
  className?: string;
}

export default function TaoIcon({
  color = "currentColor",
  size = "w-2.5 h-2.5",
  className = "",
}: TaoIconProps) {
  return (
    <span
      className={`${size} inline-block ${className}`}
      style={{
        maskImage: "url(/tao.png)",
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: "url(/tao.png)",
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        backgroundColor: color === "currentColor" ? "currentColor" : color,
      }}
    />
  );
}
