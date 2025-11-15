// FILE: src/components/BottomMenu.tsx
import { Link, useLocation } from "react-router-dom";
import { Icon, type IconName } from "./Icon";

export function BottomMenu() {
  const location = useLocation();
  const defaultHomePath = localStorage.getItem("defaultHomePath") || "/seekers/home";
  const homeActivePaths = new Set(["/seekers/home", "/owners/dashboard", defaultHomePath]);

  type MenuItem = {
    name: string;
    path: string;
    icon: IconName;
    isActive?: (currentPath: string) => boolean;
  };

  const menuItems: MenuItem[] = [
    {
      name: "Home",
      path: defaultHomePath,
      icon: "building" as const,
      isActive: (currentPath: string) => homeActivePaths.has(currentPath),
    },
    { name: "Carpool", path: "/carpooling", icon: "globe" as const },
    { name: "Chat", path: "/chat", icon: "messages-square" as const },
    { name: "Favorites", path: "/favorites", icon: "heart" as const },
    { name: "Profile", path: "/profile", icon: "user" as const },
    

  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="mx-auto max-w-md px-4">
        <div className="flex items-center justify-around h-16">
          {menuItems.map((item) => {
            const isActive = typeof item.isActive === "function"
              ? item.isActive(location.pathname)
              : location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                  isActive
                    ? "text-[color:var(--brand)]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon name={item.icon} className="w-6 h-6" />
                <span className="text-xs font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}