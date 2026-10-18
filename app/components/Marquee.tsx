type MarqueeProps = {
  items: string[];
  reverse?: boolean;
  className?: string;
};

export default function Marquee({
  items,
  reverse = false,
  className = "",
}: MarqueeProps) {
  const animation = reverse ? "animate-marquee-reverse" : "animate-marquee";
  const doubled = [...items, ...items];

  return (
    <div
      className={`group relative mask-fade-x overflow-hidden border-y border-white/10 bg-black py-5 ${className}`}
    >
      <div
        className={`flex w-max gap-12 ${animation} group-hover:[animation-play-state:paused]`}
      >
        {doubled.map((item, idx) => (
          <div
            key={`${item}-${idx}`}
            className="flex shrink-0 items-center gap-12 whitespace-nowrap"
          >
            <span className="text-2xl font-semibold tracking-tight text-white/70 sm:text-3xl">
              {item}
            </span>
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full bg-white/40"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
