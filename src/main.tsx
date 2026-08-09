import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./styles/site.css";

// בנייה רגילה משתמשת ב-BrowserRouter. בנייה עם VITE_HASH_ROUTER=1 מייצרת
// קובץ יחיד שאפשר לפתוח מכל נתיב, לתצוגה מקדימה שלא יושבת על שרת משלה.
const Router = import.meta.env.VITE_HASH_ROUTER === "1" ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router>
      <App />
    </Router>
  </StrictMode>
);
