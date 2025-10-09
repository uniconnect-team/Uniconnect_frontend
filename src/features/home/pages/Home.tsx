import { Icon } from "../../../components/Icon";

export function Home() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <button aria-label="menu" className="p-2 rounded-full bg-gray-100">
          <Icon name="menu" />
        </button>
        <input
          className="flex-1 h-10 rounded-full bg-gray-100 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]"
          placeholder="Looking for a dorm?"
          type="search"
        />
        <button aria-label="favorites" className="p-2 rounded-full bg-gray-100">
          <Icon name="heart" />
        </button>
      </header>
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-gray-400">No content yet. Start exploring soon!</p>
      </div>
    </div>
  );
}
