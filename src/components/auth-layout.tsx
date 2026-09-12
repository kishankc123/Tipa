import { TipaLogo } from "@/components/tipa-logo";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <div className="relative flex flex-col items-center justify-center gap-6 overflow-hidden bg-[radial-gradient(circle_at_30%_20%,#1f2937,transparent_60%),radial-gradient(circle_at_80%_80%,#111827,transparent_55%),linear-gradient(160deg,#0b0f19,#111827)] px-8 py-12 text-center md:w-1/2 md:py-0">
        <TipaLogo className="size-32 drop-shadow-[0_8px_24px_rgba(255,198,26,0.25)] md:size-40" />
        <div className="space-y-1.5">
          <p className="text-2xl font-bold tracking-tight text-white">TIPA</p>
          <p className="text-sm text-white/60">
            Stock and inventory recording, simplified.
          </p>
        </div>
        <p className="mt-2 text-xs font-medium tracking-wide text-white/40 uppercase">
          A subordinate product of Chanco
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 md:w-1/2 md:p-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
