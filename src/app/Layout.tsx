import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-32 h-72 w-72 rounded-full bg-[color:var(--brand)]/30 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-[-120px] right-[-80px] h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" aria-hidden="true" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-6 py-16">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-white/80">
            UniConnect
          </div>
          <p className="mt-3 text-sm text-white/60">Housing that understands students and campus life.</p>
        </div>
        <div className="w-full rounded-3xl bg-white/95 p-8 text-[color:var(--ink)] shadow-2xl backdrop-blur-xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
