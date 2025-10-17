import { useNavigate } from "react-router-dom";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";

const cards: Array<{ label: string; path: string; icon: IconName; description: string; accent: string }> = [
  {
    label: "Dormitory Seeker",
    path: "/login/seeker",
    icon: "bed",
    description: "Browse curated dorms, compare amenities, and secure your next home in minutes.",
    accent: "from-emerald-400 to-lime-500",
  },
  {
    label: "Dormitory Owner",
    path: "/login/owner",
    icon: "building",
    description: "Showcase your spaces, manage bookings, and connect with verified student tenants.",
    accent: "from-sky-400 to-blue-500",
  },
];

export function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      <div className="space-y-3 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/50 px-4 py-1 text-xs font-medium uppercase tracking-widest text-[color:var(--brand)]">
          <Icon name="sparkles" className="h-4 w-4" /> Welcome to UniConnect
        </span>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-[color:var(--ink)]">Choose your journey</h1>
          <p className="text-sm text-gray-500">
            Sign in as a seeker to find a dorm or as an owner to manage your listings. You can switch roles anytime.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {cards.map((card) => (
          <button
            key={card.path}
            type="button"
            onClick={() => navigate(card.path)}
            className="relative w-full overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl transition hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] focus:ring-offset-2"
          >
            <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${card.accent} opacity-20 blur-3xl`} aria-hidden="true" />
            <div className="flex items-center gap-5">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
                <Icon name={card.icon} className="h-8 w-8" />
              </span>
              <div className="flex-1 space-y-2">
                <p className="text-lg font-semibold text-[color:var(--ink)]">{card.label}</p>
                <p className="text-sm text-gray-500">{card.description}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Icon name="chevron-left" className="h-5 w-5 rotate-180" />
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-3xl bg-gray-50 p-6 text-sm text-gray-500">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[color:var(--brand)] shadow">
            <Icon name="users" />
          </span>
          <div className="space-y-2">
            <p className="text-base font-semibold text-[color:var(--ink)]">New here?</p>
            <p>Create a UniConnect seeker account to access personalized dorm matches and messaging.</p>
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--brand)] px-4 py-2 font-semibold text-white shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--brand)]"
            >
              <Icon name="sparkles" className="h-4 w-4" />
              Create an account
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-gray-400">
        Need help?{' '}
        <a href="#" className="font-medium text-[color:var(--brand)]">
          Contact support
        </a>
      </p>
    </div>
  );
}
