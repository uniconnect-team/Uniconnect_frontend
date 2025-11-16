import { Icon } from "../../../components/Icon";
import { BottomMenu } from "../../../components/BottomMenu";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { LEBANON_CITIES } from "../../../data/cities";
import { TIME_SLOTS } from "../../../data/times";

export function Carpooling() {
  const navigate = useNavigate();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [time, setTime] = useState("");

  return (
    <>
      <div className="space-y-6 pb-20">

        {/* Header */}
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
        <div className="p-4 space-y-4 bg-gray-50 rounded-xl shadow-sm">
          <h2 className="font-semibold text-gray-700">Find a ride</h2>

          {/* From Dropdown */}
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full border rounded-md p-2"
          >
            <option value="">Departure</option>
            {LEBANON_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* To Dropdown */}
          <select
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full border rounded-md p-2"
          >
            <option value="">Destination</option>
            {LEBANON_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* Time Dropdown */}
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full border rounded-md p-2"
          >
            <option value="">Departure Time</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>

          <button className="w-full bg-green-600 text-white p-2 rounded-lg">
            Search rides
          </button>
        </div>

        {/* Suggested Rides */}
        <div className="p-4 space-y-3">
          <h2 className="font-semibold">Suggested rides</h2>

          {/* Dummy Ride Card */}
          <div className="border rounded-xl p-4 shadow-sm bg-white">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">Beirut → Jbeil</p>
                <p className="text-sm text-gray-500">Driver: Mario Haddad</p>
                <p className="text-sm text-gray-500">Time: 5:00 PM</p>
                <p className="text-sm text-gray-500">Seats Available: 2</p>
              </div>
              <Icon name="briefcase" className="w-8 h-8 text-green-600" />
            </div>

            <div className="flex gap-3 mt-3">
              <button className="flex-1 bg-green-600 text-white p-2 rounded-lg">
                Book seat
              </button>
              <button className="flex-1 bg-gray-200 text-gray-700 p-2 rounded-lg">
                Add to favorites
              </button>
            </div>
          </div>
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
