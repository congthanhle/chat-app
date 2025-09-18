// src/config/routes.jsx
import Home from "../pages/Home";
import Room from "../pages/Room";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";

export const routes = [
  {
    path: "/",
    name: "Chat Rooms",
    component: Home,
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
        />
      </svg>
    ),
    showInSidebar: true,
  },
  {
    path: "/rooms/:roomId",
    name: "Chat Room",
    component: Room,
    icon: null,
    showInSidebar: false, // Don't show dynamic routes in sidebar
  },
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
    showInSidebar: true,
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings,
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    showInSidebar: true,
  },
];

// Helper function to get route name by pathname
export const getRouteNameByPath = (pathname) => {
  // Handle dynamic routes like /rooms/:roomId
  if (pathname.startsWith('/rooms/')) {
    return 'Chat Room';
  }

  const route = routes.find(route => route.path === pathname);
  return route ? route.name : 'Page';
};

// Get routes that should be shown in sidebar
export const getSidebarRoutes = () => {
  return routes.filter(route => route.showInSidebar);
};
