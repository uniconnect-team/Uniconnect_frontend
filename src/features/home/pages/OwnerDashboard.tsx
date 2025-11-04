// FILE: src/features/home/pages/OwnerDashboard.tsx
import { BottomMenu } from "../../../components/BottomMenu";
import { FeedbackMessage } from "../../../components/FeedbackMessage";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "../../../components/Icon";
import {
  ApiError,
  createDormImage,
  createDormRoom,
  createDormRoomImage,
  createOwnerDorm,
  deleteDormImage,
  deleteDormRoom,
  deleteDormRoomImage,
  deleteOwnerDorm,
  getMe,
  getOwnerBookingRequests,
  getOwnerDorms,
  updateBookingRequest,
  updateDormRoom,
  updateOwnerDorm,
} from "../../../lib/api";
import type {
  AuthenticatedUser,
  BookingRequest,
  BookingRequestFilters,
  DormRequestBody,
  DormRoom,
  DormRoomRequestBody,
  OwnerDorm,
  OwnerProperty,
} from "../../../lib/types";

const roomTypeOptions: { value: DormRoom["room_type"]; label: string }[] = [
  { value: "SINGLE", label: "Single" },
  { value: "DOUBLE", label: "Double" },
  { value: "TRIPLE", label: "Triple" },
  { value: "QUAD", label: "Quad" },
  { value: "STUDIO", label: "Studio" },
  { value: "OTHER", label: "Other" },
];

const bookingStatusOptions: BookingRequest["status"][] = [
  "PENDING",
  "APPROVED",
  "DECLINED",
  "CANCELLED",
];

type DormFormState = {
  name: string;
  property: number | "";
  description: string;
  amenitiesInput: string;
  has_room_service: boolean;
  has_electricity: boolean;
  has_water: boolean;
  has_internet: boolean;
  is_active: boolean;
  cover_photo: File | null;
};

