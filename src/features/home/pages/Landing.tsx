import { useNavigate } from "react-router-dom";
import { Icon } from "../../../components/Icon";

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-[70vh] justify-between gap-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[rgba(42,194,74,0.18)] via-white to-[#f3fff6] px-8 py-12 shadow-lg">
        <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-[rgba(42,194,74,0.25)] blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-24 -left-10 h-40 w-40 rounded-full bg-[rgba(42,194,74,0.25)] blur-3xl" aria-hidden="true" />
        <div className="relative space-y-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-sm font-medium text-[color:var(--brand)] shadow-sm">
            <Icon name="sparkles" className="h-4 w-4" />
            Welcome to
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-[color:var(--ink)]">UniConnect</h1>
          <p className="text-base leading-relaxed text-[color:var(--muted)]">
            Discover the easiest way to connect dorm seekers with trusted property owners.
            UniConnect brings vibrant campus living to your fingertips.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-4 rounded-2xl border border-[rgba(42,194,74,0.15)] bg-white/90 p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-[rgba(42,194,74,0.8)]">Why UniConnect?</p>
          <ul className="space-y-3 text-sm text-[color:var(--muted)]">
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(42,194,74,0.12)] text-[color:var(--brand)]">
                <Icon name="users" className="h-4 w-4" />
              </span>
              <span>Curated experiences for both dorm seekers and property owners.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(42,194,74,0.12)] text-[color:var(--brand)]">
                <Icon name="globe" className="h-4 w-4" />
              </span>
              <span>Explore listings tailored to your campus community with ease.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(42,194,74,0.12)] text-[color:var(--brand)]">
                <Icon name="building" className="h-4 w-4" />
              </span>
              <span>Manage properties effortlessly and welcome new residents confidently.</span>
            </li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => navigate("/choose-role")}
          className="group flex w-full items-center justify-between rounded-full bg-[color:var(--brand)] px-6 py-4 text-white shadow-lg transition-transform duration-150 ease-out hover:translate-y-[-1px] focus:outline-none focus:ring-4 focus:ring-[rgba(42,194,74,0.35)]"
        >
          <span className="text-base font-semibold">Get Started</span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition-transform duration-150 group-hover:translate-x-1">
            <Icon name="chevron-left" className="h-5 w-5 rotate-180" />
          </span>
        </button>
      </section>
    </div>
  );
}
