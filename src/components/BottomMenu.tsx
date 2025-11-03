import { Link, useLocation } from "react-router-dom";
import { Icon } from "./Icon";

const menuItems = [
  { name: "Home", path: "/seekers/home", ownerPath: "/owners/dashboard", icon: "building" as const },
  { name: "Properties", path: "/chat", icon: "building" as const },
  { name: "Favorites", path: "/favorites", icon: "heart" as const },
  { name: "Profile", path: "/profile", icon: "user" as const },
];

export function BottomMenu() {
  const location = useLocation();
  const defaultHomePath = typeof window !== "undefined" ? localStorage.getItem("defaultHomePath") ?? "" : "";
  const isOwner = defaultHomePath.startsWith("/owners/");

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="mx-auto max-w-md px-4">
        <div className="flex items-center justify-around h-16">
          {menuItems.map((item) => {
            if (!isOwner && item.ownerOnly) {
              return null;
            }

            const targetPath = isOwner && item.ownerPath ? item.ownerPath : item.path;
            const label = isOwner && item.ownerName ? item.ownerName : item.name;
            const isActive = location.pathname === targetPath;

            return (
              <Link
                key={item.key}
                to={targetPath}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                  isActive ? "text-[color:var(--brand)]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon name={item.icon} className="w-6 h-6" />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
