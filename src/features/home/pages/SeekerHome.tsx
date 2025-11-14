// FILE: src/features/home/pages/SeekerHome.tsx
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "../../../components/Icon";
import { BottomMenu } from "../../../components/BottomMenu";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import { BookingStatusBadge } from "../../../components/BookingStatusBadge";
import {
  createSeekerBookingRequest,
  getMe,
  getSeekerBookingRequests,
  getSeekerDorms,
  resolveMediaUrl,
} from "../../../lib/api";
import type {
  AuthenticatedUser,
  BookingRequest,
  DormRoom,
  OwnerDorm,
} from "../../../lib/types";
import { formatCurrency, formatDate, formatDateRange } from "../../../lib/format";

type ServiceKey = "has_room_service" | "has_electricity" | "has_water" | "has_internet";

const serviceFlags: { key: ServiceKey; label: string }[] = [
  { key: "has_room_service", label: "Room Service" },
  { key: "has_electricity", label: "Electricity" },
  { key: "has_water", label: "Water" },
  { key: "has_internet", label: "Internet" },
];

type BookingModalState = {
  dorm: OwnerDorm;
  room: DormRoom;
};

type NotificationEntry = {
  id: string;
  bookingId: number;
  dormName: string;
  status: BookingRequest["status"];
  respondedAt?: string | null;
};

function deriveNotificationMessage(notification: NotificationEntry) {
  switch (notification.status) {
    case "APPROVED":
      return `Request for “${notification.dormName}” approved`;
    case "DECLINED":
      return `Request for “${notification.dormName}” declined`;
    case "CANCELLED":
      return `Request for “${notification.dormName}” cancelled`;
    default:
      return `Request for “${notification.dormName}” updated`;
  }
}

