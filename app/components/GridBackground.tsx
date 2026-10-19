type GridBackgroundProps = {
  variant?: "grid" | "dots";
  className?: string;
};

export default function GridBackground({
  variant = "grid",
  className = "",
}: GridBackgroundProps) {
  const pattern = variant === "dots" ? "bg-dots" : "bg-grid";
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Oversized by one full loop (120px) so the transform stays seamless. */}
      <div className={`grid-pan-layer absolute -inset-[120px] ${pattern}`} />
    </div>
  );
}
