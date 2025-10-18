import { useNavigate } from "react-router-dom";
import { Icon } from "../../../components/Icon";
import type { IconName } from "../../../components/Icon";

//role selection, dorm owner or student looking for dorm, this is the first page user sees when they want to login
const cards: Array<{ label: string; path: string; icon: IconName }> = [
  {
    label: "Dormitory Seeker",
    path: "/login/seeker",
    icon: "bed",
  },
  {
    label: "Dormitory Owner",
    path: "/login/owner",
    icon: "building",
  },
  {
    label: "University Student",
    path: "/login/university",
    icon: "users",
  },
];

export function RoleSelect() { //role selection page, branch here for exceptions
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <button
        type="button"
        className="text-gray-500 flex items-center gap-2"
        onClick={() => navigate(-1)}
      >
        <Icon name="chevron-left" className="w-5 h-5" />
        <span className="text-sm">Back</span>
      </button>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Welcome</h1>
        <p className="text-sm text-gray-500">I want to login as</p>
      </div>
      <div className="space-y-4">
        {cards.map((card) => (
          <button
            key={card.path}
            type="button"
            onClick={() => navigate(card.path)}
            className="w-full bg-white rounded-2xl shadow-md px-4 py-4 flex items-center gap-4 active:scale-[.99] transition transform focus:outline-none focus:ring-2 focus:ring-[color:var(--brand)] focus:ring-offset-2"
          >
            <div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-[rgba(42,194,74,0.18)] via-[#E6FAEE] to-white flex items-center justify-center shadow-sm"
              aria-hidden="true"
            >
              <Icon name={card.icon} className="w-8 h-8 text-[color:var(--brand)]" />
            </div>
            <div className="text-left">
              <p className="font-medium text-base text-[color:var(--ink)]">{card.label}</p>
            </div>
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-gray-500">
        Need Help?{' '}
        <a href="#" className="text-[var(--brand)] font-medium">
          Click Here
        </a>
      </p>
    </div>
  );
}
