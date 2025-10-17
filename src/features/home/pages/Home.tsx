import { Icon, type IconName } from "../../../components/Icon";

const quickActions: Array<{
  label: string;
  description: string;
  icon: IconName;
  accent: string;
}> = [
  { label: "Discover", description: "Curated dorms nearby", icon: "sparkles", accent: "from-emerald-400 to-lime-500" },
  { label: "Saved", description: "Your shortlist", icon: "heart", accent: "from-pink-400 to-rose-500" },
  { label: "Messages", description: "Chat with owners", icon: "messages-square", accent: "from-sky-400 to-blue-500" },
];

const highlights = [
  {
    title: "Featured stay: Aurora Residences",
    description: "5-minute walk to campus • Private study lounges • Smart access",
    tags: ["New", "Verified owner", "Limited rooms"],
  },
  {
    title: "UniConnect Insider Tips",
    description: "Learn how to stand out in your applications and secure your perfect dorm fast.",
    tags: ["Guide", "3 min read"],
  },
];

export function Home() {
  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="space-y-1">
          <p className="text-sm text-gray-400">Good evening 👋</p>
          <h1 className="text-3xl font-semibold text-[color:var(--ink)]">Let's find your next stay</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm text-gray-500 shadow-inner">
            <div className="flex items-center gap-3">
              <Icon name="search" className="text-gray-400" />
              <span>Search dorms, cities, or owners...</span>
            </div>
          </div>
          <button aria-label="favorites" className="rounded-full bg-gray-100 p-3 text-gray-500">
            <Icon name="heart" />
          </button>
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[color:var(--brand)] via-emerald-500 to-sky-500 p-6 text-white shadow-xl">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.35em] text-white/70">UniConnect Match</p>
          <h2 className="text-2xl font-semibold">Personalized dorm picks updated daily</h2>
          <p className="text-sm text-white/80">
            Complete your profile to unlock handpicked spaces based on your lifestyle, budget, and study preferences.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-white/80">
          <span className="rounded-full bg-white/20 px-3 py-1">Verified owners</span>
          <span className="rounded-full bg-white/20 px-3 py-1">Roommate matching</span>
          <span className="rounded-full bg-white/20 px-3 py-1">Flexible leases</span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {quickActions.map((action) => (
          <button
            key={action.label}
            className="group overflow-hidden rounded-3xl bg-white p-5 text-left shadow-xl transition hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] focus:ring-offset-2"
            type="button"
          >
            <div className={`mb-5 inline-flex items-center gap-3 rounded-full bg-gradient-to-br ${action.accent} px-4 py-2 text-sm font-semibold text-white shadow`}> 
              <Icon name={action.icon} className="h-5 w-5" />
              {action.label}
            </div>
            <p className="text-sm text-gray-500">{action.description}</p>
          </button>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[color:var(--ink)]">What's new</h2>
          <button className="text-sm font-medium text-[color:var(--brand)]">View all</button>
        </div>
        <div className="space-y-4">
          {highlights.map((highlight) => (
            <article key={highlight.title} className="rounded-3xl bg-white p-5 shadow-md">
              <h3 className="text-lg font-semibold text-[color:var(--ink)]">{highlight.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{highlight.description}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[color:var(--brand)]">
                {highlight.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-[color:var(--brand)]/10 px-3 py-1 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
