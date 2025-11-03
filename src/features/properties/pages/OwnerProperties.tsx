import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { BottomMenu } from "../../../components/BottomMenu";
import { Icon } from "../../../components/Icon";
import {
  ApiError,
  createOwnerProperty,
  createOwnerRoom,
  deleteOwnerProperty,
  deleteOwnerRoom,
  deletePropertyImage,
  deleteRoomImage,
  getOwnerProperties,
  updateOwnerProperty,
  updateOwnerRoom,
  uploadPropertyCoverImage,
  uploadPropertyGalleryImage,
  uploadRoomImage,
} from "../../../lib/api";
import type {
  Property,
  PropertyImage,
  PropertyPayload,
  Room,
  RoomImage,
  RoomPayload,
} from "../../../lib/types";

const propertyAmenityOptions = [
  "24/7 Electricity",
  "Cleaning Service",
  "High-speed WiFi",
  "Laundry Facilities",
  "Security",
];

const roomAmenityOptions = [
  "Private Bathroom",
  "Balcony",
  "Kitchenette",
  "Study Desk",
  "Air Conditioning",
];

const roomTypeOptions: { value: Room["room_type"]; label: string }[] = [
  { value: "SINGLE", label: "Single" },
  { value: "DOUBLE", label: "Double" },
  { value: "SUITE", label: "Suite" },
  { value: "OTHER", label: "Other" },
];

type ToastState = { message: string; variant: "success" | "error" };

type PropertyFormSubmission = {
  payload: PropertyPayload;
  coverFile: File | null;
  removeCover: boolean;
  galleryFiles: File[];
};

type RoomFormSubmission = {
  payload: RoomPayload;
  newImages: File[];
};

type PropertyFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (submission: PropertyFormSubmission) => Promise<void>;
  isSubmitting: boolean;
  property?: Property | null;
  onDeleteImage: (property: Property, image: PropertyImage) => Promise<void>;
};

type RoomFormModalProps = {
  open: boolean;
  property: Property | null;
  room: Room | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (submission: RoomFormSubmission) => Promise<void>;
  onDeleteImage: (property: Property, room: Room, image: RoomImage) => Promise<void>;
};

type PropertyDetailDrawerProps = {
  property: Property;
  onClose: () => void;
  onEdit: () => void;
  onAddRoom: () => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
  onDeleteRoomImage: (property: Property, room: Room, image: RoomImage) => Promise<void>;
  isRefreshing: boolean;
};

function useToast(toast: ToastState | null, setToast: (toast: ToastState | null) => void) {
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [toast, setToast]);
}

function AmenityPills({ amenities }: { amenities: string[] }) {
  if (!amenities.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {amenities.map((amenity) => (
        <span
          key={amenity}
          className="inline-flex items-center rounded-full bg-[color:var(--brand-soft)] px-3 py-1 text-xs font-medium text-[color:var(--brand)]"
        >
          {amenity}
        </span>
      ))}
    </div>
  );
}

