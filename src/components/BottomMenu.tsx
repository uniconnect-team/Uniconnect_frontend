// FILE: src/components/BottomMenu.tsx
import { Link, useLocation } from "react-router-dom";
import { Icon, type IconName } from "./Icon";
import { useEffect, useState } from "react";
import { getMe } from "../lib/api";

export function BottomMenu() {
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const defaultHomePath = localStorage.getItem("defaultHomePath") || "/seekers/home";
  const homeActivePaths = new Set(["/seekers/home", "/owners/dashboard", defaultHomePath]);

  useEffect(() => {
    // Get user role on mount
    getMe()
      .then((user) => {
        setUserRole(user.role);
      })
      .catch(() => {
        setUserRole(null);
      });
  }, []);

  type MenuItem = {
    name: string;
    path: string;
    icon: IconName;
    isActive?: (currentPath: string) => boolean;
  };

  // Build menu items based on user role
  const getMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = [
      {
        name: "Home",
        path: defaultHomePath,
        icon: "building" as const,
        isActive: (currentPath: string) => homeActivePaths.has(currentPath),
      },
    ];

    // Add Roommate only for SEEKER
    if (userRole === "SEEKER") {
      items.push({ name: "Roommate", path: "/roommate", icon: "users" as const });
    }

    // Profile for everyone
    items.push({ name: "Profile", path: "/profile", icon: "user" as const });

    return items;
  };

  const menuItems = getMenuItems();

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