import { Icon } from "../../../components/Icon";

export function OwnerDashboard() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <button aria-label="menu" className="p-2 rounded-full bg-gray-100">
          <Icon name="menu" />
        </button>
        <h1 className="text-lg font-semibold">Owner Dashboard</h1>
        <span className="w-10" aria-hidden="true" />
      </header>
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm text-gray-400">
          You&apos;re all set! Manage your dorm listings from here soon.
        </p>
      </div>
    </div>
  );
}
