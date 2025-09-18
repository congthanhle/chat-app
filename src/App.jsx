import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { routes } from "./config/routes";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {routes.map((route, index) => {
            const Component = route.component;
            if (route.path === "/") {
              return <Route key={index} index element={<Component />} />;
            }
            return (
              <Route
                key={index}
                path={route.path}
                element={<Component />}
              />
            );
          })}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
