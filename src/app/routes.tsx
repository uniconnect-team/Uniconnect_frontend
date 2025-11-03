import { Navigate, useRoutes } from "react-router-dom";
import { Layout } from "./Layout";
import { RoleSelect } from "../features/auth/pages/RoleSelect";
import { SeekerLogin } from "../features/auth/pages/SeekerLogin";
import { OwnerLogin } from "../features/auth/pages/OwnerLogin";
import { Signup } from "../features/auth/pages/Signup";
import { OwnerSignup } from "../features/auth/pages/OwnerSignup";
import { SeekerCompleteProfile } from "../features/auth/pages/SeekerCompleteProfile";
import { OwnerCompleteProfile } from "../features/auth/pages/OwnerCompleteProfile";
import { SeekerHome } from "../features/home/pages/SeekerHome";
import { Landing } from "../features/home/pages/Landing";
import { Profile } from "../features/profile/pages/Profile";
import { Notifications } from "../features/notifications/pages/Notifications";
import { Roommate } from "../features/roommate/pages/Roommate";
import { Favorites } from "../features/favorites/pages/Favorites";
import { Transportation } from "../features/transportation/pages/Transportation";
import { OwnerProperties } from "../features/properties/pages/OwnerProperties";

export function AppRoutes() {
  const element = useRoutes([
    {
      element: <Layout />,
      children: [
        { path: "/", element: <Landing /> },
        { path: "/choose-role", element: <RoleSelect /> },
        { path: "/login/seeker", element: <SeekerLogin /> },
        { path: "/login/owner", element: <OwnerLogin /> },
        { path: "/login/university", element: <Navigate to="/login/seeker" replace /> },
        { path: "/signup", element: <Signup /> },
        { path: "/signup/owner", element: <OwnerSignup /> },
        { path: "/complete-profile/seeker", element: <SeekerCompleteProfile /> },
        { path: "/complete-profile/owner", element: <OwnerCompleteProfile /> },
        { path: "/seekers/home", element: <SeekerHome /> },
        { path: "/owners/properties", element: <OwnerProperties /> },
        { path: "/owners/dashboard", element: <Navigate to="/owners/properties" replace /> },
        { path: "/profile", element: <Profile /> },
        { path: "/notifications", element: <Notifications /> },
        { path: "/roommate", element: <Roommate /> },
        { path: "/favorites", element: <Favorites /> },
        { path: "/transportation", element: <Transportation /> },
        { path: "/home", element: <Navigate to="/seekers/home" replace /> },
        { path: "/role-select", element: <Navigate to="/choose-role" replace /> },
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ]);
  return element;
}