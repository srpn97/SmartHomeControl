import "./App.scss";
import HomePage from "./pages/HomePage/HomePage.js";
// import About from "./Pages/About/About.js"
import * as React from "react";
import { AnimatePresence } from "framer-motion";
import { useLocation, useRoutes } from "react-router-dom";
import HelpPage from "./pages/HelpPage/HelpPage.js";
import Header from "./components/Header/Header.js"

export default function App() {
  const element = useRoutes([
    {
      path: "/",
      element: <HomePage />
    },
    {
      path: "/help",
      element: <HelpPage />
    }
  ]);

  const location = useLocation();

  if (!element) return null;

  return (
    <>
      <Header></Header>
      <AnimatePresence mode="wait" initial={false}>
        {React.cloneElement(element, { key: location.pathname })}
      </AnimatePresence>
    </>
  );
}
