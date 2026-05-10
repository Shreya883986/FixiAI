import logoSrc from "@/assets/fixi-logo.png";

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return <img src={logoSrc} alt="Fixi AI" className={className} />;
}

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logoSrc}
        alt="Fixi AI"
        style={{ width: size, height: size }}
        className="rounded-lg"
      />
      <span className="text-xl font-bold tracking-tight">
        Fixi<span className="text-gradient">Ai</span>
      </span>
    </div>
  );
}
