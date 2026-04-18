"use client";

export function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "4px",
  className = "",
}: {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}) {
  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      <div
        aria-hidden="true"
        className={className}
        style={{
          width,
          height,
          borderRadius,
          background: "var(--theme-bg-secondary)",
          animation: "skeleton-pulse 1.5s ease-in-out infinite",
          display: "block",
        }}
      />
    </>
  );
}
