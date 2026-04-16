"use client";

type LeagueMarkProps = {
  color: string;
  size?: number;
  square?: boolean;
  bordered?: boolean;
};

export default function LeagueMark({
  color,
  size = 12,
  square = false,
  bordered = true,
}: LeagueMarkProps) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: square ? 3 : "50%",
        background: color,
        border: bordered ? "1px solid rgba(255,255,255,0.22)" : "none",
        boxShadow: `0 0 0 1px ${color}22`,
        flexShrink: 0,
      }}
    />
  );
}
