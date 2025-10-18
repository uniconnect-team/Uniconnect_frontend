import { Navigate, useRoutes } from "react-router-dom";
import { Layout } from "./Layout";
import { RoleSelect } from "../features/auth/pages/RoleSelect";
import { SeekerLogin } from "../features/auth/pages/SeekerLogin";
import { OwnerLogin } from "../features/auth/pages/OwnerLogin";
import { Signup } from "../features/auth/pages/Signup";
import { OwnerSignup } from "../features/auth/pages/OwnerSignup";
import { Home } from "../features/home/pages/Home";
import { Landing } from "../features/home/pages/Landing";

// Older builds referenced a dedicated UniversityLogin component which has since
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
        { path: "/home", element: <Home /> },
        { path: "/role-select", element: <Navigate to="/choose-role" replace /> },
        { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ]);

  return element;
}