type RoomFormState = {
  name: string;
  room_type: DormRoom["room_type"];
  capacity: number | "";
  price_per_month: string;
  total_units: number | "";
  available_units: number | "";
  is_available: boolean;
  description: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

function formatCurrency(value: string | number) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numericValue)) {
    return typeof value === "string" ? value : "";
  }

  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateRange(start?: string | null, end?: string | null) {
  const startLabel = formatDate(start);
  const endLabel = formatDate(end);

  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`;
  }

  return startLabel ?? endLabel ?? "Dates not specified";
}

function DormForm({
  properties,
  initialValue,
  existingCover,
  submitting,
  error,
  mode,
  onSubmit,
  onCancel,
}: {
  properties: OwnerProperty[];
  initialValue?: {
    name: string;
    property: number;
    description?: string | null;
    amenities: string[];
    has_room_service: boolean;
    has_electricity: boolean;
    has_water: boolean;
    has_internet: boolean;
    is_active: boolean;
  };
  existingCover?: string | null;
  submitting: boolean;
  error?: string | null;
  mode: "create" | "edit";
  onSubmit: (values: DormFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<DormFormState>(() => ({
    name: initialValue?.name ?? "",
    property: initialValue?.property ?? properties[0]?.id ?? "",
    description: initialValue?.description ?? "",
    amenitiesInput: initialValue?.amenities?.join(", ") ?? "",
    has_room_service: initialValue?.has_room_service ?? false,
    has_electricity: initialValue?.has_electricity ?? false,
    has_water: initialValue?.has_water ?? false,
    has_internet: initialValue?.has_internet ?? false,
    is_active: initialValue?.is_active ?? true,
    cover_photo: null,
  }));

  useEffect(() => {
    setForm({
      name: initialValue?.name ?? "",
      property: initialValue?.property ?? properties[0]?.id ?? "",
      description: initialValue?.description ?? "",
      amenitiesInput: initialValue?.amenities?.join(", ") ?? "",
      has_room_service: initialValue?.has_room_service ?? false,
      has_electricity: initialValue?.has_electricity ?? false,
      has_water: initialValue?.has_water ?? false,
      has_internet: initialValue?.has_internet ?? false,
      is_active: initialValue?.is_active ?? true,
      cover_photo: null,
    });
  }, [initialValue, properties]);

  const isValid = form.name.trim().length > 0 && form.property !== "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="dorm-name">
            Dorm Name
          </label>
          <input
            id="dorm-name"
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
            placeholder="e.g. Sunrise Residences"
            required
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="dorm-property">
            Property
          </label>
          <select
            id="dorm-property"
            value={form.property}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, property: event.target.value ? Number(event.target.value) : "" }))
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
          >
            <option value="" disabled>
              Select a property
            </option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name} — {property.location}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="dorm-description">
            Description
          </label>
          <textarea
            id="dorm-description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="w-full min-h-[100px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
            placeholder="Describe this dorm's highlights"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="dorm-amenities">
            Amenity Tags
          </label>
          <input
            id="dorm-amenities"
            type="text"
            value={form.amenitiesInput}
            onChange={(event) => setForm((prev) => ({ ...prev, amenitiesInput: event.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
            placeholder="Separate amenities with commas"
          />
          <p className="text-xs text-gray-500">Example: Wi-Fi, Study Lounge, Laundry</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.has_room_service}
              onChange={(event) => setForm((prev) => ({ ...prev, has_room_service: event.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
            />
            Room Service
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.has_electricity}
              onChange={(event) => setForm((prev) => ({ ...prev, has_electricity: event.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
            />
            Electricity Included
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.has_water}
              onChange={(event) => setForm((prev) => ({ ...prev, has_water: event.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
            />
            Water Included
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
            <input
              type="checkbox"
              checked={form.has_internet}
              onChange={(event) => setForm((prev) => ({ ...prev, has_internet: event.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
            />
            Internet Provided
          </label>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
          />
          Dorm is active and visible to seekers
        </label>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700" htmlFor="dorm-cover">
            Cover Photo {mode === "edit" && existingCover ? "(leave blank to keep current)" : ""}
          </label>
          <input
            id="dorm-cover"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const [file] = Array.from(event.target.files ?? []);
              setForm((prev) => ({ ...prev, cover_photo: file ?? null }));
            }}
            className="w-full rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm"
          />
          {existingCover ? (
            <p className="text-xs text-gray-500">Current cover: {existingCover}</p>
          ) : null}
        </div>
      </div>

      {error ? <FeedbackMessage variant="error" message={error} /> : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || submitting}
          className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] focus:ring-offset-2 ${
            isValid && !submitting
              ? "bg-[color:var(--brand)] text-white"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          {submitting ? "Saving..." : mode === "create" ? "Create Dorm" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

function RoomForm({
  dormName,
  initialRoom,
  submitting,
  error,
  mode,
  onSubmit,
  onCancel,
}: {
  dormName: string;
  initialRoom?: DormRoom;
  submitting: boolean;
  error?: string | null;
  mode: "create" | "edit";
  onSubmit: (values: RoomFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<RoomFormState>(() => ({
    name: initialRoom?.name ?? "",
    room_type: initialRoom?.room_type ?? "SINGLE",
    capacity: initialRoom?.capacity ?? "",
    price_per_month: initialRoom?.price_per_month ?? "",
    total_units: initialRoom?.total_units ?? "",
    available_units: initialRoom?.available_units ?? "",
    is_available: initialRoom?.is_available ?? true,
    description: initialRoom?.description ?? "",
  }));

  useEffect(() => {
    setForm({
      name: initialRoom?.name ?? "",
      room_type: initialRoom?.room_type ?? "SINGLE",
      capacity: initialRoom?.capacity ?? "",
      price_per_month: initialRoom?.price_per_month ?? "",
      total_units: initialRoom?.total_units ?? "",
      available_units: initialRoom?.available_units ?? "",
      is_available: initialRoom?.is_available ?? true,
      description: initialRoom?.description ?? "",
    });
  }, [initialRoom]);

  const availabilityError = useMemo(() => {
    if (form.total_units === "" || form.available_units === "") return null;
    const total = Number(form.total_units);
    const available = Number(form.available_units);
    if (Number.isNaN(total) || Number.isNaN(available)) return null;
    if (available > total) {
      return "Available units cannot exceed total units";
    }
    return null;
  }, [form.available_units, form.total_units]);

  const isValid =
    form.name.trim().length > 0 &&
    form.capacity !== "" &&
    form.total_units !== "" &&
    form.available_units !== "" &&
    !availabilityError;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">{dormName}</p>
          <h3 className="text-base font-semibold">
            {mode === "create" ? "Add New Room" : `Edit Room: ${initialRoom?.name ?? ""}`}
          </h3>
        </div>
        <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <Icon name="close" />
        </button>
      </header>

      <div className="grid gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="room-name">
            Room Name
          </label>
          <input
            id="room-name"
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
            placeholder="e.g. Deluxe Suite"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="room-type">
              Room Type
            </label>
            <select
              id="room-type"
              value={form.room_type}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, room_type: event.target.value as DormRoom["room_type"] }))
              }
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
            >
              {roomTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="room-capacity">
              Capacity
            </label>
            <input
              id="room-capacity"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(event) => setForm((prev) => ({ ...prev, capacity: Number(event.target.value) }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="room-price">
              Price per Month (PHP)
            </label>
            <input
              id="room-price"
              type="number"
              min={0}
              value={form.price_per_month}
              onChange={(event) => setForm((prev) => ({ ...prev, price_per_month: event.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="room-total">
              Total Units
            </label>
            <input
              id="room-total"
              type="number"
              min={0}
              value={form.total_units}
              onChange={(event) => setForm((prev) => ({ ...prev, total_units: Number(event.target.value) }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700" htmlFor="room-available">
              Available Units
            </label>
            <input
              id="room-available"
              type="number"
              min={0}
              value={form.available_units}
              onChange={(event) => setForm((prev) => ({ ...prev, available_units: Number(event.target.value) }))}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
              required
            />
            {availabilityError ? (
              <p className="text-xs text-red-500">{availabilityError}</p>
            ) : null}
          </div>

          <label className="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={form.is_available}
              onChange={(event) => setForm((prev) => ({ ...prev, is_available: event.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
            />
            Room is available for booking
          </label>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="room-description">
            Room Description
          </label>
          <textarea
            id="room-description"
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="w-full min-h-[80px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
            placeholder="Optional details about this room"
          />
        </div>
      </div>

      {error ? <FeedbackMessage variant="error" message={error} /> : null}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || submitting}
          className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] focus:ring-offset-2 ${
            isValid && !submitting
              ? "bg-[color:var(--brand)] text-white"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          {submitting ? "Saving..." : mode === "create" ? "Add Room" : "Save Room"}
        </button>
      </div>
    </form>
  );
}

function BookingStatusBadge({ status }: { status: BookingRequest["status"] }) {
  const styles: Record<BookingRequest["status"], string> = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    DECLINED: "bg-rose-100 text-rose-700",
    CANCELLED: "bg-gray-200 text-gray-600",
  };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {status}
    </span>
  );
}

function BookingRequestCard({
  request,
  onUpdate,
}: {
  request: BookingRequest;
  onUpdate: (id: number, status: BookingRequest["status"], ownerNote: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<BookingRequest["status"]>(request.status);
  const [note, setNote] = useState(request.owner_note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus(request.status);
    setNote(request.owner_note ?? "");
  }, [request.id, request.status, request.owner_note]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onUpdate(request.id, status, note.trim());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[color:var(--ink)]">{request.seeker_name}</p>
          <p className="text-xs text-gray-500">{request.seeker_email} • {request.seeker_phone}</p>
        </div>
        <BookingStatusBadge status={request.status} />
      </div>

      <div className="grid gap-2 text-sm text-gray-600">
        <p>
          <span className="font-medium text-gray-800">Dorm:</span> {request.dorm_summary?.name ?? "—"}
        </p>
        {request.dorm_summary?.property_name ? (
          <p>
            <span className="font-medium text-gray-800">Property:</span> {request.dorm_summary.property_name}
          </p>
        ) : null}
        <p>
          <span className="font-medium text-gray-800">Stay:</span> {formatDateRange(request.check_in, request.check_out)}
        </p>
        {request.responded_at ? (
          <p className="text-xs text-gray-500">Responded {formatDate(request.responded_at)}</p>
        ) : (
          <p className="text-xs text-gray-500">Awaiting response</p>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-500" htmlFor={`status-${request.id}`}>
            Update Status
          </label>
          <select
            id={`status-${request.id}`}
            value={status}
            onChange={(event) => setStatus(event.target.value as BookingRequest["status"])}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
          >
            {bookingStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-gray-500" htmlFor={`note-${request.id}`}>
            Owner Note
          </label>
          <textarea
            id={`note-${request.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="w-full min-h-[80px] rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
            placeholder="Add context for the seeker"
          />
        </div>
      </div>

      {error ? <FeedbackMessage variant="error" message={error} /> : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-[color:var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[color:var(--brand)]/90 focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] focus:ring-offset-2 disabled:opacity-50"
      >
        {submitting ? "Updating..." : "Update Request"}
      </button>
    </form>
  );
}

function DormCard({
  dorm,
  onEdit,
  onDelete,
  onCreateRoom,
  onUpdateRoom,
  onDeleteRoom,
  onUploadDormImage,
  onDeleteDormImage,
  onUploadRoomImage,
  onDeleteRoomImage,
}: {
  dorm: OwnerDorm;
  onEdit: (dorm: OwnerDorm) => void;
  onDelete: (id: number) => Promise<void>;
  onCreateRoom: (dormId: number, values: RoomFormState) => Promise<void>;
  onUpdateRoom: (dormId: number, roomId: number, values: RoomFormState) => Promise<void>;
  onDeleteRoom: (dormId: number, roomId: number) => Promise<void>;
  onUploadDormImage: (dormId: number, file: File, caption: string) => Promise<void>;
  onDeleteDormImage: (dormId: number, imageId: number) => Promise<void>;
  onUploadRoomImage: (dormId: number, roomId: number, file: File, caption: string) => Promise<void>;
  onDeleteRoomImage: (roomId: number, imageId: number) => Promise<void>;
}) {
  const [roomFormMode, setRoomFormMode] = useState<"create" | "edit" | null>(null);
  const [roomFormTarget, setRoomFormTarget] = useState<DormRoom | null>(null);
  const [roomSubmitting, setRoomSubmitting] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [dormImageFile, setDormImageFile] = useState<File | null>(null);
  const [dormImageCaption, setDormImageCaption] = useState("");
  const [dormImageSubmitting, setDormImageSubmitting] = useState(false);
  const [dormImageError, setDormImageError] = useState<string | null>(null);
  const [roomImageStates, setRoomImageStates] = useState<Record<number, {
    file: File | null;
    caption: string;
    submitting: boolean;
    error: string | null;
  }>>({});

  function handleOpenCreateRoom() {
    setRoomFormMode("create");
    setRoomFormTarget(null);
    setRoomError(null);
  }

  function handleEditRoom(room: DormRoom) {
    setRoomFormMode("edit");
    setRoomFormTarget(room);
    setRoomError(null);
  }

  function resetRoomForm() {
    setRoomFormMode(null);
    setRoomFormTarget(null);
    setRoomError(null);
  }

  async function handleRoomFormSubmit(values: RoomFormState) {
    if (!roomFormMode) return;
    setRoomSubmitting(true);
    setRoomError(null);
    try {
      if (roomFormMode === "create") {
        await onCreateRoom(dorm.id, values);
      } else if (roomFormTarget) {
        await onUpdateRoom(dorm.id, roomFormTarget.id, values);
      }
      resetRoomForm();
    } catch (error) {
      setRoomError(getErrorMessage(error));
    } finally {
      setRoomSubmitting(false);
    }
  }

  async function handleDeleteDorm() {
    if (!window.confirm(`Delete dorm "${dorm.name}"? This action cannot be undone.`)) {
      return;
    }
    await onDelete(dorm.id);
  }

  async function handleDormImageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dormImageFile) {
      setDormImageError("Please select an image to upload");
      return;
    }
    setDormImageSubmitting(true);
    setDormImageError(null);
    try {
      await onUploadDormImage(dorm.id, dormImageFile, dormImageCaption.trim());
      setDormImageFile(null);
      setDormImageCaption("");
      const fileInput = event.currentTarget.querySelector("input[type='file']") as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      setDormImageError(getErrorMessage(error));
    } finally {
      setDormImageSubmitting(false);
    }
  }

  function updateRoomImageState(roomId: number, updater: (state: {
    file: File | null;
    caption: string;
    submitting: boolean;
    error: string | null;
  }) => {
    file: File | null;
    caption: string;
    submitting: boolean;
    error: string | null;
  }) {
    setRoomImageStates((prev) => ({
      ...prev,
      [roomId]: updater(
        prev[roomId] ?? {
          file: null,
          caption: "",
          submitting: false,
          error: null,
        },
      ),
    }));
  }

  async function handleRoomImageSubmit(roomId: number, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const state = roomImageStates[roomId] ?? {
      file: null,
      caption: "",
      submitting: false,
      error: null,
    };

    if (!state.file) {
      updateRoomImageState(roomId, (prev) => ({ ...prev, error: "Please select an image" }));
      return;
    }

    updateRoomImageState(roomId, (prev) => ({ ...prev, submitting: true, error: null }));

    try {
      await onUploadRoomImage(dorm.id, roomId, state.file, state.caption.trim());
      updateRoomImageState(roomId, () => ({ file: null, caption: "", submitting: false, error: null }));
      const fileInput = event.currentTarget.querySelector("input[type='file']") as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      updateRoomImageState(roomId, (prev) => ({ ...prev, submitting: false, error: getErrorMessage(error) }));
    }
  }

  const serviceFlags = [
    { label: "Room Service", value: dorm.has_room_service },
    { label: "Electricity", value: dorm.has_electricity },
    { label: "Water", value: dorm.has_water },
    { label: "Internet", value: dorm.has_internet },
  ];

  return (
    <section className="space-y-6 rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-[color:var(--ink)]">{dorm.name}</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                dorm.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
              }`}
            >
              {dorm.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {dorm.property_detail?.name ?? "Unassigned"}
            {dorm.property_detail?.location ? ` • ${dorm.property_detail.location}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(dorm)}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
          >
            <Icon name="edit" className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={handleDeleteDorm}
            className="flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <Icon name="alert-circle" className="h-4 w-4" />
            Delete
          </button>
        </div>
      </header>

      {dorm.cover_photo ? (
        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <img
            src={dorm.cover_photo}
            alt={`${dorm.name} cover`}
            className="h-48 w-full object-cover"
          />
        </div>
      ) : null}

      {dorm.description ? <p className="text-sm text-gray-700">{dorm.description}</p> : null}

      {dorm.amenities?.length ? (
        <div className="flex flex-wrap gap-2">
          {dorm.amenities.map((amenity) => (
            <span key={amenity} className="rounded-full bg-[color:var(--brand)]/10 px-3 py-1 text-xs font-semibold text-[color:var(--brand)]">
              {amenity}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 text-sm">
        {serviceFlags.map((service) => (
          <div
            key={service.label}
            className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${
              service.value ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${service.value ? "bg-emerald-500" : "bg-gray-300"}`} />
            {service.label}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-800">Dorm Gallery</h3>
        {dorm.images && dorm.images.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {dorm.images.map((image) => (
              <div key={image.id} className="relative overflow-hidden rounded-xl border border-gray-200">
                <img src={image.image} alt={image.caption ?? `${dorm.name} gallery`} className="h-24 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => onDeleteDormImage(dorm.id, image.id)}
                  className="absolute right-2 top-2 rounded-full bg-white/80 p-1 text-xs text-rose-600 shadow"
                  aria-label="Remove image"
                >
                  <Icon name="close" className="h-3 w-3" />
                </button>
                {image.caption ? (
                  <p className="truncate px-2 pb-2 pt-1 text-[10px] text-gray-600">{image.caption}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No images uploaded yet.</p>
        )}

        <form onSubmit={handleDormImageSubmit} className="space-y-3 rounded-2xl border border-dashed border-gray-300 p-4">
          <div className="flex flex-col gap-2 text-sm">
            <label className="font-medium text-gray-700" htmlFor={`dorm-image-${dorm.id}`}>
              Upload a new photo
            </label>
            <input
              id={`dorm-image-${dorm.id}`}
              type="file"
              accept="image/*"
              onChange={(event) => {
                const [file] = Array.from(event.target.files ?? []);
                setDormImageFile(file ?? null);
              }}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
            />
            <input
              type="text"
              value={dormImageCaption}
              onChange={(event) => setDormImageCaption(event.target.value)}
              placeholder="Caption (optional)"
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
            />
          </div>
          {dormImageError ? <p className="text-xs text-rose-600">{dormImageError}</p> : null}
          <button
            type="submit"
            disabled={dormImageSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {dormImageSubmitting ? "Uploading..." : "Upload Photo"}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Rooms</h3>
          <button
            type="button"
            onClick={handleOpenCreateRoom}
            className="flex items-center gap-2 rounded-full bg-[color:var(--brand)] px-4 py-2 text-sm font-semibold text-white"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add Room
          </button>
        </div>

        {dorm.rooms && dorm.rooms.length > 0 ? (
          <div className="space-y-4">
            {dorm.rooms.map((room) => {
              const roomImageState = roomImageStates[room.id] ?? {
                file: null,
                caption: "",
                submitting: false,
                error: null,
              };

              return (
                <div key={room.id} className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-[color:var(--ink)]">{room.name}</h4>
                      <p className="text-xs text-gray-500">
                        {roomTypeOptions.find((option) => option.value === room.room_type)?.label ?? room.room_type}
                        {room.capacity ? ` • Sleeps ${room.capacity}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                        {formatCurrency(room.price_per_month || "0")}
                      </span>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                        {room.available_units}/{room.total_units} Available
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 ${
                          room.is_available ? "bg-emerald-50 text-emerald-700" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {room.is_available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </div>

                  {room.description ? <p className="text-sm text-gray-600">{room.description}</p> : null}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditRoom(room)}
                      className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
                    >
                      Edit Room
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRoom(dorm.id, room.id)}
                      className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Delete Room
                    </button>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Room Gallery</p>
                    {room.images && room.images.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {room.images.map((image) => (
                          <div key={image.id} className="relative overflow-hidden rounded-xl border border-gray-200">
                            <img src={image.image} alt={image.caption ?? `${room.name} image`} className="h-24 w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => onDeleteRoomImage(room.id, image.id)}
                              className="absolute right-2 top-2 rounded-full bg-white/80 p-1 text-xs text-rose-600 shadow"
                              aria-label="Remove image"
                            >
                              <Icon name="close" className="h-3 w-3" />
                            </button>
                            {image.caption ? (
                              <p className="truncate px-2 pb-2 pt-1 text-[10px] text-gray-600">{image.caption}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No photos yet for this room.</p>
                    )}

                    <form onSubmit={(event) => handleRoomImageSubmit(room.id, event)} className="space-y-3 rounded-2xl border border-dashed border-gray-300 p-4">
                      <div className="flex flex-col gap-2 text-sm">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const [file] = Array.from(event.target.files ?? []);
                            updateRoomImageState(room.id, (prev) => ({ ...prev, file: file ?? null }));
                          }}
                          className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
                        />
                        <input
                          type="text"
                          value={roomImageState.caption}
                          onChange={(event) =>
                            updateRoomImageState(room.id, (prev) => ({ ...prev, caption: event.target.value }))
                          }
                          placeholder="Caption (optional)"
                          className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
                        />
                      </div>
                      {roomImageState.error ? (
                        <p className="text-xs text-rose-600">{roomImageState.error}</p>
                      ) : null}
                      <button
                        type="submit"
                        disabled={roomImageState.submitting}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {roomImageState.submitting ? "Uploading..." : "Upload Photo"}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No rooms have been added yet.</p>
        )}
      </div>

      {roomFormMode ? (
        <RoomForm
          dormName={dorm.name}
          initialRoom={roomFormTarget ?? undefined}
          submitting={roomSubmitting}
          error={roomError}
          mode={roomFormMode}
          onSubmit={handleRoomFormSubmit}
          onCancel={resetRoomForm}
        />
      ) : null}
    </section>
  );
}

export function OwnerDashboard() {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [dorms, setDorms] = useState<OwnerDorm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dormFormMode, setDormFormMode] = useState<"create" | "edit" | null>(null);
  const [dormFormSubmitting, setDormFormSubmitting] = useState(false);
  const [dormFormError, setDormFormError] = useState<string | null>(null);
  const [editingDorm, setEditingDorm] = useState<OwnerDorm | null>(null);
  const [bookingFilters, setBookingFilters] = useState<BookingRequestFilters>({});
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const properties = user?.properties ?? [];

  const reloadDorms = useCallback(async () => {
    const data = await getOwnerDorms();
    setDorms(data);
    return data;
  }, []);

  const refreshBookings = useCallback(async (filters: BookingRequestFilters) => {
    const data = await getOwnerBookingRequests(filters);
    setBookingRequests(data);
    return data;
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([getMe(), getOwnerDorms()])
      .then(([userData, dormData]) => {
        if (!active) return;
        setUser(userData);
        setDorms(dormData);
        if (userData.default_home_path) {
          localStorage.setItem("defaultHomePath", userData.default_home_path);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadDorms]);

  useEffect(() => {
    let active = true;
    setBookingLoading(true);
    setBookingError(null);

    refreshBookings(bookingFilters)
      .catch((err) => {
        if (!active) return;
        setBookingError(getErrorMessage(err));
      })
      .finally(() => {
        if (!active) return;
        setBookingLoading(false);
      });

    return () => {
      active = false;
    };
  }, [bookingFilters, refreshBookings]);

  useEffect(() => {
    setBookingFilters((prev) => {
      if (!prev.dorm) return prev;
      const dormExists = dorms.some((dorm) => dorm.id === prev.dorm);
      if (!dormExists) {
        return { ...prev, dorm: undefined, room: undefined };
      }
      if (prev.room) {
        const roomExists = dorms.some((dorm) => dorm.rooms?.some((room) => room.id === prev.room));
        if (!roomExists) {
          return { ...prev, room: undefined };
        }
      }
      return prev;
    });
  }, [dorms]);

  const roomOptions = useMemo(() => {
    return dorms.flatMap((dorm) =>
      (dorm.rooms ?? []).map((room) => ({
        id: room.id,
        label: `${dorm.name} — ${room.name}`,
      })),
    );
  }, [dorms]);

  function openCreateDorm() {
    setDormFormMode("create");
    setEditingDorm(null);
    setDormFormError(null);
  }

  function openEditDorm(dorm: OwnerDorm) {
    setDormFormMode("edit");
    setEditingDorm(dorm);
    setDormFormError(null);
  }

  function closeDormForm() {
    setDormFormMode(null);
    setEditingDorm(null);
    setDormFormError(null);
  }

  async function handleDormFormSubmit(values: DormFormState) {
    if (values.property === "") {
      setDormFormError("Please select a property");
      return;
    }

    const amenities = values.amenitiesInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const basePayload: DormRequestBody = {
      name: values.name.trim(),
      property: Number(values.property),
      description: values.description.trim() || undefined,
      amenities,
      has_room_service: values.has_room_service,
      has_electricity: values.has_electricity,
      has_water: values.has_water,
      has_internet: values.has_internet,
      is_active: values.is_active,
      cover_photo: values.cover_photo ?? undefined,
    };

    setDormFormSubmitting(true);
    setDormFormError(null);

    try {
      if (dormFormMode === "create") {
        await createOwnerDorm(basePayload);
      } else if (dormFormMode === "edit" && editingDorm) {
        const { cover_photo, ...rest } = basePayload;
        const updatePayload: Partial<DormRequestBody> & { cover_photo?: File | null } = {
          ...rest,
        };
        if (cover_photo instanceof File) {
          updatePayload.cover_photo = cover_photo;
        }
        await updateOwnerDorm(editingDorm.id, updatePayload);
      }
      await reloadDorms();
      closeDormForm();
    } catch (error) {
      setDormFormError(getErrorMessage(error));
    } finally {
      setDormFormSubmitting(false);
    }
  }

  async function handleDeleteDorm(id: number) {
    try {
      await deleteOwnerDorm(id);
      await reloadDorms();
    } catch (error) {
      setError(getErrorMessage(error));
    }
  }

  async function handleCreateRoom(dormId: number, values: RoomFormState) {
    const payload: DormRoomRequestBody = {
      dorm: dormId,
      name: values.name.trim(),
      room_type: values.room_type,
      capacity: Number(values.capacity),
      price_per_month: values.price_per_month ? values.price_per_month.trim() : "0",
      total_units: Number(values.total_units),
      available_units: Number(values.available_units),
      is_available: values.is_available,
      description: values.description.trim() || undefined,
    };
    await createDormRoom(payload);
    await reloadDorms();
  }

  async function handleUpdateRoom(dormId: number, roomId: number, values: RoomFormState) {
    const payload: Partial<DormRoomRequestBody> = {
      dorm: dormId,
      name: values.name.trim(),
      room_type: values.room_type,
      capacity: Number(values.capacity),
      price_per_month: values.price_per_month ? values.price_per_month.trim() : "0",
      total_units: Number(values.total_units),
      available_units: Number(values.available_units),
      is_available: values.is_available,
      description: values.description.trim() || undefined,
    };
    await updateDormRoom(roomId, payload);
    await reloadDorms();
  }

  async function handleDeleteRoom(dormId: number, roomId: number) {
    if (!window.confirm("Delete this room?")) return;
    await deleteDormRoom(roomId);
    await reloadDorms();
  }

  async function handleUploadDormImage(dormId: number, file: File, caption: string) {
    await createDormImage({ dorm: dormId, image: file, caption: caption || undefined });
    await reloadDorms();
  }

  async function handleDeleteDormImage(dormId: number, imageId: number) {
    if (!window.confirm("Remove this dorm photo?")) return;
    await deleteDormImage(imageId);
    await reloadDorms();
  }

  async function handleUploadRoomImage(dormId: number, roomId: number, file: File, caption: string) {
    await createDormRoomImage({ room: roomId, image: file, caption: caption || undefined });
    await reloadDorms();
  }

  async function handleDeleteRoomImage(roomId: number, imageId: number) {
    if (!window.confirm("Remove this room photo?")) return;
    await deleteDormRoomImage(imageId);
    await reloadDorms();
  }

  async function handleUpdateBooking(id: number, status: BookingRequest["status"], ownerNote: string) {
    await updateBookingRequest(id, { status, owner_note: ownerNote || undefined });
    await refreshBookings(bookingFilters);
  }

  const normalizedRole = user?.role ? user.role.toUpperCase() : null;
  const hasOwnerAccess =
    normalizedRole === "OWNER" ||
    (user?.default_home_path ?? "").startsWith("/owners/") ||
    Boolean(user?.properties?.length);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--brand)] border-t-transparent" />
          <p className="text-sm text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!hasOwnerAccess) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-[color:var(--ink)]">Owner dashboard unavailable</h1>
        <p className="text-sm text-gray-600">
          Please log in with an owner account to access property management tools.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 pb-24">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--brand)]/10">
              <Icon name="building" className="h-6 w-6 text-[color:var(--brand)]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[color:var(--ink)]">Owner Dashboard</h1>
              <p className="text-sm text-gray-500">
                Manage dorms, rooms, galleries, and booking requests from one place.
              </p>
            </div>
          </div>
          {error ? <FeedbackMessage variant="error" message={error} /> : null}
        </header>

        <section className="space-y-4 rounded-3xl border border-gray-200 bg-gradient-to-r from-[color:var(--brand)]/10 via-white to-purple-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Properties managed</p>
              <p className="text-2xl font-semibold text-[color:var(--ink)]">{properties.length}</p>
            </div>
            <button
              type="button"
              onClick={openCreateDorm}
              className="rounded-full bg-[color:var(--brand)] px-5 py-2 text-sm font-semibold text-white shadow-sm"
            >
              Add Dorm
            </button>
          </div>
          {properties.length === 0 ? (
            <p className="text-sm text-gray-600">
              Add properties to your profile to start assigning dorm listings.
            </p>
          ) : (
            <ul className="grid gap-2 text-sm text-gray-600">
              {properties.map((property) => (
                <li key={property.id} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[color:var(--brand)]" />
                  <span className="font-medium text-[color:var(--ink)]">{property.name}</span>
                  <span className="text-gray-500">— {property.location}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {dormFormMode ? (
          <section className="rounded-3xl border border-[color:var(--brand)]/20 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[color:var(--ink)]">
              {dormFormMode === "create" ? "Create a new dorm" : `Edit ${editingDorm?.name}`}
            </h2>
            <p className="text-sm text-gray-500">
              Fill out the details below to {dormFormMode === "create" ? "publish" : "update"} this dorm listing.
            </p>
            <div className="mt-6">
              <DormForm
                properties={properties}
                initialValue={
                  dormFormMode === "edit" && editingDorm
                    ? {
                        name: editingDorm.name,
                        property: editingDorm.property,
                        description: editingDorm.description,
                        amenities: editingDorm.amenities ?? [],
                        has_room_service: editingDorm.has_room_service,
                        has_electricity: editingDorm.has_electricity,
                        has_water: editingDorm.has_water,
                        has_internet: editingDorm.has_internet,
                        is_active: editingDorm.is_active,
                      }
                    : undefined
                }
                existingCover={editingDorm?.cover_photo}
                submitting={dormFormSubmitting}
                error={dormFormError}
                mode={dormFormMode}
                onSubmit={handleDormFormSubmit}
                onCancel={closeDormForm}
              />
            </div>
          </section>
        ) : null}

        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-[color:var(--ink)]">Dorm Listings</h2>
          {dorms.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              You haven’t added any dorms yet. Create your first dorm listing to showcase rooms, amenities, and services.
            </div>
          ) : (
            <div className="space-y-8">
              {dorms.map((dorm) => (
                <DormCard
                  key={dorm.id}
                  dorm={dorm}
                  onEdit={openEditDorm}
                  onDelete={handleDeleteDorm}
                  onCreateRoom={handleCreateRoom}
                  onUpdateRoom={handleUpdateRoom}
                  onDeleteRoom={handleDeleteRoom}
                  onUploadDormImage={handleUploadDormImage}
                  onDeleteDormImage={handleDeleteDormImage}
                  onUploadRoomImage={handleUploadRoomImage}
                  onDeleteRoomImage={handleDeleteRoomImage}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--ink)]">Booking Requests</h2>
              <p className="text-sm text-gray-500">Respond quickly to keep seekers informed.</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-gray-200 bg-white p-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor="filter-status">
                  Status
                </label>
                <select
                  id="filter-status"
                  value={bookingFilters.status ?? ""}
                  onChange={(event) => {
                    const nextStatus = (event.target.value || undefined) as
                      | BookingRequest["status"]
                      | undefined;
                    setBookingFilters((prev) => ({ ...prev, status: nextStatus }));
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
                >
                  <option value="">All statuses</option>
                  {bookingStatusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor="filter-dorm">
                  Dorm
                </label>
                <select
                  id="filter-dorm"
                  value={bookingFilters.dorm ?? ""}
                  onChange={(event) =>
                    setBookingFilters((prev) => ({
                      ...prev,
                      dorm: event.target.value ? Number(event.target.value) : undefined,
                      room: undefined,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
                >
                  <option value="">All dorms</option>
                  {dorms.map((dorm) => (
                    <option key={dorm.id} value={dorm.id}>
                      {dorm.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500" htmlFor="filter-room">
                  Room
                </label>
                <select
                  id="filter-room"
                  value={bookingFilters.room ?? ""}
                  onChange={(event) =>
                    setBookingFilters((prev) => ({
                      ...prev,
                      room: event.target.value ? Number(event.target.value) : undefined,
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)]/20"
                >
                  <option value="">All rooms</option>
                  {roomOptions.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {bookingError ? <FeedbackMessage variant="error" message={bookingError} /> : null}
          </div>

          {bookingLoading ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
              Loading booking requests...
            </div>
          ) : bookingRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
              No booking requests found for the selected filters.
            </div>
          ) : (
            <div className="space-y-4">
              {bookingRequests.map((request) => (
                <BookingRequestCard key={request.id} request={request} onUpdate={handleUpdateBooking} />
              ))}
            </div>
          )}
        </section>
      </div>

      <BottomMenu />
    </>
  );
}

