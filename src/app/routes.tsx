import { useRoutes } from "react-router-dom";
import { Layout } from "./Layout";
import { RoleSelect } from "../features/auth/pages/RoleSelect";
import { SeekerLogin } from "../features/auth/pages/SeekerLogin";
import { OwnerLogin } from "../features/auth/pages/OwnerLogin";
import { Signup } from "../features/auth/pages/Signup";
import { Home } from "../features/home/pages/Home";

export function AppRoutes() {
  const element = useRoutes([
    {
      element: <Layout />,
      children: [
        { path: "/", element: <RoleSelect /> },
        { path: "/login/seeker", element: <SeekerLogin /> },
        { path: "/login/owner", element: <OwnerLogin /> },
        { path: "/signup", element: <Signup /> },
        { path: "/home", element: <Home /> },
      ],
    },
  ]);

  return element;
}
