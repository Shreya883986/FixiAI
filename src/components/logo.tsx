import logoSrc from "@/assets/snapcut-logo.png";

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return <img src={logoSrc} alt="SnapCut AI" className={className} />;
}

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src={logoSrc}
        alt="SnapCut AI"
        style={{ width: size, height: size }}
        className="rounded-lg"
      />
      <span className="text-xl font-bold tracking-tight">
        Snap<span className="text-gradient">Cut</span>
        <span className="ml-1 text-xs font-medium text-muted-foreground align-top">AI</span>
      </span>
    </div>
  );
}
