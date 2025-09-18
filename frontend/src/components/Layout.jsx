// src/components/Layout.jsx
import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { getSidebarRoutes, getRouteNameByPath } from "../config/routes";

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const sidebarRoutes = getSidebarRoutes();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100">
      <div className={`bg-white shadow-lg transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'
        }`}>
        <div className="flex items-center justify-between p-4 border-b">
          {isSidebarOpen && (
            <h2 className="text-xl font-bold text-gray-800">Chat App</h2>
          )}
          <button
            onClick={toggleSidebar}
            className="py-1 px-2 rounded-lg"
          >
            {isSidebarOpen ? (
              <i className="pi pi-angle-double-left"></i>
            ) : (
              <i className="pi pi-angle-double-right"></i>
            )}
          </button>
        </div>
        <nav className="p-2">
          <ul className="space-y-2">
            {sidebarRoutes.map((route, index) => (
              <li key={index}>
                <Link
                  to={route.path}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive(route.path)
                    ? 'bg-cyan-100 text-cyan-700'
                    : 'text-gray-700 hover:bg-gray-100'
                    } ${!isSidebarOpen && 'justify-center'}`}
                >
                  {route.icon}
                  {isSidebarOpen && <span>{route.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-800 mt-1">
            {getRouteNameByPath(location.pathname)}
          </h2>
        </header>
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
