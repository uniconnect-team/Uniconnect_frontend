import { Navigate, useRoutes } from "react-router-dom";
import { Layout } from "./Layout";
import { RoleSelect } from "../features/auth/pages/RoleSelect";
import { SeekerLogin } from "../features/auth/pages/SeekerLogin";
import { OwnerLogin } from "../features/auth/pages/OwnerLogin";
import { Signup } from "../features/auth/pages/Signup";
import { OwnerSignup } from "../features/auth/pages/OwnerSignup";
import { SeekerCompleteProfile } from "../features/auth/pages/SeekerCompleteProfile";
import { OwnerCompleteProfile } from "../features/auth/pages/OwnerCompleteProfile";
import { OwnerDashboard } from "../features/home/pages/OwnerDashboard";
import { SeekerHome } from "../features/home/pages/SeekerHome";
import { Landing } from "../features/home/pages/Landing";


// been folded into the seeker experience. Keep a local alias so that any
// persisted navigation state (e.g. the browser reopening `/login/university`)
// continues to resolve without throwing at runtime.
const UniversityLogin = SeekerLogin;

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
        { path: "/owners/dashboard", element: <OwnerDashboard /> },
        { path: "/home", element: <Navigate to="/seekers/home" replace /> },
        { path: "/role-select", element: <Navigate to="/choose-role" replace /> },
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ]);

  return element;
}
