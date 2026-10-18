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
      className={`pointer-events-none absolute inset-0 ${pattern} ${className}`}
      style={{ animation: "grid-pan 30s linear infinite" }}
    />
  );
}
