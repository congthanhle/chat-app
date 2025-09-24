import Home from "../pages/Home";
import Room from "../pages/Room";
// import Profile from "../pages/Profile";
// import Settings from "../pages/Settings";

export const routes = [
  {
    path: "/",
    name: "Chat Rooms",
    component: Home,
    icon: <i className="pi pi-comments"></i>,
    showInSidebar: true,
  },
  {
    path: "/rooms/:roomId",
    name: "Chat Room",
    component: Room,
    icon: null,
    showInSidebar: false,
  },
  // {
  //   path: "/profile",
  //   name: "Profile",
  //   component: Profile,
  //   icon: <i className="pi pi-user"></i>,
  //   showInSidebar: true,
  // },
  // {
  //   path: "/settings",
  //   name: "Settings",
  //   component: Settings,
  //   icon: <i className="pi pi-cog"></i>,
  //   showInSidebar: true,
  // },
];

export const getRouteNameByPath = (pathname) => {
  if (pathname.startsWith('/rooms/')) {
    return 'Chat Room';
  }

  const route = routes.find(route => route.path === pathname);
  return route ? route.name : 'Page';
};

export const getSidebarRoutes = () => {
  return routes.filter(route => route.showInSidebar);
};