function PropertyCard({
  property,
  onEdit,
  onView,
  onDelete,
}: {
  property: Property;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  const badges = [
    property.electricity_included ? "24/7 Electricity" : null,
    property.cleaning_included ? "Cleaning" : null,
  ].filter(Boolean) as string[];

  return (
    <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="relative h-40 w-full overflow-hidden rounded-t-3xl bg-gray-100">
        {property.cover_image ? (
          <img
            src={property.cover_image}
            alt={property.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400">
            <Icon name="image" className="h-8 w-8" />
            <p className="text-xs">No cover image yet</p>
          </div>
        )}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-base font-semibold text-[color:var(--ink)]">{property.name}</h3>
          <p className="text-sm text-gray-500">{property.location}</p>
        </div>
        <AmenityPills amenities={[...badges, ...property.amenities.slice(0, 3)]} />
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-[color:var(--ink)] transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
          >
            <Icon name="pencil" className="h-4 w-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={onView}
            className="flex-1 rounded-full bg-[color:var(--brand)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            View details
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-full border border-red-200 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-50"
          >
            <Icon name="trash" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertyFormModal({ open, onClose, onSubmit, isSubmitting, property, onDeleteImage }: PropertyFormModalProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [electricityIncluded, setElectricityIncluded] = useState(false);
  const [cleaningIncluded, setCleaningIncluded] = useState(false);
  const [coverSelection, setCoverSelection] = useState<{ file: File; preview: string } | null>(null);
  const [gallerySelections, setGallerySelections] = useState<{ file: File; preview: string }[]>([]);
  const [removeCover, setRemoveCover] = useState(false);
  const [removingImageId, setRemovingImageId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(property?.name ?? "");
    setLocation(property?.location ?? "");
    setDescription(property?.description ?? "");
    setAmenities(property?.amenities ?? []);
    setElectricityIncluded(Boolean(property?.electricity_included));
    setCleaningIncluded(Boolean(property?.cleaning_included));
    setCoverSelection(null);
    setGallerySelections([]);
    setRemoveCover(false);
    setCustomAmenity("");
    setRemovingImageId(null);
  }, [open, property]);

  useEffect(() => {
    return () => {
      if (coverSelection) {
        URL.revokeObjectURL(coverSelection.preview);
      }
      gallerySelections.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [coverSelection, gallerySelections]);

  if (!open) {
    return null;
  }

  const handleToggleAmenity = (value: string) => {
    setAmenities((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed || amenities.includes(trimmed)) return;
    setAmenities((prev) => [...prev, trimmed]);
    setCustomAmenity("");
  };

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (coverSelection) {
      URL.revokeObjectURL(coverSelection.preview);
    }
    setRemoveCover(false);
    setCoverSelection({ file, preview: URL.createObjectURL(file) });
  };

  const handleGalleryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const additions: { file: File; preview: string }[] = [];
    Array.from(files).forEach((file) => {
      additions.push({ file, preview: URL.createObjectURL(file) });
    });
    setGallerySelections((prev) => [...prev, ...additions]);
  };

  const handleRemoveGallerySelection = (preview: string) => {
    setGallerySelections((prev) => {
      const target = prev.find((item) => item.preview === preview);
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((item) => item.preview !== preview);
    });
  };

  const handleDeleteExistingImage = async (image: PropertyImage) => {
    if (!property) return;
    const confirmed = window.confirm("Remove this image from the gallery?");
    if (!confirmed) return;
    try {
      setRemovingImageId(image.id);
      await onDeleteImage(property, image);
    } finally {
      setRemovingImageId(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const submission: PropertyFormSubmission = {
      payload: {
        name,
        location,
        description,
        amenities,
        electricity_included: electricityIncluded,
        cleaning_included: cleaningIncluded,
      },
      coverFile: coverSelection?.file ?? null,
      removeCover,
      galleryFiles: gallerySelections.map((item) => item.file),
    };

    await onSubmit(submission);
  };

  const galleryPreviewItems = useMemo(() => gallerySelections, [gallerySelections]);
  const existingImages = property?.images ?? [];
  const hasCover = coverSelection || (!removeCover && property?.cover_image);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 sm:items-center">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--ink)]">
                {property ? "Edit property" : "Add a new property"}
              </h2>
              <p className="text-sm text-gray-500">
                Provide clear details so students understand what you offer.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-[color:var(--ink)]"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[color:var(--ink)]">Property name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
                placeholder="Green Valley Dorms"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[color:var(--ink)]">Location / address</span>
              <input
                type="text"
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                required
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
                placeholder="Achrafieh, Beirut"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[color:var(--ink)]">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
                placeholder="Share standout features, nearby landmarks, or house rules."
              />
            </label>

            <div className="space-y-3">
              <span className="block text-sm font-medium text-[color:var(--ink)]">Amenities & services</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {propertyAmenityOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={amenities.includes(option)}
                      onChange={() => handleToggleAmenity(option)}
                      className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={customAmenity}
                  onChange={(event) => setCustomAmenity(event.target.value)}
                  onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddCustomAmenity();
                    }
                  }}
                  placeholder="Add a custom amenity"
                  className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAmenity}
                  className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-medium text-[color:var(--ink)] transition hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              <AmenityPills amenities={amenities.filter((amenity) => !propertyAmenityOptions.includes(amenity))} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={electricityIncluded}
                  onChange={(event) => setElectricityIncluded(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
                />
                <span>24/7 electricity included</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={cleaningIncluded}
                  onChange={(event) => setCleaningIncluded(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
                />
                <span>Cleaning service provided</span>
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[color:var(--ink)]">Cover image</span>
                {property?.cover_image && !removeCover && !coverSelection ? (
                  <button
                    type="button"
                    onClick={() => setRemoveCover(true)}
                    className="text-xs font-medium text-red-500 hover:underline"
                  >
                    Remove cover
                  </button>
                ) : null}
                {removeCover ? (
                  <button
                    type="button"
                    onClick={() => setRemoveCover(false)}
                    className="text-xs font-medium text-[color:var(--brand)] hover:underline"
                  >
                    Keep current cover
                  </button>
                ) : null}
              </div>
              <div className="rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                <label className="flex cursor-pointer flex-col items-center gap-3">
                  <Icon name="upload" className="h-6 w-6 text-[color:var(--brand)]" />
                  <span>Upload a high-quality cover photo</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </label>
                {hasCover ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
                    {coverSelection ? (
                      <img src={coverSelection.preview} alt="Cover preview" className="h-40 w-full object-cover" />
                    ) : property?.cover_image ? (
                      <img src={property.cover_image} alt="Current cover" className="h-40 w-full object-cover" />
                    ) : null}
                  </div>
                ) : removeCover ? (
                  <p className="mt-3 text-xs text-gray-400">Cover image will be removed when you save changes.</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-sm font-medium text-[color:var(--ink)]">Gallery images</span>
              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                <Icon name="images" className="h-6 w-6 text-[color:var(--brand)]" />
                <span>Add photos (you can select multiple)</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
              </label>
              {existingImages.length ? (
                <div className="grid grid-cols-3 gap-3">
                  {existingImages.map((image) => (
                    <div key={image.id} className="relative overflow-hidden rounded-2xl border border-gray-200">
                      <img src={image.image} alt={image.caption ?? "Property image"} className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        disabled={removingImageId === image.id}
                        onClick={() => handleDeleteExistingImage(image)}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80 disabled:opacity-50"
                      >
                        {removingImageId === image.id ? (
                          <Icon name="loader" className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon name="close" className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {galleryPreviewItems.length ? (
                <div className="grid grid-cols-3 gap-3">
                  {galleryPreviewItems.map((item) => (
                    <div key={item.preview} className="relative overflow-hidden rounded-2xl border border-gray-200">
                      <img src={item.preview} alt="New gallery" className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGallerySelection(item.preview)}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
                      >
                        <Icon name="close" className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-[color:var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Icon name="loader" className="h-4 w-4 animate-spin" />
                  Saving
                </span>
              ) : property ? (
                "Save changes"
              ) : (
                "Create property"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RoomFormModal({ open, property, room, isSubmitting, onClose, onSubmit, onDeleteImage }: RoomFormModalProps) {
  const [name, setName] = useState("");
  const [roomType, setRoomType] = useState<Room["room_type"]>("SINGLE");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [capacity, setCapacity] = useState(1);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [electricityIncluded, setElectricityIncluded] = useState(false);
  const [cleaningIncluded, setCleaningIncluded] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [gallerySelections, setGallerySelections] = useState<{ file: File; preview: string }[]>([]);
  const [removingImageId, setRemovingImageId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(room?.name ?? "");
    setRoomType(room?.room_type ?? "SINGLE");
    setDescription(room?.description ?? "");
    setPrice(room?.price_per_month ?? "0");
    setCapacity(room?.capacity ?? 1);
    setAvailableQuantity(room?.available_quantity ?? 0);
    setAmenities(room?.amenities ?? []);
    setCustomAmenity("");
    setElectricityIncluded(Boolean(room?.electricity_included));
    setCleaningIncluded(Boolean(room?.cleaning_included));
    setIsActive(room ? room.is_active : true);
    setGallerySelections([]);
    setRemovingImageId(null);
  }, [open, room]);

  useEffect(() => {
    return () => {
      gallerySelections.forEach((item) => URL.revokeObjectURL(item.preview));
    };
  }, [gallerySelections]);

  if (!open || !property) {
    return null;
  }

  const handleToggleAmenity = (value: string) => {
    setAmenities((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const handleAddCustomAmenity = () => {
    const trimmed = customAmenity.trim();
    if (!trimmed || amenities.includes(trimmed)) return;
    setAmenities((prev) => [...prev, trimmed]);
    setCustomAmenity("");
  };

  const handleGalleryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files?.length) return;
    const additions: { file: File; preview: string }[] = [];
    Array.from(files).forEach((file) => {
      additions.push({ file, preview: URL.createObjectURL(file) });
    });
    setGallerySelections((prev) => [...prev, ...additions]);
  };

  const handleRemoveGallerySelection = (preview: string) => {
    setGallerySelections((prev) => {
      const target = prev.find((item) => item.preview === preview);
      if (target) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((item) => item.preview !== preview);
    });
  };

  const handleDeleteExistingImage = async (image: RoomImage) => {
    if (!room) return;
    const confirmed = window.confirm("Remove this room image?");
    if (!confirmed) return;
    try {
      setRemovingImageId(image.id);
      await onDeleteImage(property, room, image);
    } finally {
      setRemovingImageId(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const submission: RoomFormSubmission = {
      payload: {
        name,
        room_type: roomType,
        description,
        price_per_month: price,
        capacity,
        available_quantity: availableQuantity,
        amenities,
        electricity_included: electricityIncluded,
        cleaning_included: cleaningIncluded,
        is_active: isActive,
      },
      newImages: gallerySelections.map((item) => item.file),
    };
    await onSubmit(submission);
  };

  const existingImages = room?.images ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 sm:items-center">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[color:var(--ink)]">
                {room ? "Edit room" : "Add a room"}
              </h2>
              <p className="text-sm text-gray-500">Manage availability and pricing for each room type.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-[color:var(--ink)]"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[color:var(--ink)]">Room name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
                placeholder="Single Deluxe"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[color:var(--ink)]">Room type</span>
              <select
                value={roomType}
                onChange={(event) => setRoomType(event.target.value as Room["room_type"])}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
              >
                {roomTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[color:var(--ink)]">Description</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
                placeholder="Highlight unique features or services included with this room."
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[color:var(--ink)]">Monthly price (USD)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[color:var(--ink)]">Capacity</span>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(event) => setCapacity(Number(event.target.value))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[color:var(--ink)]">Available units</span>
                <input
                  type="number"
                  min="0"
                  value={availableQuantity}
                  onChange={(event) => setAvailableQuantity(Number(event.target.value))}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
                />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
                />
                <span>Room is currently available for booking</span>
              </label>
            </div>

            <div className="space-y-3">
              <span className="text-sm font-medium text-[color:var(--ink)]">Amenities</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {roomAmenityOptions.map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={amenities.includes(option)}
                      onChange={() => handleToggleAmenity(option)}
                      className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={customAmenity}
                  onChange={(event) => setCustomAmenity(event.target.value)}
                  onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddCustomAmenity();
                    }
                  }}
                  placeholder="Add a custom amenity"
                  className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-[color:var(--brand)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomAmenity}
                  className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-medium text-[color:var(--ink)] transition hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              <AmenityPills amenities={amenities.filter((amenity) => !roomAmenityOptions.includes(amenity))} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={electricityIncluded}
                  onChange={(event) => setElectricityIncluded(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
                />
                <span>Electricity included</span>
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={cleaningIncluded}
                  onChange={(event) => setCleaningIncluded(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand)] focus:ring-[color:var(--brand)]"
                />
                <span>Cleaning included</span>
              </label>
            </div>

            <div className="space-y-3">
              <span className="text-sm font-medium text-[color:var(--ink)]">Room photos</span>
              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                <Icon name="images" className="h-6 w-6 text-[color:var(--brand)]" />
                <span>Upload room photos</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryChange} />
              </label>

              {existingImages.length ? (
                <div className="grid grid-cols-3 gap-3">
                  {existingImages.map((image) => (
                    <div key={image.id} className="relative overflow-hidden rounded-2xl border border-gray-200">
                      <img src={image.image} alt={image.caption ?? "Room image"} className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        disabled={removingImageId === image.id}
                        onClick={() => handleDeleteExistingImage(image)}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80 disabled:opacity-50"
                      >
                        {removingImageId === image.id ? (
                          <Icon name="loader" className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon name="close" className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {gallerySelections.length ? (
                <div className="grid grid-cols-3 gap-3">
                  {gallerySelections.map((item) => (
                    <div key={item.preview} className="relative overflow-hidden rounded-2xl border border-gray-200">
                      <img src={item.preview} alt="New room" className="h-24 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGallerySelection(item.preview)}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
                      >
                        <Icon name="close" className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-gray-200 px-6 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-100"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-[color:var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Icon name="loader" className="h-4 w-4 animate-spin" />
                  Saving
                </span>
              ) : room ? (
                "Save room"
              ) : (
                "Add room"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PropertyDetailDrawer({
  property,
  onClose,
  onEdit,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
  onDeleteRoomImage,
  isRefreshing,
}: PropertyDetailDrawerProps) {
  const gallery = useMemo(() => {
    const images = [] as { id: string; url: string }[];
    if (property.cover_image) {
      images.push({ id: `cover-${property.id}`, url: property.cover_image });
    }
    property.images.forEach((image) => {
      images.push({ id: String(image.id), url: image.image });
    });
    return images;
  }, [property]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [property.id]);

  const currentImage = gallery[activeImageIndex];

  const changeImage = (direction: number) => {
    if (!gallery.length) return;
    setActiveImageIndex((prev) => {
      const next = prev + direction;
      if (next < 0) return gallery.length - 1;
      if (next >= gallery.length) return 0;
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-[color:var(--ink)]">{property.name}</h2>
            <p className="text-sm text-gray-500">{property.location}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-[color:var(--ink)]"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gray-100">
          {gallery.length && currentImage ? (
            <img src={currentImage.url} alt="Property" className="h-56 w-full object-cover" />
          ) : (
            <div className="flex h-56 w-full items-center justify-center text-gray-400">
              <p>No images yet</p>
            </div>
          )}
          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => changeImage(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
              >
                <Icon name="chevron-left" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => changeImage(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
              >
                <Icon name="chevron-right" className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>

        <div className="mt-4 space-y-4">
          <section className="space-y-3">
            <header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Overview
              </h3>
              <button
                type="button"
                onClick={onEdit}
                className="flex items-center gap-2 text-sm font-medium text-[color:var(--brand)] hover:underline"
              >
                <Icon name="pencil" className="h-4 w-4" />
                Edit property
              </button>
            </header>
            <p className="text-sm leading-relaxed text-gray-600">
              {property.description || "Add a description so students can learn about this property."}
            </p>
            <div className="flex flex-wrap gap-2">
              {property.electricity_included ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                  <Icon name="zap" className="h-3 w-3" />
                  Electricity included
                </span>
              ) : null}
              {property.cleaning_included ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                  <Icon name="sparkles" className="h-3 w-3" />
                  Cleaning provided
                </span>
              ) : null}
            </div>
            <AmenityPills amenities={property.amenities} />
          </section>

          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Rooms
              </h3>
              <button
                type="button"
                onClick={onAddRoom}
                className="flex items-center gap-2 rounded-full bg-[color:var(--brand)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Icon name="plus" className="h-4 w-4" />
                Add room
              </button>
            </header>

            {property.rooms.length ? (
              <div className="space-y-4">
                {property.rooms.map((room) => (
                  <RoomSummaryCard
                    key={room.id}
                    room={room}
                    onEdit={() => onEditRoom(room)}
                    onDelete={() => onDeleteRoom(room)}
                    onDeleteImage={(image) => onDeleteRoomImage(property, room, image)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                No rooms added yet. Start by adding your first room type.
              </div>
            )}
          </section>
        </div>

        {isRefreshing ? (
          <div className="mt-6 flex items-center justify-center text-sm text-gray-400">
            <Icon name="loader" className="mr-2 h-4 w-4 animate-spin" /> Refreshing…
          </div>
        ) : null}
      </div>
    </div>
  );
}

type RoomSummaryCardProps = {
  room: Room;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteImage: (image: RoomImage) => Promise<void>;
};

function RoomSummaryCard({ room, onEdit, onDelete, onDeleteImage }: RoomSummaryCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [room.id]);

  const gallery = room.images;
  const currentImage = gallery[activeImageIndex];

  const changeImage = (direction: number) => {
    if (!gallery.length) return;
    setActiveImageIndex((prev) => {
      const next = prev + direction;
      if (next < 0) return gallery.length - 1;
      if (next >= gallery.length) return 0;
      return next;
    });
  };

  return (
    <div className="rounded-3xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-base font-semibold text-[color:var(--ink)]">{room.name}</h4>
          <p className="text-xs uppercase tracking-wide text-gray-400">{room.room_type}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-full border border-gray-200 p-2 text-xs text-gray-500 transition hover:border-[color:var(--brand)] hover:text-[color:var(--brand)]"
          >
            <Icon name="pencil" className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const confirmed = window.confirm("Delete this room?");
              if (confirmed) {
                onDelete();
              }
            }}
            className="rounded-full border border-red-200 p-2 text-xs text-red-500 transition hover:bg-red-50"
          >
            <Icon name="trash" className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
        <span className="font-semibold text-[color:var(--ink)]">${room.price_per_month}/month</span>
        <span>{room.capacity} person{room.capacity > 1 ? "s" : ""}</span>
        <span>{room.available_quantity} available</span>
      </div>

      <p className="mt-3 text-sm text-gray-600">{room.description || "Add a description to help tenants."}</p>

      <AmenityPills amenities={room.amenities} />

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        {room.electricity_included ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-emerald-600">
            <Icon name="zap" className="h-3 w-3" /> Electricity included
          </span>
        ) : null}
        {room.cleaning_included ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-indigo-600">
            <Icon name="sparkles" className="h-3 w-3" /> Cleaning included
          </span>
        ) : null}
        {!room.is_active ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-gray-500">
            <Icon name="pause" className="h-3 w-3" /> Paused
          </span>
        ) : null}
      </div>

      <div className="mt-4">
        <div className="relative overflow-hidden rounded-2xl bg-gray-100">
          {currentImage ? (
            <img src={currentImage.image} alt={currentImage.caption ?? "Room"} className="h-40 w-full object-cover" />
          ) : (
            <div className="flex h-40 w-full items-center justify-center text-gray-400">
              <p>No photos yet</p>
            </div>
          )}
          {gallery.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => changeImage(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
              >
                <Icon name="chevron-left" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => changeImage(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
              >
                <Icon name="chevron-right" className="h-4 w-4" />
              </button>
            </>
          ) : null}
        </div>
        {currentImage ? (
          <button
            type="button"
            className="mt-2 text-xs font-medium text-red-500 hover:underline"
            onClick={() => onDeleteImage(currentImage)}
          >
            Remove current image
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function OwnerProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propertyModalState, setPropertyModalState] = useState<{ open: boolean; property: Property | null }>(
    { open: false, property: null },
  );
  const [roomModalState, setRoomModalState] = useState<{ open: boolean; property: Property | null; room: Room | null }>(
    { open: false, property: null, room: null },
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSavingProperty, setIsSavingProperty] = useState(false);
  const [isSavingRoom, setIsSavingRoom] = useState(false);

  useToast(toast, setToast);

  const selectedProperty = selectedPropertyId
    ? properties.find((property) => property.id === selectedPropertyId) ?? null
    : null;

  const loadProperties = async (initial = false) => {
    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const data = await getOwnerProperties();
      setProperties(data);
      if (selectedPropertyId) {
        const exists = data.some((property) => property.id === selectedPropertyId);
        if (!exists) {
          setSelectedPropertyId(null);
        }
      }
      setError(null);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to load properties.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadProperties(true);
  }, []);

  const showToast = (message: string, variant: ToastState["variant"]) => {
    setToast({ message, variant });
  };

  const handleOpenCreateModal = () => {
    setPropertyModalState({ open: true, property: null });
  };

  const handleEditProperty = (property: Property) => {
    setPropertyModalState({ open: true, property });
  };

  const handlePropertyFormSubmit = async (submission: PropertyFormSubmission) => {
    if (isSavingProperty) return;
    setIsSavingProperty(true);
    try {
      const { payload, coverFile, galleryFiles, removeCover } = submission;
      let propertyId: number;

      if (propertyModalState.property) {
        propertyId = propertyModalState.property.id;
        await updateOwnerProperty(propertyId, payload);
        if (removeCover) {
          await updateOwnerProperty(propertyId, { cover_image: null });
        } else if (coverFile) {
          await uploadPropertyCoverImage(propertyId, coverFile);
        }
        if (galleryFiles.length) {
          await Promise.all(galleryFiles.map((file) => uploadPropertyGalleryImage(propertyId, file)));
        }
        showToast("Property updated successfully.", "success");
      } else {
        const created = await createOwnerProperty(payload);
        propertyId = created.id;
        if (coverFile) {
          await uploadPropertyCoverImage(propertyId, coverFile);
        }
        if (galleryFiles.length) {
          await Promise.all(galleryFiles.map((file) => uploadPropertyGalleryImage(propertyId, file)));
        }
        showToast("Property created successfully.", "success");
        setSelectedPropertyId(propertyId);
      }

      setPropertyModalState({ open: false, property: null });
      await loadProperties(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "We couldn't save the property.";
      showToast(message, "error");
    } finally {
      setIsSavingProperty(false);
    }
  };

  const handleDeleteProperty = async (property: Property) => {
    const confirmed = window.confirm("Delete this property and all its rooms?");
    if (!confirmed) return;

    try {
      setRefreshing(true);
      await deleteOwnerProperty(property.id);
      showToast("Property deleted.", "success");
      await loadProperties(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete property.";
      showToast(message, "error");
    }
  };

  const handleDeletePropertyImage = async (property: Property, image: PropertyImage) => {
    try {
      await deletePropertyImage(image.id);
      showToast("Image removed.", "success");
      await loadProperties(false);
      if (selectedPropertyId === property.id) {
        setSelectedPropertyId(property.id);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to remove image.";
      showToast(message, "error");
    }
  };

  const handleRoomFormSubmit = async (submission: RoomFormSubmission) => {
    if (!roomModalState.property || isSavingRoom) return;
    setIsSavingRoom(true);

    try {
      const { payload, newImages } = submission;
      const propertyId = roomModalState.property.id;
      let roomId: number;

      if (roomModalState.room) {
        roomId = roomModalState.room.id;
        await updateOwnerRoom(propertyId, roomId, payload);
        if (newImages.length) {
          await Promise.all(newImages.map((file) => uploadRoomImage(roomId, file)));
        }
        showToast("Room updated.", "success");
      } else {
        const created = await createOwnerRoom(propertyId, payload);
        roomId = created.id;
        if (newImages.length) {
          await Promise.all(newImages.map((file) => uploadRoomImage(roomId, file)));
        }
        showToast("Room created.", "success");
      }

      setRoomModalState({ open: false, property: null, room: null });
      await loadProperties(false);
      setSelectedPropertyId(propertyId);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "We couldn't save the room.";
      showToast(message, "error");
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (!selectedProperty) return;
    const confirmed = window.confirm("Delete this room?");
    if (!confirmed) return;

    try {
      await deleteOwnerRoom(selectedProperty.id, room.id);
      showToast("Room deleted.", "success");
      await loadProperties(false);
      setSelectedPropertyId(selectedProperty.id);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to delete room.";
      showToast(message, "error");
    }
  };

  const handleDeleteRoomImage = async (property: Property, room: Room, image: RoomImage) => {
    try {
      await deleteRoomImage(image.id);
      showToast("Room image removed.", "success");
      await loadProperties(false);
      setSelectedPropertyId(property.id);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to remove room image.";
      showToast(message, "error");
    }
  };

  const handleOpenRoomModal = (property: Property, room: Room | null) => {
    setRoomModalState({ open: true, property, room });
  };

  return (
    <>
      <div className="space-y-6 pb-24">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[color:var(--ink)]">Your Properties</h1>
            <p className="text-sm text-gray-500">Organize your dorm listings, rooms, and services.</p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="hidden items-center gap-2 rounded-full bg-[color:var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:flex"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add property
          </button>
        </header>

        {toast ? (
          <div
            className={`fixed left-1/2 top-6 z-50 w-[90%] max-w-sm -translate-x-1/2 rounded-2xl px-4 py-3 text-sm text-white shadow-lg ${
              toast.variant === "success" ? "bg-emerald-500" : "bg-red-500"
            }`}
          >
            {toast.message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3).keys()].map((index) => (
              <div key={index} className="animate-pulse rounded-3xl border border-gray-100 bg-white p-4">
                <div className="h-32 rounded-2xl bg-gray-100" />
                <div className="mt-4 space-y-3">
                  <div className="h-4 w-1/2 rounded bg-gray-100" />
                  <div className="h-3 w-1/3 rounded bg-gray-100" />
                  <div className="h-10 rounded-2xl bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length ? (
          <div className="grid grid-cols-1 gap-4">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onEdit={() => handleEditProperty(property)}
                onView={() => setSelectedPropertyId(property.id)}
                onDelete={() => handleDeleteProperty(property)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--brand-soft)] text-[color:var(--brand)]">
            <Icon name="building" className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[color:var(--ink)]">No properties yet</h2>
            <p className="mt-2 text-sm text-gray-500">
              Start by adding your first property to manage rooms, pricing, and amenities in one place.
            </p>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <Icon name="plus" className="h-4 w-4" />
              Add property
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="fixed bottom-24 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--brand)] text-white shadow-xl transition hover:scale-105 sm:hidden"
        >
          <Icon name="plus" className="h-6 w-6" />
        </button>
      </div>

      <BottomMenu />

      <PropertyFormModal
        open={propertyModalState.open}
        property={propertyModalState.property}
        onClose={() => setPropertyModalState({ open: false, property: null })}
        onSubmit={handlePropertyFormSubmit}
        isSubmitting={isSavingProperty}
        onDeleteImage={handleDeletePropertyImage}
      />

      <RoomFormModal
        open={roomModalState.open}
        property={roomModalState.property}
        room={roomModalState.room}
        onClose={() => setRoomModalState({ open: false, property: null, room: null })}
        isSubmitting={isSavingRoom}
        onSubmit={handleRoomFormSubmit}
        onDeleteImage={handleDeleteRoomImage}
      />

      {selectedProperty ? (
        <PropertyDetailDrawer
          property={selectedProperty}
          onClose={() => setSelectedPropertyId(null)}
          onEdit={() => handleEditProperty(selectedProperty)}
          onAddRoom={() => handleOpenRoomModal(selectedProperty, null)}
          onEditRoom={(room) => handleOpenRoomModal(selectedProperty, room)}
          onDeleteRoom={handleDeleteRoom}
          onDeleteRoomImage={handleDeleteRoomImage}
          isRefreshing={refreshing}
        />
      ) : null}
    </>
  );
}
