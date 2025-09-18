// src/components/Layout.jsx
import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { getSidebarRoutes, getRouteNameByPath } from "../config/routes";
import { Button } from 'primereact/button'; 

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
    <div className="flex h-screen bg-gray-100">
      <div className={`bg-white shadow-lg transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'
        }`}>
        <div className="flex items-center justify-between p-4 border-b">
          {isSidebarOpen && (

            <Button label="Check" icon="pi pi-check" />
          )}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-lg hover:bg-gray-100 bg-white"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isSidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                />
              )}
            </svg>
          </button>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarRoutes.map((route, index) => (
              <li key={index}>
                <Link
                  to={route.path}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${isActive(route.path)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {route.icon}
                  {isSidebarOpen && <span>{route.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>        
      </div>

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {getRouteNameByPath(location.pathname)}
            </h2>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-5 5v-5z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19c-5 0-8-3-8-6s3-6 8-6 8 3 8 6-3 6-8 6z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
