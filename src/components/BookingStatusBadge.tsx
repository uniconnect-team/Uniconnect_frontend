import type { BookingRequest } from "../lib/types";

const styles: Record<BookingRequest["status"], string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  DECLINED: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-gray-200 text-gray-600",
};

export function BookingStatusBadge({ status }: { status: BookingRequest["status"] }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {status}
    </span>
  );
}
