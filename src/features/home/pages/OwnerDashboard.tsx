import { useCallback, useEffect, useMemo, useState } from "react";

import { Icon } from "../../../components/Icon";
import { ApiError, api } from "../../../lib/api";

type PropertyRoom = {
  id: number;
  room_type: string;
  total_rooms: number;
  available_rooms: number;
  price_per_month: string | number | null;
  notes: string;
};

type PropertyImage = {
  id: number;
  image_url: string;
  caption: string;
};

type OwnerProperty = {
  id: number;
  name: string;
  location: string;
  description: string;
  latitude: string | number | null;
  longitude: string | number | null;
  has_electricity_included: boolean;
  has_cleaning_service: boolean;
  additional_services: string;
  rooms: PropertyRoom[];
  images: PropertyImage[];
  created_at: string;
  updated_at: string;
};

type FetchState =
  | { status: "idle" | "loading"; data: OwnerProperty[]; error: null }
  | { status: "error"; data: OwnerProperty[]; error: string }
  | { status: "success"; data: OwnerProperty[]; error: null };

const AMENITY_LABELS: Array<{ key: keyof OwnerProperty; label: string }> = [
  { key: "has_electricity_included", label: "Electricity Included" },
  { key: "has_cleaning_service", label: "Cleaning Service" },
];

export function OwnerDashboard() {
  const [state, setState] = useState<FetchState>({ status: "idle", data: [], error: null });

  const hasProperties = state.data.length > 0;

  const loadProperties = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setState({ status: "error", data: [], error: "You need to be logged in to view your properties." });
      return;
    }

    setState((prev) => ({ ...prev, status: "loading", error: null }));

    try {
      const properties = await api<OwnerProperty[]>("/api/v1/auth/properties/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setState({ status: "success", data: properties, error: null });
    } catch (error) {
      if (error instanceof ApiError) {
        setState({ status: "error", data: [], error: error.message || "Failed to load properties." });
      } else {
        setState({ status: "error", data: [], error: "Failed to load properties." });
      }
    }
  }, []);

  useEffect(() => {
    void loadProperties();
  }, [loadProperties]);

  const subtitle = useMemo(() => {
    if (state.status === "loading") {
      return "Fetching your dorm listings...";
    }
    if (state.status === "error") {
      return "We couldn\'t load your properties.";
    }
    if (!hasProperties) {
      return "You haven\'t added any properties yet.";
    }
    return `${state.data.length} ${state.data.length === 1 ? "property" : "properties"}`;
  }, [hasProperties, state]);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <button aria-label="menu" className="p-2 rounded-full bg-gray-100">
          <Icon name="menu" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">Your Properties</h1>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadProperties()}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-800"
          aria-label="Refresh properties"
        >
          <Icon name="sparkles" className="h-4 w-4" />
          Refresh
        </button>
      </header>

      {state.status === "loading" ? <LoadingState /> : null}

      {state.status === "error" ? <ErrorState message={state.error} onRetry={loadProperties} /> : null}

      {state.status === "success" && hasProperties ? (
        <section className="space-y-4">
          {state.data.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </section>
      ) : null}

      {state.status === "success" && !hasProperties ? <EmptyState /> : null}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      {[1, 2].map((item) => (
        <div key={item} className="animate-pulse space-y-3 rounded-2xl border border-gray-100 p-4 shadow-sm">
          <div className="h-6 w-1/3 rounded-full bg-gray-200" />
          <div className="h-4 w-1/2 rounded-full bg-gray-200" />
          <div className="h-24 w-full rounded-2xl bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-700">
      <Icon name="alert-circle" className="mb-2 h-6 w-6" />
      <p className="mb-4 font-medium">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
      <Icon name="building" className="mb-4 h-8 w-8 text-gray-300" />
      <h2 className="text-base font-semibold text-gray-700">No properties yet</h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Once you add a dorm listing in the owner portal, it will appear here with its rooms, amenities, and images.
      </p>
    </div>
  );
}

function PropertyCard({ property }: { property: OwnerProperty }) {
  const { name, location, description, additional_services, rooms, images, latitude, longitude, created_at, updated_at } =
    property;

  const amenities = AMENITY_LABELS.filter((amenity) => property[amenity.key] === true);

  return (
    <article className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-gray-200">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{name}</h2>
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Icon name="globe" className="h-4 w-4" />
            {location}
          </p>
        </div>
        <div className="flex flex-col items-end text-xs text-gray-400">
          <span>Created {formatRelativeDate(created_at)}</span>
          <span>Updated {formatRelativeDate(updated_at)}</span>
        </div>
      </header>

      {description ? <p className="text-sm leading-relaxed text-gray-600">{description}</p> : null}

      <div className="flex flex-wrap gap-2">
        {amenities.length ? (
          amenities.map((amenity) => (
            <span
              key={amenity.key}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
            >
              <Icon name="check-circle" className="h-4 w-4" />
              {amenity.label}
            </span>
          ))
        ) : (
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500">No amenities noted</span>
        )}
      </div>

      {latitude && longitude ? (
        <div className="rounded-xl bg-gray-50 p-4 text-xs text-gray-500">
          <span className="font-semibold text-gray-600">Coordinates:</span> {latitude}, {longitude}
        </div>
      ) : null}

      {additional_services ? (
        <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
          <span className="block font-semibold text-blue-800">Additional services</span>
          <span className="mt-1 inline-block whitespace-pre-line">{additional_services}</span>
        </div>
      ) : null}

      <RoomSection rooms={rooms} />
      <ImageSection images={images} />
    </article>
  );
}

function RoomSection({ rooms }: { rooms: PropertyRoom[] }) {
  if (!rooms.length) {
    return (
      <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-500">
        <div className="flex items-center gap-2 text-gray-600">
          <Icon name="bed" className="h-4 w-4" />
          <span className="font-semibold">Room availability</span>
        </div>
        <p className="mt-2 text-sm text-gray-500">No room configurations have been added yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Icon name="bed" className="h-4 w-4" />
        Room availability
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {rooms.map((room) => (
          <div key={room.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
            <div className="flex items-center justify-between text-gray-700">
              <span className="font-semibold">{formatRoomType(room.room_type)}</span>
              <span className="text-xs text-gray-500">{room.available_rooms}/{room.total_rooms} available</span>
            </div>
            {room.price_per_month ? (
              <p className="mt-2 text-sm font-medium text-gray-700">
                {formatCurrency(room.price_per_month)} / month
              </p>
            ) : null}
            {room.notes ? <p className="mt-2 text-xs text-gray-500">{room.notes}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageSection({ images }: { images: PropertyImage[] }) {
  if (!images.length) {
    return (
      <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-500">
        <p className="font-semibold text-gray-600">Images</p>
        <p className="mt-2 text-sm text-gray-500">No images have been uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-700">Images</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {images.map((image) => (
          <figure key={image.id} className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <img
              src={image.image_url}
              alt={image.caption || "Dorm property"}
              className="h-36 w-full object-cover"
            />
            {image.caption ? (
              <figcaption className="px-3 py-2 text-xs text-gray-500">{image.caption}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </div>
  );
}

function formatRoomType(type: string) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function formatCurrency(value: string | number | null) {
  if (value == null) return "Price not provided";

  const amount = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
