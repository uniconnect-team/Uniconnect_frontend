import { Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="min-h-screen bg-white text-[color:var(--ink)]">
      <div className="mx-auto max-w-md px-6 pt-0 pb-24 overflow-y-visible">
        <Outlet />
      </div>
    </div>
  );
}

