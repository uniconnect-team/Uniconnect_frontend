// FILE: src/features/home/pages/OwnerDashboard.tsx
import { BottomMenu } from "../../../components/BottomMenu";

export function OwnerDashboard() {
  return (
    <>
      <div className="space-y-6 pb-20">
        <header className="flex items-center gap-3">
          <h1 className="text-lg font-semibold">Owner Dashboard</h1>
        </header>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-sm text-gray-400">
            You&apos;re all set! Manage your dorm listings from here soon.
          </p>
        </div>
      </div>
      
      <BottomMenu />
    </>
  );
}