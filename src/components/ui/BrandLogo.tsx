import Image from "next/image";
import Link from "next/link";

interface BrandLogoProps {
  href?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export function BrandLogo({
  href,
  size = "md",
  showText = true,
  className = "",
}: BrandLogoProps) {
  const dim = size === "sm" ? 28 : size === "lg" ? 36 : 32;
  const textClass =
    size === "lg"
      ? "text-[22px] font-extrabold tracking-[-0.03em]"
      : "text-[20px] font-extrabold tracking-[-0.03em]";

  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo.png"
        alt="Logo Impas"
        width={dim}
        height={dim}
        className="object-contain shrink-0"
        priority
      />
      {showText && (
        <span className={`${textClass} text-[#0B1312]`}>Impas</span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center rounded-lg focus-visible:outline-2"
      >
        {content}
      </Link>
    );
  }

  return content;
}
