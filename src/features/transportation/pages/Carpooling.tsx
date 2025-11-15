import { Icon } from "../../../components/Icon";
import { BottomMenu } from "../../../components/BottomMenu";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export function Carpooling() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  return (
    <>
      <div className="space-y-6 pb-20">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <Icon name="chevron-left" />
          </button>
          <h1 className="text-lg font-semibold">Carpooling</h1>
        </header>

        {/* Search Section */}
        <div className="p-4 space-y-3 bg-gray-50 rounded-xl shadow-sm">
          <h2 className="font-semibold">Find a ride</h2>

          <input
            type="text"
            placeholder="Departure"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full border rounded-md p-2"
          />

          <input
            type="text"
            placeholder="Destination"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full border rounded-md p-2"
          />

          <button className="w-full bg-green-600 text-white p-2 rounded-lg">
            Search rides
          </button>
        </div>

        {/* Suggested Rides */}
        <div className="p-4">
          <h2 className="font-semibold mb-3">Suggested rides</h2>
          <p className="text-sm text-gray-400">
            No available rides yet. Check back soon!
          </p>
        </div>

        {/* My Bookings */}
        <div className="p-4">
          <h2 className="font-semibold mb-3">My bookings</h2>
          <p className="text-sm text-gray-400">
            You haven't booked any rides yet.
          </p>
        </div>
      </div>

      <BottomMenu />
    </>
  );
}