export function SeekerHome() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [userError, setUserError] = useState<string | null>(null);

  const [dorms, setDorms] = useState<OwnerDorm[]>([]);
  const [loadingDorms, setLoadingDorms] = useState(true);
  const [dormError, setDormError] = useState<string | null>(null);

  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  const [bookingModal, setBookingModal] = useState<BookingModalState | null>(null);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedDormId, setSelectedDormId] = useState<number | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    getMe()
      .then((data) => {
        if (!active) return;
        setUser(data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setUserError(error instanceof Error ? error.message : "Failed to load your profile.");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoadingDorms(true);
    setDormError(null);

    getSeekerDorms({ is_active: true })
      .then((data) => {
        if (!active) return;
        const visibleDorms = data.filter((dorm) => dorm.is_active);
        setDorms(visibleDorms);
        setSelectedDormId((prev) => {
          if (prev && visibleDorms.some((dorm) => dorm.id === prev)) {
            return prev;
          }
          return visibleDorms[0]?.id ?? null;
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setDormError(error instanceof Error ? error.message : "Unable to load dorm listings.");
      })
      .finally(() => {
        if (!active) return;
        setLoadingDorms(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setRequestsLoading(true);
    setRequestsError(null);

    getSeekerBookingRequests()
      .then((data) => {
        if (!active) return;
        setBookingRequests(data);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setRequestsError(error instanceof Error ? error.message : "Unable to load booking requests.");
      })
      .finally(() => {
        if (!active) return;
        setRequestsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const suggestionDorms = useMemo(() => dorms.slice(0, 8), [dorms]);

  const notifications = useMemo(() => {
    const list: NotificationEntry[] = bookingRequests
      .filter((request) => request.status !== "PENDING")
      .map((request) => {
        const idParts = [request.id, request.status, request.responded_at ?? ""];
        const id = idParts.join(":");
        return {
          id,
          bookingId: request.id,
          dormName: request.dorm_summary?.name ?? "Dorm",
          status: request.status,
          respondedAt: request.responded_at,
        } satisfies NotificationEntry;
      });

    return list.filter((item) => !dismissedNotifications.has(item.id));
  }, [bookingRequests, dismissedNotifications]);

  const activeDorms = useMemo(() => dorms, [dorms]);

  const bookingDisabledReason = useMemo(() => {
    if (!bookingModal) return null;
    if (!user) {
      return "Please sign in to request a booking.";
    }
    if (!user.full_name || !user.email || !user.phone) {
      return "Complete your profile with your name, email, and phone to request a booking.";
    }
    if (!checkIn || !checkOut) {
      return "Select your check-in and check-out dates.";
    }
    return null;
  }, [bookingModal, user, checkIn, checkOut]);

  function openBookingModal(dorm: OwnerDorm, room: DormRoom) {
    setBookingModal({ dorm, room });
    setCheckIn("");
    setCheckOut("");
    setBookingError(null);
    setSuccessMessage(null);
  }

  function closeBookingModal() {
    setBookingModal(null);
    setBookingError(null);
  }

  async function handleBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bookingModal || bookingDisabledReason) return;
    if (!user) return;

    setBookingSubmitting(true);
    setBookingError(null);

    try {
      await createSeekerBookingRequest({
        dorm: bookingModal.dorm.id,
        room: bookingModal.room.id,
        seeker_name: user.full_name,
        seeker_email: user.email,
        seeker_phone: user.phone,
        check_in: checkIn,
        check_out: checkOut,
      });
      closeBookingModal();
      setSuccessMessage("Booking request sent! We'll notify you when the owner responds.");
      const [dormData, requestData] = await Promise.all([
        getSeekerDorms({ is_active: true }),
        getSeekerBookingRequests(),
      ]);
      const visibleDorms = dormData.filter((dorm) => dorm.is_active);
      setDorms(visibleDorms);
      setSelectedDormId((prev) => {
        if (prev && visibleDorms.some((dorm) => dorm.id === prev)) {
          return prev;
        }
        return visibleDorms[0]?.id ?? null;
      });
      setBookingRequests(requestData);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Unable to submit your request.");
    } finally {
      setBookingSubmitting(false);
    }
  }

  function handleSuggestionClick(dormId: number) {
    setSelectedDormId(dormId);
    const section = document.getElementById(`dorm-${dormId}`);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleDismissNotification(id: string) {
    setDismissedNotifications((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  return (
    <>
      <div className="space-y-8 pb-24">
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--brand)]/10">
                <Icon name="home" className="h-6 w-6 text-[color:var(--brand)]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-[color:var(--ink)]">Find your next dorm</h1>
                <p className="text-sm text-gray-500">
                  Explore available dorms, request bookings, and track your requests in one place.
                </p>
              </div>
            </div>
            {userError ? <FeedbackMessage variant="error" message={userError} /> : null}
            {successMessage ? <FeedbackMessage variant="success" message={successMessage} /> : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="relative rounded-full border border-gray-200 p-3 text-gray-500 transition hover:text-[color:var(--brand)]"
              aria-label="View notifications"
            >
              <Icon name="bell" className="h-5 w-5" />
              {notifications.length > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[color:var(--brand)] px-1 text-xs font-semibold text-white">
                  {notifications.length}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 z-20 mt-2 w-72 space-y-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[color:var(--ink)]">Notifications</p>
                  <button
                    type="button"
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => setNotificationsOpen(false)}
                  >
                    Close
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-gray-500">No new notifications.</p>
                ) : (
                  <ul className="space-y-2 text-sm text-gray-600">
                    {notifications.map((notification) => (
                      <li
                        key={notification.id}
                        className="flex items-start justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3"
                      >
                        <div>
                          <p className="font-medium text-[color:var(--ink)]">
                            {deriveNotificationMessage(notification)}
                          </p>
                          {notification.respondedAt ? (
                            <p className="text-xs text-gray-500">{formatDate(notification.respondedAt)}</p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          className="text-xs text-gray-400 hover:text-gray-600"
                          onClick={() => handleDismissNotification(notification.id)}
                        >
                          Dismiss
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
        </header>

        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Suggested dorms</p>
              <h2 className="text-lg font-semibold text-[color:var(--ink)]">Take a look around</h2>
            </div>
          </header>

          {loadingDorms ? (
            <div className="flex items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
              Loading dorms...
            </div>
          ) : dormError ? (
            <FeedbackMessage variant="error" message={dormError} />
          ) : suggestionDorms.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
              No dorms are visible yet. Check back soon!
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {suggestionDorms.map((dorm) => (
                <button
                  key={dorm.id}
                  type="button"
                  onClick={() => handleSuggestionClick(dorm.id)}
                  className={`min-w-[220px] rounded-2xl border px-4 pb-4 pt-3 text-left transition hover:shadow-md ${
                    selectedDormId === dorm.id ? "border-[color:var(--brand)] shadow" : "border-gray-200"
                  }`}
                >
                  <div className="mb-3 flex h-36 w-full items-center justify-center rounded-xl bg-[color:var(--brand)]/10 text-[color:var(--brand)]">
                    <Icon name="building" className="h-8 w-8" />
                  </div>
                  <p className="text-sm font-semibold text-[color:var(--ink)]">{dorm.name}</p>
                  {dorm.property_detail?.location ? (
                    <p className="text-xs text-gray-500">{dorm.property_detail.location}</p>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-[color:var(--ink)]">All dorm listings</h2>
          {loadingDorms ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Loading dorms...
            </div>
          ) : dormError ? (
            <FeedbackMessage variant="error" message={dormError} />
          ) : activeDorms.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              No dorms are available at the moment. Please check back later.
            </div>
          ) : (
            <div className="space-y-8">
              {activeDorms.map((dorm) => {
                const coverPhotoUrl = resolveMediaUrl(dorm.cover_photo);

                return (
                  <article
                    key={dorm.id}
                    id={`dorm-${dorm.id}`}
                    className={`space-y-6 rounded-3xl border bg-white p-6 shadow-sm transition ${
                      selectedDormId === dorm.id ? "border-[color:var(--brand)]/60" : "border-gray-200"
                    }`}
                  >
                  <header className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold text-[color:var(--ink)]">{dorm.name}</h3>
                        {dorm.property_detail ? (
                          <p className="text-sm text-gray-500">
                            {dorm.property_detail.name}
                            {dorm.property_detail.location ? ` • ${dorm.property_detail.location}` : ""}
                          </p>
                        ) : null}
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Open for bookings
                      </span>
                    </div>
                    {dorm.description ? (
                      <p className="text-sm text-gray-600">{dorm.description}</p>
                    ) : null}
                  </header>

                  {coverPhotoUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-gray-100">
                      <img
                        src={coverPhotoUrl}
                        alt={`${dorm.name} cover`}
                        className="h-56 w-full object-cover"
                      />
                    </div>
                  ) : null}

                  {dorm.amenities?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {dorm.amenities.map((amenity) => (
                        <span
                          key={amenity}
                          className="rounded-full bg-[color:var(--brand)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--brand)]"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {serviceFlags.map((service) => (
                      <div
                        key={service.key}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${
                          dorm[service.key] ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500"
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 rounded-full ${dorm[service.key] ? "bg-emerald-500" : "bg-gray-300"}`} />
                        {service.label}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800">Dorm gallery</h4>
                    {dorm.images && dorm.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        {dorm.images.map((image) => {
                          const imageUrl = resolveMediaUrl(image.image);
                          if (!imageUrl) {
                            return null;
                          }

                          return (
                            <div key={image.id} className="overflow-hidden rounded-xl border border-gray-200">
                              <img
                                src={imageUrl}
                                alt={image.caption ?? `${dorm.name} image`}
                                className="h-32 w-full object-cover"
                              />
                              {image.caption ? (
                                <p className="truncate px-2 pb-2 pt-1 text-[10px] text-gray-600">{image.caption}</p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No photos added yet.</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-800">Available rooms</h4>
                      <p className="text-xs text-gray-500">
                        Click request to start your booking. Availability updates in real-time.
                      </p>
                    </div>

                    {dorm.rooms && dorm.rooms.length > 0 ? (
                      <div className="space-y-4">
                        {dorm.rooms.map((room) => (
                          <div key={room.id} className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-base font-semibold text-[color:var(--ink)]">{room.name}</p>
                                <p className="text-xs text-gray-500">
                                  {room.room_type}
                                  {room.capacity ? ` • Sleeps ${room.capacity}` : ""}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                                  {formatCurrency(room.price_per_month || "0")}
                                </span>
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                                  {room.available_units}/{room.total_units} available
                                </span>
                                <span
                                  className={`rounded-full px-3 py-1 ${
                                    room.is_available ? "bg-emerald-50 text-emerald-700" : "bg-gray-200 text-gray-600"
                                  }`}
                                >
                                  {room.is_available ? "Open" : "Unavailable"}
                                </span>
                              </div>
                            </div>

                            {room.description ? (
                              <p className="text-sm text-gray-600">{room.description}</p>
                            ) : null}

                            {room.images && room.images.length > 0 ? (
                              <div className="grid grid-cols-3 gap-3">
                                {room.images.map((image) => {
                                  const imageUrl = resolveMediaUrl(image.image);
                                  if (!imageUrl) {
                                    return null;
                                  }

                                  return (
                                    <div key={image.id} className="overflow-hidden rounded-xl border border-gray-200">
                                      <img
                                        src={imageUrl}
                                        alt={image.caption ?? `${room.name} image`}
                                        className="h-24 w-full object-cover"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            ) : null}

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => openBookingModal(dorm, room)}
                                disabled={!room.is_available || room.available_units === 0}
                                className="rounded-full bg-[color:var(--brand)] px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-gray-300"
                              >
                                Request booking
                              </button>
                              {!room.is_available || room.available_units === 0 ? (
                                <span className="text-xs text-gray-500">Currently fully booked</span>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No rooms published yet.</p>
                    )}
                  </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--ink)]">My booking requests</h2>
              <p className="text-sm text-gray-500">Track each request from pending to approved or declined.</p>
            </div>
          </div>

          {requestsLoading ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Loading your requests...
            </div>
          ) : requestsError ? (
            <FeedbackMessage variant="error" message={requestsError} />
          ) : bookingRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              You haven’t requested any bookings yet. Tap “Request booking” on a room to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {bookingRequests.map((request) => (
                <div key={request.id} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--ink)]">
                        {request.dorm_summary?.name ?? "Dorm"}
                      </p>
                      {request.dorm_summary?.property_name ? (
                        <p className="text-xs text-gray-500">{request.dorm_summary.property_name}</p>
                      ) : null}
                      <p className="text-xs text-gray-500">Stay: {formatDateRange(request.check_in, request.check_out)}</p>
                    </div>
                    <BookingStatusBadge status={request.status} />
                  </div>

                  <div className="grid gap-1 text-xs text-gray-500">
                    <span>Requested on {formatDate(request.created_at) ?? "—"}</span>
                    {request.responded_at ? (
                      <span>Owner responded {formatDate(request.responded_at)}</span>
                    ) : (
                      <span>Awaiting owner response</span>
                    )}
                    {request.owner_note ? (
                      <span className="text-gray-600">Owner note: {request.owner_note}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomMenu />

      {bookingModal ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl">
            <header className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Booking request</p>
                <h3 className="text-lg font-semibold text-[color:var(--ink)]">
                  {bookingModal.room.name} • {bookingModal.dorm.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeBookingModal}
                className="text-gray-400 transition hover:text-gray-600"
                aria-label="Close"
              >
                <Icon name="close" className="h-5 w-5" />
              </button>
            </header>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-gray-700">Check-in</span>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(event) => setCheckIn(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
                    required
                  />
                </label>
                <label className="space-y-1 text-sm">
                  <span className="font-medium text-gray-700">Check-out</span>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn || undefined}
                    onChange={(event) => setCheckOut(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
                    required
                  />
                </label>
              </div>

              {bookingDisabledReason ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  {bookingDisabledReason}
                </div>
              ) : null}
              {bookingError ? <FeedbackMessage variant="error" message={bookingError} /> : null}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeBookingModal}
                  className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(bookingDisabledReason) || bookingSubmitting}
                  className="flex-1 rounded-full bg-[color:var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {bookingSubmitting ? "Sending..." : "Send request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
