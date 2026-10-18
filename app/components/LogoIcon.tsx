import Image from "next/image";

export default function LogoIcon({
  className = "h-7 w-7",
}: {
  className?: string;
}) {
  return (
    <Image
      src="/lawbite-logo.jpeg"
      alt=""
      width={1254}
      height={1254}
      aria-hidden
      className={`${className} shrink-0 mix-blend-screen`}
    />
  );
}
