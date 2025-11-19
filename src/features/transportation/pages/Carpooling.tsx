import { Icon } from "../../../components/Icon";
import { BottomMenu } from "../../../components/BottomMenu";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { LEBANON_CITIES } from "../../../data/cities";
import { TIME_SLOTS } from "../../../data/times";
import { api } from "../../../lib/api";
import { ModalPortal } from "../../../components/ModalPortal";

type CarpoolRide = {
  id: number;
  driver: number;
  driver_name: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  duration_minutes?: number | null;
  vehicle_model?: string;
  seats_available: number;
  created_at: string;
};

type CarpoolBooking = {
  id: number;
  ride: CarpoolRide; // ride object inside booking
};

export function Carpooling() {
  const navigate = useNavigate();

  const [rides, setRides] = useState<CarpoolRide[]>([]);
  const [myBookings, setMyBookings] = useState<CarpoolBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search filters
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [timeSlot, setTimeSlot] = useState("");

  // New ride form
  const [showCreate, setShowCreate] = useState(false);
  const [newOrigin, setNewOrigin] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDuration, setNewDuration] = useState("");
  const [newVehicleModel, setNewVehicleModel] = useState("");
  const [newSeats, setNewSeats] = useState(1);
  const [creating, setCreating] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  // LOAD RIDES
  useEffect(() => {
    const fetchRides = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await api<CarpoolRide[]>("/api/v1/carpooling/rides/", {
          method: "GET",
        });
        setRides(res);
      } catch (err) {
        console.error(err);
        setError("Failed to load rides.");
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, []);

  // LOAD MY BOOKINGS
  useEffect(() => {
    const loadBookings = async () => {
      try {
        const res = await api<CarpoolBooking[]>("/api/v1/carpooling/bookings/");
        setMyBookings(res);
      } catch (err) {
        console.error("Failed loading bookings", err);
      }
    };

    loadBookings();
  }, []);

  // FILTERED RIDES
  const filteredRides = useMemo(() => {
    return rides.filter((ride) => {
      const matchesFrom =
        !fromCity || ride.origin.toLowerCase().includes(fromCity.toLowerCase());

      const matchesTo =
        !toCity ||
        ride.destination.toLowerCase().includes(toCity.toLowerCase());

      const matchesTime =
        !timeSlot || ride.time.startsWith(timeSlot.split(" ")[0]);

      return matchesFrom && matchesTo && matchesTime;
    });
  }, [rides, fromCity, toCity, timeSlot]);

  const toggleFavorite = (id: number) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // CREATE RIDE
  const handleCreateRide = async () => {
    if (!newOrigin || !newDestination || !newDate || !newTime) {
      alert("Please fill origin, destination, date, and time.");
      return;
    }

    setCreating(true);

    try {
      const me = JSON.parse(localStorage.getItem("user") || "{}");

      const payload: any = {
        driver: me.id,
        origin: newOrigin,
        destination: newDestination,
        date: newDate,
        time: newTime,
        seats_available: newSeats,
      };

      if (newDuration) payload.duration_minutes = Number(newDuration);
      if (newVehicleModel) payload.vehicle_model = newVehicleModel;

      const res = await api<CarpoolRide>("/api/v1/carpooling/rides/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setRides((prev) => [...prev, res]);
      setShowCreate(false);
      setNewOrigin("");
      setNewDestination("");
      setNewDate("");
      setNewTime("");
      setNewDuration("");
      setNewVehicleModel("");
      setNewSeats(1);
    } catch (err) {
      console.error(err);
      alert("Failed to create ride.");
    } finally {
      setCreating(false);
    }
  };

  // BOOK RIDE
  const handleBookRide = async (ride: CarpoolRide) => {
    // prevent double booking on frontend
    const alreadyBooked = myBookings.some((b) => b.ride.id === ride.id);
    if (alreadyBooked) {
      alert("You already booked this ride.");
      return;
    }

    if (ride.seats_available <= 0) {
      alert("This ride is full.");
      return;
    }

    try {
      // /book/ returns a CarpoolBooking, not a CarpoolRide
      const newBooking = await api<CarpoolBooking>(
        `/api/v1/carpooling/rides/${ride.id}/book/`,
        { method: "POST" }
      );

      const updatedRide = newBooking.ride;

      // Update rides list with updated ride coming from backend
      setRides((prev) =>
        prev.map((r) => (r.id === updatedRide.id ? updatedRide : r))
      );

      // Add to "My bookings" so UI shows it immediately
      setMyBookings((prev) => [...prev, newBooking]);

      alert("Seat booked!");
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.detail ||
        err?.message ||
        "Failed to book seat.";
      alert(msg);
    }
  };

  return (
    <>
      <div className="space-y-6 pb-24">
        {/* HEADER */}
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <Icon name="chevron-left" />
            </button>
            <h1 className="text-lg font-semibold">Carpooling</h1>
          </div>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-600 text-white text-sm"
          >
            <Icon name="plus" />
            <span>Add ride</span>
          </button>
        </header>

        {/* SEARCH */}
        <div className="p-4 space-y-3 bg-gray-50 rounded-xl shadow-sm">
          <h2 className="font-semibold">Find a ride</h2>

          <div>
            <label className="text-xs text-gray-500">From</label>
            <select
              value={fromCity}
              onChange={(e) => setFromCity(e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
            >
              <option value="">Anywhere</option>
              {LEBANON_CITIES.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">To</label>
            <select
              value={toCity}
              onChange={(e) => setToCity(e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
            >
              <option value="">Anywhere</option>
              {LEBANON_CITIES.map((city) => (
                <option key={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Time</label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full border rounded-md p-2 text-sm"
            >
              <option value="">Any time</option>
              {TIME_SLOTS.map((slot) => (
                <option key={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        {/* AVAILABLE RIDES */}
        <div className="px-4 space-y-3">
          <h2 className="font-semibold">Available rides</h2>

          {loading && <p className="text-sm text-gray-400">Loading…</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {!loading && filteredRides.length === 0 && !error && (
            <p className="text-sm text-gray-400">
              No matching rides. Try other filters or add your own ride.
            </p>
          )}

          <div className="space-y-3">
            {filteredRides.map((ride) => {
              const isFavorite = favoriteIds.includes(ride.id);
              const alreadyBooked = myBookings.some(
                (b) => b.ride.id === ride.id
              );

              const isFull = ride.seats_available === 0;

              return (
                <div
                  key={ride.id}
                  className="border rounded-lg p-3 bg-white shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {ride.origin} → {ride.destination}
                      </p>
                      <p className="text-xs text-gray-500">
                        Driver: {ride.driver_name || "Anonymous"}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleFavorite(ride.id)}
                      className={`text-xs px-2 py-1 rounded-full border ${
                        isFavorite
                          ? "bg-yellow-100 border-yellow-400 text-yellow-700"
                          : "bg-gray-50 border-gray-200 text-gray-500"
                      }`}
                    >
                      {isFavorite ? "★ Favorite" : "☆ Favorite"}
                    </button>
                  </div>

                  <div className="flex gap-4 text-xs text-gray-600 mt-2">
                    <span>{ride.date}</span>
                    <span>{ride.time.slice(0, 5)}</span>
                    {ride.duration_minutes && (
                      <span>{ride.duration_minutes} min</span>
                    )}
                    {ride.vehicle_model && <span>{ride.vehicle_model}</span>}
                    <span>
                      Seats:{" "}
                      <strong
                        className={
                          ride.seats_available === 0
                            ? "text-red-600"
                            : "text-green-700"
                        }
                      >
                        {ride.seats_available}
                      </strong>
                    </span>
                  </div>

                  <button
                    disabled={isFull || alreadyBooked}
                    onClick={() => handleBookRide(ride)}
                    className={`mt-2 w-full text-sm py-1.5 rounded-lg ${
                      isFull
                        ? "bg-gray-200 text-gray-500"
                        : alreadyBooked
                        ? "bg-blue-100 text-blue-700"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {isFull ? "Full" : alreadyBooked ? "Booked" : "Book seat"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* MY BOOKINGS */}
        <div className="px-4 pb-4">
          <h2 className="font-semibold mb-2">My bookings</h2>

          {myBookings.length === 0 && (
            <p className="text-sm text-gray-400">You have no bookings yet.</p>
          )}

          <div className="space-y-3">
            {myBookings.map((booking) => {
              const ride = booking.ride;

              return (
                <div
                  key={booking.id}
                  className="border rounded-lg p-3 bg-white shadow-sm"
                >
                  <p className="text-sm font-semibold">
                    {ride.origin} → {ride.destination}
                  </p>

                  <p className="text-xs text-gray-500">
                    Driver: {ride.driver_name}
                  </p>

                  <div className="flex gap-4 text-xs text-gray-600 mt-2">
                    <span>📅 {ride.date}</span>
                    <span>⏰ {ride.time.slice(0, 5)}</span>
                    {ride.vehicle_model && <span>🚗 {ride.vehicle_model}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CREATE RIDE MODAL */}
        {showCreate && (
          <ModalPortal>
            <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-[9999]">
              <div className="bg-white w-full max-w-md rounded-t-2xl p-4 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Offer a ride</h2>
                  <button
                    onClick={() => setShowCreate(false)}
                    className="p-1 rounded-full hover:bg-gray-100"
                  >
                    <Icon name="close" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">From</label>
                    <select
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="">Select city</option>
                      {LEBANON_CITIES.map((city) => (
                        <option key={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">To</label>
                    <select
                      value={newDestination}
                      onChange={(e) => setNewDestination(e.target.value)}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="">Select city</option>
                      {LEBANON_CITIES.map((city) => (
                        <option key={city}>{city}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="flex-1 border rounded-md p-2"
                    />
                    <select
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="flex-1 border rounded-md p-2"
                    >
                      <option value="">Select time</option>
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot.split(" ")[0] + ":00"}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={5}
                      step={5}
                      placeholder="Duration (min)"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      className="flex-1 border rounded-md p-2"
                    />

                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={newSeats}
                      onChange={(e) => setNewSeats(Number(e.target.value))}
                      className="flex-1 border rounded-md p-2"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Vehicle model (optional)"
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    className="w-full border rounded-md p-2"
                  />
                </div>

                <button
                  onClick={handleCreateRide}
                  disabled={creating}
                  className="w-full bg-green-600 text-white py-2 rounded-xl font-semibold disabled:bg-gray-300"
                >
                  {creating ? "Creating..." : "Publish ride"}
                </button>
              </div>
            </div>
          </ModalPortal>
        )}
      </div>

      <BottomMenu />
    </>
  );
}
